package com.example.exercise5.ui.inbox;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.OpenableColumns;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Base64;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.example.exercise5.R;
import com.example.exercise5.data.api.ApiClient;
import com.example.exercise5.data.session.SessionManager;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;

import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.Path;

public class ComposeMailBottomSheet extends BottomSheetDialogFragment {

    // API interface
    interface ComposeWireApi {
        @POST("api/mails")
        Call<ResponseBody> createDraft(@Body Map<String, Object> body);

        @PATCH("api/mails/{id}")
        Call<ResponseBody> updateDraft(@Path("id") String id,
                                       @Body Map<String, Object> body);

        @POST("api/mails")
        Call<ResponseBody> send(@Body Map<String, Object> body);

        @DELETE("api/mails/{id}")
        Call<ResponseBody> deleteDraft(@Path("id") String id);
    }

    public interface OnSentListener { void onSent(); }
    private OnSentListener listener;
    public void setOnSentListener(OnSentListener l) { this.listener = l; }

    private EditText inputTo, inputSubject, inputBody;
    private ProgressBar progress;
    private Button btnSend, btnCancel, btnAttach;
    private LinearLayout attachmentPreviewContainer;

    private Call<ResponseBody> inFlight;

    // --- Draft debounce ---
    private Handler debounceHandler = new Handler(Looper.getMainLooper());
    private Runnable draftRunnable;
    private static final long DRAFT_DELAY = 500; // ms

    // Track draft ID
    private String draftId = null;

    // Keep reply chain from arguments
    private ArrayList<String> replyChain = null;

    // Attachments
    private static final int REQ_ATTACH = 42;
    private final List<Map<String,Object>> attachments = new ArrayList<>();

