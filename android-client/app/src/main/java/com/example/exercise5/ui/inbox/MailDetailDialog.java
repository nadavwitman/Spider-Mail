package com.example.exercise5.ui.inbox;

import android.app.Dialog;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Base64;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.LinearLayout;
import android.graphics.Color;
import com.example.exercise5.data.api.LabelApi;



import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.example.exercise5.R;
import com.example.exercise5.data.api.ApiClient;
import com.example.exercise5.data.model.Label;
import com.example.exercise5.data.model.Mail;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.Path;

public class MailDetailDialog extends DialogFragment {
    private LabelApi labelApi;
    private final Set<String> shownReplies = new HashSet<>();



    // --- Local Retrofit APIs ---
    interface DeleteApi {
        @DELETE("api/mails/{id}")
        Call<ResponseBody> delete(@Path("id") String id);
    }
    interface MailApi {
        @GET("api/mails/{id}")
        Call<Mail> get(@Path("id") String id);
    }

    // Liberal email extractor: matches plain email or inside "Name <email>"
    private static final Pattern EMAIL_RX =
            Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    private static String extractEmail(String s) {
        if (s == null) return null;
        Matcher m = EMAIL_RX.matcher(s);
        return m.find() ? m.group() : null;
    }

    public static MailDetailDialog newInstance(Mail mail) {
        MailDetailDialog d = new MailDetailDialog();
        Bundle b = new Bundle();
        // lightweight pass-through (only the fields we show)
        b.putString("id", mail.id);
        b.putString("from", mail.from);
        b.putString("fromEmail", mail.fromEmail);
        b.putString("subject", mail.subject);
        b.putString("content", mail.content);
        b.putString("date", mail.getFormattedDate());
        b.putStringArray("to", mail.to != null ? mail.to.toArray(new String[0]) : new String[0]);
        d.setArguments(b);
        return d;
    }