    @Nullable @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.bottomsheet_compose_mail, container, false);
    }

    @Override public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        inputTo = v.findViewById(R.id.inputTo);
        inputSubject = v.findViewById(R.id.inputSubject);
        inputBody = v.findViewById(R.id.inputBody);
        progress = v.findViewById(R.id.progressSend);
        btnCancel = v.findViewById(R.id.btnCancel);
        btnSend = v.findViewById(R.id.btnSend);
        btnAttach = v.findViewById(R.id.btnAttach);
        attachmentPreviewContainer = v.findViewById(R.id.attachmentPreviewContainer);

        btnCancel.setOnClickListener(view -> dismiss());
        btnSend.setOnClickListener(view -> trySend());
        btnAttach.setOnClickListener(view -> openFilePicker());

        // Debounce watcher
        TextWatcher watcher = new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                scheduleDraftSave();
            }
            @Override public void afterTextChanged(Editable s) {}
        };
        inputTo.addTextChangedListener(watcher);
        inputSubject.addTextChangedListener(watcher);
        inputBody.addTextChangedListener(watcher);

        // Prefill args (for reply/edit scenarios)
        Bundle args = getArguments();
        if (args != null) {
            ArrayList<Map<String,Object>> initAttachments = (ArrayList<Map<String,Object>>) args.getSerializable("attachmentsInit");
            if (initAttachments != null && !initAttachments.isEmpty()) {
                attachments.addAll(initAttachments);
                for (Map<String,Object> file : initAttachments) {
                    String name = (String) file.get("name");
                    int size = ((Number) file.get("size")).intValue();
                    TextView tv = new TextView(requireContext());
                    tv.setText("📎 " + name + " (" + size/1024 + " KB)");
                    attachmentPreviewContainer.addView(tv);
                }
            }
            String initTo = args.getString("toInit", null);
            String initSubject = args.getString("subjectInit", null);
            String initBody = args.getString("bodyInit", null);
            draftId = args.getString("draftId", null);
            replyChain = args.getStringArrayList("replyChain");

            if (initTo != null) inputTo.setText(initTo);
            if (initSubject != null) inputSubject.setText(initSubject);
            if (initBody != null) inputBody.setText(initBody);
        }
    }

    private void openFilePicker() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(Intent.createChooser(intent, "Select files"), REQ_ATTACH);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_ATTACH && resultCode == getActivity().RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                for (int i = 0; i < data.getClipData().getItemCount(); i++) {
                    handleFileUri(data.getClipData().getItemAt(i).getUri());
                }
            } else if (data.getData() != null) {
                handleFileUri(data.getData());
            }
        }
    }

    private void handleFileUri(Uri uri) {
        try {
            String name = "unknown";
            Cursor cursor = requireContext().getContentResolver()
                    .query(uri, null, null, null, null);
            if (cursor != null) {
                int idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (idx >= 0 && cursor.moveToFirst()) {
                    name = cursor.getString(idx);
                }
                cursor.close();
            }

            InputStream is = requireContext().getContentResolver().openInputStream(uri);
            byte[] bytes = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                assert is != null;
                bytes = is.readAllBytes();
            }
            is.close();
            String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
            String mime = requireContext().getContentResolver().getType(uri);
            if (mime == null) mime = "application/octet-stream";
            String base64WithHeader = "data:" + mime + ";base64," + base64;

            Map<String,Object> obj = new HashMap<>();
            obj.put("name", name);
            obj.put("type", mime);
            obj.put("size", bytes.length);
            obj.put("data", base64WithHeader);

            attachments.add(obj);

            TextView tv = new TextView(requireContext());
            tv.setText("📎 " + name + " (" + bytes.length/1024 + " KB)");
            attachmentPreviewContainer.addView(tv);

        } catch (Exception e) {
            Toast.makeText(requireContext(), "Failed to attach: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }


    private void scheduleDraftSave() {
        if (draftRunnable != null) debounceHandler.removeCallbacks(draftRunnable);
        draftRunnable = this::saveDraft;
        debounceHandler.postDelayed(draftRunnable, DRAFT_DELAY);
    }

    private void trySend() {
        if (draftRunnable != null) {
            debounceHandler.removeCallbacks(draftRunnable);
            draftRunnable = null;
        }
        doSend(true);
    }

    private void saveDraft() {
        ComposeWireApi api = ApiClient.get(requireContext()).create(ComposeWireApi.class);

        boolean empty = inputBody.getText().toString().trim().isEmpty()
                && inputTo.getText().toString().trim().isEmpty()
                && inputSubject.getText().toString().trim().isEmpty()
                && attachments.isEmpty();
        if (empty) {
            if (draftId != null) {
                api.deleteDraft(draftId).enqueue(new Callback<ResponseBody>() {
                    @Override
                    public void onResponse(@NonNull Call<ResponseBody> call,
                                           @NonNull Response<ResponseBody> response) {
                        if (response.isSuccessful()) {
                            Log.d("Compose", "Empty draft deleted");
                            draftId = null;
                        } else {
                            Log.e("Compose", "Failed to delete draft: " + response.code());
                        }
                    }

                    @Override
                    public void onFailure(@NonNull Call<ResponseBody> call, @NonNull Throwable t) {
                        Log.e("Compose", "Delete failed", t);
                    }
                });
            }
            return;
        }
        doSend(false);
    }

    private void doSend(boolean actuallySend) {
        String toRaw = inputTo.getText().toString().trim();
        String subject = inputSubject.getText().toString().trim();
        String content = inputBody.getText().toString().trim();
        List<String> recipients = parseRecipients(toRaw);
        if (recipients == null) recipients = new ArrayList<>();

        SessionManager sm = new SessionManager(requireContext().getApplicationContext());
        String jwt = sm.getToken();
        if (jwt == null || jwt.isEmpty()) {
            Toast.makeText(requireContext(), "You are not logged in. Please login again.", Toast.LENGTH_LONG).show();
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("to", recipients);
        payload.put("subject", subject);
        payload.put("content", content);
        payload.put("files", attachments.isEmpty() ? null : attachments);
        payload.put("scheduledSend", null);
        payload.put("send", String.valueOf(actuallySend));

        if (replyChain != null && !replyChain.isEmpty()) {
            payload.put("reply", replyChain);
        } else {
            payload.put("reply", null);
        }

        ComposeWireApi api = ApiClient.get(requireContext()).create(ComposeWireApi.class);
        Call<ResponseBody> call;

        if (actuallySend) {
            call = api.send(payload);
        } else if (draftId == null) {
            call = api.createDraft(payload);
        } else {
            call = api.updateDraft(draftId, payload);
        }

        inFlight = call;
        inFlight.enqueue(new Callback<ResponseBody>() {
            @Override public void onResponse(@NonNull Call<ResponseBody> call, @NonNull Response<ResponseBody> resp) {
                if (!isAdded()) return;
                if (resp.isSuccessful()) {
                    if (actuallySend) {
                        Toast.makeText(requireContext(), "Sent", Toast.LENGTH_SHORT).show();
                        if (draftId != null) {
                            api.deleteDraft(draftId).enqueue(new Callback<ResponseBody>() {
                                @Override public void onResponse(@NonNull Call<ResponseBody> c, @NonNull Response<ResponseBody> r) {}
                                @Override public void onFailure(@NonNull Call<ResponseBody> c, @NonNull Throwable t) {}
                            });
                        }
                        if (listener != null) listener.onSent();
                        dismiss();
                    } else {
                        if (draftId == null) {
                            try {
                                String body = resp.body() != null ? resp.body().string() : null;
                                if (body != null) {
                                    JSONObject obj = new JSONObject(body);
                                    draftId = obj.optString("id", null);
                                }
                            } catch (Exception e) {
                                Log.e("Compose", "Failed to parse draft id", e);
                            }
                        }
                    }
                } else {
                    String err = "Request failed (" + resp.code() + ")";
                    try {
                        if (resp.errorBody() != null) err += ": " + resp.errorBody().string();
                    } catch (IOException ignore) {}
                    Log.e("Compose", err);
                    Toast.makeText(requireContext(), err, Toast.LENGTH_LONG).show();
                }
            }

            @Override public void onFailure(@NonNull Call<ResponseBody> call, @NonNull Throwable t) {
                if (!isAdded()) return;
                Log.e("Compose", "Error", t);
                Toast.makeText(requireContext(), "Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private List<String> parseRecipients(String raw) {
        if (raw == null || raw.isEmpty()) {
            return new ArrayList<>();
        }
        String[] parts = raw.contains(",") ? raw.split(",") : raw.trim().split("\\s+");
        List<String> out = new ArrayList<>();
        Pattern gmail = Pattern.compile("^[A-Za-z0-9._%+-]+@gmail\\.com$");
        for (String p : parts) {
            String e = p.trim();
            if (e.isEmpty()) continue;
            if (!gmail.matcher(e).matches()) {
                inputTo.setError("Only Gmail addresses allowed. Invalid: " + e);
                return null;
            }
            out.add(e);
        }
        return out;
    }

    private void setSending(boolean sending) {
        progress.setVisibility(sending ? View.VISIBLE : View.GONE);
        btnSend.setEnabled(!sending);
        btnCancel.setEnabled(!sending);
        inputTo.setEnabled(!sending);
        inputSubject.setEnabled(!sending);
        inputBody.setEnabled(!sending);
    }

    @Override public void onDestroyView() {
        super.onDestroyView();
        if (inFlight != null) inFlight.cancel();
        if (draftRunnable != null) debounceHandler.removeCallbacks(draftRunnable);
    }
}