    @Override public void onStart() {
        labelApi = ApiClient.get(requireContext()).create(LabelApi.class);
        super.onStart();
        Dialog dialog = getDialog();
        if (dialog != null && dialog.getWindow() != null) {
            dialog.getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT);
        }
    }

    @NonNull @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        setStyle(DialogFragment.STYLE_NO_TITLE, 0);
        return super.onCreateDialog(savedInstanceState);
    }

    private void fetchAllLabels(Callback<List<Label>> callback) {
        LabelApi api = ApiClient.get(requireContext()).create(LabelApi.class);
        api.getLabels().enqueue(new Callback<List<Label>>() {
            @Override
            public void onResponse(@NonNull Call<List<Label>> call, @NonNull Response<List<Label>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onResponse(call, response);
                } else {
                    callback.onFailure(call, new Throwable("Failed to fetch labels"));
                }
            }

            @Override
            public void onFailure(@NonNull Call<List<Label>> call, @NonNull Throwable t) {
                callback.onFailure(call, t);
            }
        });
    }


    private void removeMailFromLabel(String mailId, Label label) {
        Map<String, String> body = new HashMap<>();
        body.put("action", "REMOVE");
        body.put("mailId", mailId);

        labelApi.updateLabelMails(label.id, new HashMap<>(), body).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "Label removed", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(getContext(), "Failed to remove label: " + response.code(), Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                Toast.makeText(getContext(), "Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        labelApi = ApiClient.get(requireContext()).create(LabelApi.class);
        View v = inflater.inflate(R.layout.dialog_mail_detail, container, false);

        Bundle b = getArguments();
        if (b == null) return v;

        String id      = b.getString("id", "");
        String subject = b.getString("subject", "(no subject)");
        String from    = b.getString("from", "");
        String fromEmailArg = b.getString("fromEmail", null);
        String date    = b.getString("date", "");
        String body    = b.getString("content", "");
        String[] toArr = b.getStringArray("to");
        String to      = (toArr != null && toArr.length > 0) ? TextUtils.join(", ", toArr) : "";

        LinearLayout attachmentsContainer = v.findViewById(R.id.attachmentsContainer);

        if (!TextUtils.isEmpty(id)) {
            MailApi api = ApiClient.get(requireContext()).create(MailApi.class);
            api.get(id).enqueue(new Callback<Mail>() {
                @Override
                public void onResponse(@NonNull Call<Mail> call, @NonNull Response<Mail> resp) {
                    if (!isAdded() || !resp.isSuccessful() || resp.body() == null) return;
                    Mail m = resp.body();

                    if (m.reply != null && !m.reply.isEmpty()) {
                        String lastReplyId = m.reply.get(m.reply.size() - 1);
                        loadRepliesRecursive(lastReplyId, attachmentsContainer, inflater, () -> {
                            showMailBlock(m, attachmentsContainer, inflater);
                        });
                    } else {
                        showMailBlock(m, attachmentsContainer, inflater);
                    }
                }

                @Override
                public void onFailure(@NonNull Call<Mail> call, @NonNull Throwable t) { }
            });
        }

        ImageButton close = v.findViewById(R.id.btnClose);
        close.setOnClickListener(view -> dismiss());

        return v;
    }

    // --- Helpers ---
    private Bitmap decodeBase64ToBitmap(String base64) {
        try {
            if (base64.startsWith("data:")) {
                int commaIndex = base64.indexOf(",");
                if (commaIndex != -1) {
                    base64 = base64.substring(commaIndex + 1);
                }
            }
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (Exception e) {
            return null;
        }
    }

    private void downloadFile(Mail.FileObj file) {
        try {
            String base64 = file.data;
            if (base64.startsWith("data:")) {
                int commaIndex = base64.indexOf(",");
                if (commaIndex != -1) {
                    base64 = base64.substring(commaIndex + 1);
                }
            }
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            File outFile = new File(requireContext().getExternalFilesDir(null), file.name);
            try (FileOutputStream fos = new FileOutputStream(outFile)) {
                fos.write(bytes);
            }
            Toast.makeText(requireContext(),
                    "Saved: " + outFile.getAbsolutePath(), Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(requireContext(),
                    "Save failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
    private void showMailBlock(Mail m, LinearLayout container, LayoutInflater inflater) {
        View mailView = inflater.inflate(R.layout.item_mail_block, container, false);

        TextView subjectTv = mailView.findViewById(R.id.detailSubject);
        subjectTv.setText(m.subject != null ? m.subject : "(no subject)");

        // --- Metadata (From, To, Date) ---
        TextView metaTv = mailView.findViewById(R.id.detailMeta);
        String to = m.to != null ? TextUtils.join(", ", m.to) : "";
        metaTv.setText(String.format(Locale.getDefault(),
                "From: %s\nTo: %s\nDate: %s",
                m.from != null ? m.from : "",
                to,
                m.getFormattedDate() != null ? m.getFormattedDate() : ""
        ));

        LinearLayout labelsContainer = mailView.findViewById(R.id.detailLabels);
        labelsContainer.removeAllViews();
        if (m.labels != null && !m.labels.isEmpty()) {
            labelsContainer.setVisibility(View.VISIBLE);
            for (String labelName : m.labels) {
                LinearLayout labelLayout = new LinearLayout(getContext());
                labelLayout.setOrientation(LinearLayout.HORIZONTAL);
                labelLayout.setBackgroundResource(R.drawable.label_background);
                labelLayout.setPadding(8, 4, 8, 4);

                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                );
                lp.setMargins(4, 0, 4, 0);
                labelLayout.setLayoutParams(lp);

                TextView tv = new TextView(getContext());
                tv.setText(labelName);
                tv.setTextColor(Color.BLACK);

                TextView btnX = new TextView(getContext());
                btnX.setText("×");
                btnX.setTextSize(16);
                btnX.setPadding(6, 0, 0, 0);
                btnX.setTextColor(Color.DKGRAY);


                btnX.setOnClickListener(v -> {
                    fetchAllLabels(new Callback<List<Label>>() {
                        @Override
                        public void onResponse(@NonNull Call<List<Label>> call,
                                               @NonNull Response<List<Label>> response) {
                            if (response.isSuccessful() && response.body() != null) {
                                for (Label l : response.body()) {
                                    if (l.name.equals(labelName)) {
                                        removeMailFromLabel(m.id, l);
                                        labelsContainer.removeView(labelLayout);
                                        break;
                                    }
                                }
                            }
                        }

                        @Override
                        public void onFailure(@NonNull Call<List<Label>> call, @NonNull Throwable t) {
                            Toast.makeText(getContext(), "Failed to fetch labels", Toast.LENGTH_SHORT).show();
                        }
                    });
                });

                labelLayout.addView(tv);
                labelLayout.addView(btnX);
                labelsContainer.addView(labelLayout);
            }
        } else {
            labelsContainer.setVisibility(View.GONE);
        }


        TextView bodyTv = mailView.findViewById(R.id.detailBody);
        bodyTv.setText(m.content != null ? m.content : "");

        // --- attachments ---
        LinearLayout attachmentsContainer = mailView.findViewById(R.id.detailAttachments);
        attachmentsContainer.removeAllViews();
        if (m.files != null && !m.files.isEmpty()) {
            for (Mail.FileObj file : m.files) {
                View item = inflater.inflate(R.layout.item_attachment, attachmentsContainer, false);
                TextView name = item.findViewById(R.id.attachmentName);
                ImageView preview = item.findViewById(R.id.attachmentPreview);
                ImageView icon = item.findViewById(R.id.attachmentIcon);

                name.setText(file.name);

                if (file.type != null && file.type.startsWith("image/")) {
                    Bitmap bmp = decodeBase64ToBitmap(file.data);
                    if (bmp != null) {
                        preview.setVisibility(View.VISIBLE);
                        preview.setImageBitmap(bmp);
                        preview.setOnClickListener(v -> downloadFile(file));
                        icon.setVisibility(View.GONE);
                    }
                } else {
                    icon.setVisibility(View.VISIBLE);
                    icon.setOnClickListener(v -> downloadFile(file));
                }

                Map<String, Object> fileMap = new HashMap<>();
                fileMap.put("name", file.name);
                fileMap.put("type", file.type);
                fileMap.put("size", file.size);
                fileMap.put("data", file.data);

                item.setTag(fileMap);
                attachmentsContainer.addView(item);
            }
        }
        View btnReply = mailView.findViewById(R.id.btnReply);
        if (btnReply != null) {
            btnReply.setOnClickListener(view -> {
                // 1) Prefer structured email from backend
                String chosen = (m.fromEmail != null && !m.fromEmail.isEmpty()) ? m.fromEmail : null;
                // 2) Fallback: extract from display string
                if (chosen == null) chosen = extractEmail(m.from);

                if (m.id == null || m.id.isEmpty()) {
                    // No id to resolve with; open compose blank + warn
                    Toast.makeText(requireContext(),
                            "Couldn’t detect sender email. Please fill the To field.",
                            Toast.LENGTH_LONG).show();
                    openComposeReply("", m.subject, m.getFormattedDate(), m.from, m.content, m.id, null);
                    return;
                }

                MailApi api = ApiClient.get(requireContext()).create(MailApi.class);
                api.get(m.id).enqueue(new Callback<Mail>() {
                    @Override public void onResponse(@NonNull Call<Mail> call, @NonNull Response<Mail> resp) {
                        if (!isAdded()) return;
                        String resolved = null;
                        List<String> replies = null;
                        if (resp.isSuccessful() && resp.body() != null) {
                            Mail mailResp = resp.body();
                            replies = mailResp.reply;
                            if (mailResp.fromEmail != null && !mailResp.fromEmail.isEmpty()) {
                                resolved = mailResp.fromEmail;
                            } else if (mailResp.from != null) {
                                resolved = extractEmail(mailResp.from);
                            }
                        }
                        if (resolved == null) {
                            Toast.makeText(requireContext(),
                                    "Couldn’t detect sender email. Please fill the To field.",
                                    Toast.LENGTH_LONG).show();
                            resolved = "";
                        }
                        openComposeReply(resolved, m.subject, m.getFormattedDate(), m.from, m.content, m.id, replies);
                    }

                    @Override public void onFailure(@NonNull Call<Mail> call, @NonNull Throwable t) {
                        if (!isAdded()) return;
                        Toast.makeText(requireContext(),
                                "Couldn’t detect sender email. Please fill the To field.",
                                Toast.LENGTH_LONG).show();
                        openComposeReply("", m.subject, m.getFormattedDate(), m.from, m.content, m.id, null);
                    }
                });
            });
        }

        View btnForward = mailView.findViewById(R.id.btnForward);
        if (btnForward != null) {
            btnForward.setOnClickListener(view -> {
                String fwdSubject = m.subject != null && m.subject.toLowerCase(Locale.ROOT).startsWith("fwd:")
                        ? m.subject
                        : "Fwd: " + (m.subject == null ? "" : m.subject);

                String headerBlock =
                        "---------- Forwarded message ---------\n" +
                                "From: " + (m.from == null ? "" : m.from) + "\n" +
                                "Date: " + (m.getFormattedDate() == null ? "" : m.getFormattedDate()) + "\n" +
                                "Subject: " + (m.subject == null ? "" : m.subject) + "\n" +
                                "To: " + (m.to == null ? "" : TextUtils.join(", ", m.to)) + "\n\n";

                String fwdBody = headerBlock + (m.content == null ? "" : m.content);

                ComposeMailBottomSheet sheet = new ComposeMailBottomSheet();
                Bundle args = new Bundle();
                // forward leaves "to" empty for the user to fill
                args.putString("subjectInit", fwdSubject);
                args.putString("bodyInit", fwdBody);
                ArrayList<Map<String,Object>> attachList = new ArrayList<>();
                if (attachmentsContainer != null && attachmentsContainer.getChildCount() > 0) {
                    for (int i = 0; i < attachmentsContainer.getChildCount(); i++) {
                        View child = attachmentsContainer.getChildAt(i);
                        Object tag = child.getTag();
                        if (tag instanceof Map) {
                            attachList.add((Map<String,Object>) tag);
                        }
                    }
                }
                args.putSerializable("attachmentsInit", attachList);

                sheet.setArguments(args);
                sheet.setOnSentListener(() -> { });
                sheet.show(getParentFragmentManager(), "compose");
                dismiss();
            });
        }

        View btnDelete = mailView.findViewById(R.id.btnDelete);
        if (btnDelete != null) {
            btnDelete.setOnClickListener(view -> {
                if (m.id == null || m.id.isEmpty()) {
                    Toast.makeText(requireContext(), "Missing mail id", Toast.LENGTH_LONG).show();
                    return;
                }
                // Call server to delete; Authorization header is auto-added by ApiClient
                DeleteApi api = ApiClient.get(requireContext()).create(DeleteApi.class);
                api.delete(m.id).enqueue(new Callback<ResponseBody>() {
                    @Override public void onResponse(@NonNull Call<ResponseBody> call, @NonNull Response<ResponseBody> resp) {
                        if (!isAdded()) return;
                        if (resp.isSuccessful()) {
                            Toast.makeText(requireContext(), "Deleted", Toast.LENGTH_SHORT).show();
                            dismiss();
                        } else {
                            String msg = "Delete failed (" + resp.code() + ")";
                            try {
                                if (resp.errorBody() != null) msg += ": " + resp.errorBody().string();
                            } catch (IOException ignored) {}
                            Toast.makeText(requireContext(), msg, Toast.LENGTH_LONG).show();
                        }
                    }
                    @Override public void onFailure(@NonNull Call<ResponseBody> call, @NonNull Throwable t) {
                        if (!isAdded()) return;
                        Toast.makeText(requireContext(), "Delete failed: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
            });
        }


        container.addView(mailView);
    }


    private void loadRepliesRecursive(String mailId, LinearLayout container, LayoutInflater inflater, Runnable onComplete) {
        if (shownReplies.contains(mailId) || !isAdded() || getContext() == null) return;
        shownReplies.add(mailId);

        MailApi api = ApiClient.get(requireContext()).create(MailApi.class);
        api.get(mailId).enqueue(new Callback<Mail>() {
            @Override
            public void onResponse(@NonNull Call<Mail> call, @NonNull Response<Mail> resp) {
                if (!isAdded() || resp.body() == null || !resp.isSuccessful()) return;
                Mail m = resp.body();

                if (m.reply != null && !m.reply.isEmpty()) {
                    String lastReplyId = m.reply.get(m.reply.size() - 1);
                    loadRepliesRecursive(lastReplyId, container, inflater, () -> {
                        showMailBlock(m, container, inflater);
                        if (onComplete != null) onComplete.run();
                    });
                } else {
                    showMailBlock(m, container, inflater);
                    if (onComplete != null) onComplete.run();
                }
            }

            @Override
            public void onFailure(@NonNull Call<Mail> call, @NonNull Throwable t) { t.printStackTrace(); }
        });
    }



    private String formatBlock(String subject, String from, String to,
                               String date, String content) {
        return String.format(Locale.getDefault(),
                "Subject: %s\nFrom: %s\nTo: %s\nDate: %s\n\n%s",
                subject != null ? subject : "(no subject)",
                from != null ? from : "",
                to != null ? to : "",
                date != null ? date : "",
                content != null ? content : "");
    }

    private void openComposeReply(String toEmail, String subject, String date,
                                  String from, String body,
                                  String currentId, List<String> replies) {
        String replySubject = subject != null && subject.toLowerCase(Locale.ROOT).startsWith("re:")
                ? subject
                : "Re: " + (subject == null ? "" : subject);
        String quoted = "";

        ComposeMailBottomSheet sheet = new ComposeMailBottomSheet();
        Bundle args = new Bundle();
        args.putString("toInit", toEmail == null ? "" : toEmail);
        args.putString("subjectInit", replySubject);
        args.putString("bodyInit", quoted);

        ArrayList<String> newReplies = new ArrayList<>();
        if (replies != null) newReplies.addAll(replies);
        if (currentId != null && !currentId.isEmpty()) newReplies.add(currentId);
        args.putStringArrayList("replyChain", newReplies);

        sheet.setArguments(args);
        sheet.setOnSentListener(() -> { });
        sheet.show(getParentFragmentManager(), "compose");
        dismiss();
    }

}
