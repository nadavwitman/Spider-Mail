package com.example.exercise5.ui.inbox;

import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Base64;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.PopupMenu;
import androidx.appcompat.widget.SwitchCompat;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.example.exercise5.R;
import com.example.exercise5.data.api.ApiClient;
import com.example.exercise5.data.api.LabelApi;
import com.example.exercise5.data.model.Label;
import com.example.exercise5.data.model.LoggedInUser;
import com.example.exercise5.data.model.Mail;
import com.example.exercise5.data.model.User;
import com.example.exercise5.data.session.SessionManager;
import com.example.exercise5.data.LoginRepository;
import com.example.exercise5.ui.login.LoginActivity;
import com.example.exercise5.ui.theme.ThemeManager;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class InboxActivity extends AppCompatActivity {

    private InboxViewModel vm;
    private MailAdapter adapter;
    private final Handler poll = new Handler(Looper.getMainLooper());
    private Runnable pollTask;
    private static final long POLL_MS = 5000L; // every 5s like React

    private DrawerLayout drawer;
    private RecyclerView labelsRv;
    private LabelAdapter labelsAdapter;
    private TextView sidebarError;
    private ImageButton btnMenu;
    private FloatingActionButton fabCompose;

    private ImageView profilePhoto;
    private TextView profileLetter;

    private final List<String> protectedLabels = Arrays.asList(
            "Inbox", "Sent", "Drafts", "Spam", "Trash", "All Mails"
    );

    private LabelApi labelApi;
    private String token;
    private static String labelName;

    // Retrofit User API
    interface UserApi {
        @retrofit2.http.GET("api/users/{id}")
        Call<User> getUser(
                @retrofit2.http.Path("id") String id,
                @retrofit2.http.Header("Authorization") String authHeader
        );
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ThemeManager.applySavedTheme(getApplicationContext());
        setContentView(R.layout.activity_inbox);

        vm = new ViewModelProvider(this).get(InboxViewModel.class);

        // Get token + logged in user ID
        SessionManager session = new SessionManager(getApplicationContext());
        token = session.getToken();
        LoggedInUser current = LoginRepository.getInstance(getApplicationContext()).getUser();
        String userId = current != null ? current.getUserId() : null;

        TextView title = findViewById(R.id.inboxTitle);
        title.setText("Inbox");
        setLabelName("Inbox");

        // Drawer setup
        drawer = findViewById(R.id.drawerLayout);
        btnMenu = findViewById(R.id.btnMenu);
        drawer.setDrawerLockMode(DrawerLayout.LOCK_MODE_LOCKED_CLOSED);
        btnMenu.setOnClickListener(v -> drawer.openDrawer(GravityCompat.START));

        profilePhoto = findViewById(R.id.profilePhoto);
        profileLetter = findViewById(R.id.profileLetter);

        // Fetch profile info if logged in
        if (userId != null && token != null) {
            UserApi userApi = ApiClient.get(getApplicationContext()).create(UserApi.class);
            userApi.getUser(userId, "Bearer " + token).enqueue(new Callback<User>() {
                @Override
                public void onResponse(@NonNull Call<User> call, @NonNull Response<User> resp) {
                    if (resp.isSuccessful() && resp.body() != null) {
                        showProfile(resp.body());
                    }
                }
                @Override
                public void onFailure(@NonNull Call<User> call, @NonNull Throwable t) {
                    Toast.makeText(InboxActivity.this,
                            "Failed to load profile: " + t.getMessage(),
                            Toast.LENGTH_SHORT).show();
                }
            });
        }

        // Labels recycler
        labelsRv = findViewById(R.id.recyclerLabels);
        sidebarError = findViewById(R.id.sidebarError);
        labelsRv.setLayoutManager(new LinearLayoutManager(this));
        labelsAdapter = new LabelAdapter(new ArrayList<>(), new LabelAdapter.LabelActions() {
            @Override public void onSelect(Label l) {
                setLabelName(l.name);
                vm.setLabelId(l.id);
                title.setText(l.name != null ? l.name : "Inbox");
                vm.refresh();
                drawer.closeDrawer(GravityCompat.START);
            }
            @Override public void onRename(Label l) { if (l != null) promptRenameLabel(l); }
            @Override public void onDelete(Label l) { if (l != null) confirmDeleteLabel(l); }
        }, protectedLabels);
        labelsRv.setAdapter(labelsAdapter);

        // Theme switch
        SwitchCompat darkSwitch = findViewById(R.id.switchDarkMode);
        darkSwitch.setChecked(ThemeManager.isDark(getApplicationContext()));
        darkSwitch.setOnCheckedChangeListener((b, isChecked) -> {
            ThemeManager.setDark(getApplicationContext(), isChecked);
            drawer.closeDrawer(GravityCompat.START);
        });

        // Compose
        findViewById(R.id.btnAddLabel).setOnClickListener(v -> promptCreateLabel());
        findViewById(R.id.btnComposeDrawer).setOnClickListener(v -> {
            ComposeMailBottomSheet sheet = new ComposeMailBottomSheet();
            sheet.setOnSentListener(() -> vm.refresh());
            sheet.show(getSupportFragmentManager(), "compose");
            drawer.closeDrawer(GravityCompat.START);
        });
        // Logout
        findViewById(R.id.btnSignOut).setOnClickListener(v -> {
            SessionManager sm = new SessionManager(getApplicationContext());
            sm.clear();
            LoginRepository.getInstance(getApplicationContext()).logout();

            startActivity(new Intent(this, LoginActivity.class));
            finish();
        });
        fabCompose = findViewById(R.id.fabCompose);
        fabCompose.setOnClickListener(v -> {
            ComposeMailBottomSheet sheet = new ComposeMailBottomSheet();
            sheet.setOnSentListener(() -> vm.refresh());
            sheet.show(getSupportFragmentManager(), "compose");
        });


        labelApi = ApiClient.get(getApplicationContext()).create(LabelApi.class);
        loadLabels();

        RecyclerView list = findViewById(R.id.recyclerMails);
        list.setLayoutManager(new LinearLayoutManager(this));
        adapter = new MailAdapter();
        list.setAdapter(adapter);

        SwipeRefreshLayout swipe = findViewById(R.id.swipe);
        swipe.setOnRefreshListener(vm::refresh);

        ProgressBar spinner = findViewById(R.id.loadingBar);
        TextView errorText = findViewById(R.id.errorText);

        EditText search = findViewById(R.id.searchInput);
        ImageButton clearSearch = findViewById(R.id.clearSearch);

        final Runnable[] debounce = new Runnable[1];
        search.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable s) {
                if (debounce[0] != null) search.removeCallbacks(debounce[0]);
                debounce[0] = () -> vm.search(s.toString());
                search.postDelayed(debounce[0], 500);
            }
        });
        clearSearch.setOnClickListener(v -> {
            search.setText("");
            vm.search("");
        });

        vm.getLoading().observe(this, loading -> {
            spinner.setVisibility(Boolean.TRUE.equals(loading) ? View.VISIBLE : View.GONE);
            swipe.setRefreshing(Boolean.TRUE.equals(loading));
        });
        vm.getError().observe(this, err -> {
            errorText.setText(err == null ? "" : err);
            errorText.setVisibility(err == null ? View.GONE : View.VISIBLE);
        });
        vm.getMails().observe(this, data -> adapter.submit(data != null ? data : new ArrayList<>()));

        vm.refresh();
        pollTask = () -> {
            EditText search1 = findViewById(R.id.searchInput);
            if (search1.getText().toString().isEmpty()) {
                vm.refreshSilent();
            }
            poll.postDelayed(pollTask, POLL_MS);
        };

    }

    @Override protected void onStart() {
        super.onStart();
        poll.postDelayed(pollTask, POLL_MS);
    }
    @Override protected void onStop() {
        super.onStop();
        poll.removeCallbacks(pollTask);
    }

    // ---------------- PROFILE RENDERING ----------------
    private void showProfile(User u) {
        if (u.getPicture() != null && !u.getPicture().isEmpty()) {
            Bitmap bmp = decodeBase64ToBitmap(u.getPicture());
            if (bmp != null) {
                profilePhoto.setImageBitmap(bmp);
                profilePhoto.setVisibility(View.VISIBLE);
                profileLetter.setVisibility(View.GONE);
                return;
            }
        }
        String firstName = u.getFirstName() != null ? u.getFirstName() : "?";
        String letter = firstName.substring(0, 1).toUpperCase();
        profileLetter.setText(letter);
        profileLetter.setBackgroundTintList(ColorStateList.valueOf(getColorFromName(firstName)));
        profileLetter.setVisibility(View.VISIBLE);
        profilePhoto.setVisibility(View.GONE);
    }

    private Bitmap decodeBase64ToBitmap(String base64) {
        try {
            byte[] data = Base64.decode(base64.split(",")[1], Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(data, 0, data.length);
        } catch (Exception e) {
            return null;
        }
    }

    private int getColorFromName(String name) {
        int[] colors = {
                0xFFF44336, 0xFFE91E63, 0xFF9C27B0, 0xFF3F51B5,
                0xFF03A9F4, 0xFF009688, 0xFF4CAF50, 0xFFFF9800,
                0xFF795548, 0xFF607D8B
        };
        int index = name.charAt(0) % colors.length;
        return colors[index];
    }



    // ---------- Labels CRUD ----------
    private void loadLabels() {
        sidebarError.setVisibility(android.view.View.GONE);
        labelApi.getLabels().enqueue(new Callback<List<Label>>() {
            @Override public void onResponse(@NonNull Call<List<Label>> call, @NonNull Response<List<Label>> resp) {
                if (resp.isSuccessful() && resp.body() != null) {
                    labelsAdapter.submit(resp.body());
                } else {
                    showSidebarError("Failed to load labels (" + resp.code() + ")");
                }
            }
            @Override public void onFailure(@NonNull Call<List<Label>> call, @NonNull Throwable t) {
                showSidebarError("Failed to load labels: " + t.getMessage());
            }
        });
    }

    private void promptCreateLabel() {
        final EditText input = new EditText(this);

        new AlertDialog.Builder(this)
                .setTitle("New Label")
                .setView(input)
                .setPositiveButton("Create", (d, which) -> {
                    String name = input.getText().toString().trim();
                    if (name.isEmpty()) return;
                    Map<String, String> body = new HashMap<>();
                    Map<String, String> headers = new HashMap<>();
                    body.put("name", name);
                    headers.put("Authorization", "Bearer " + token);
                    labelApi.createLabel(headers, body).enqueue(new Callback<Void>() {
                        @Override public void onResponse(Call<Void> call, Response<Void> resp) {
                            if (resp.isSuccessful()) {
                                loadLabels();
                            } else {
                                Toast.makeText(InboxActivity.this,
                                        "Create failed (" + resp.code() + ")", Toast.LENGTH_LONG).show();
                            }
                        }
                        @Override public void onFailure(Call<Void> call, Throwable t) {
                            Toast.makeText(InboxActivity.this,
                                    "Create failed: " + t.getMessage(), Toast.LENGTH_LONG).show();
                        }
                    });

                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void promptRenameLabel(Label l) {
        if (protectedLabels.contains(l.name)) {
            Toast.makeText(this, "This label cannot be renamed", Toast.LENGTH_SHORT).show();
            return;
        }
        final EditText input = new EditText(this);
        input.setText(l.name != null ? l.name : "");
        new AlertDialog.Builder(this)
                .setTitle("Rename Label")
                .setView(input)
                .setPositiveButton("Rename", (d, which) -> {
                    String name = input.getText().toString().trim();
                    if (name.isEmpty() || name.equals(l.name)) return;
                    Map<String, String> body = new HashMap<>();
                    Map<String, String> headers = new HashMap<>();
                    body.put("name", name);
                    headers.put("Authorization", "Bearer " + token);
                    labelApi.renameLabel(l.id, headers, body).enqueue(new Callback<Void>() {
                        @Override public void onResponse(Call<Void> call, Response<Void> resp) {
                            if (resp.isSuccessful()) {
                                loadLabels();
                            } else {
                                Toast.makeText(InboxActivity.this,
                                        "Create failed (" + resp.code() + ")", Toast.LENGTH_LONG).show();
                            }
                        }
                        @Override public void onFailure(Call<Void> call, Throwable t) {
                            Toast.makeText(InboxActivity.this,
                                    "Create failed: " + t.getMessage(), Toast.LENGTH_LONG).show();
                        }
                    });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void confirmDeleteLabel(Label l) {
        if (protectedLabels.contains(l.name)) {
            Toast.makeText(this, "This label cannot be deleted", Toast.LENGTH_SHORT).show();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("Delete Label")
                .setMessage("Delete \"" + l.name + "\"?")
                .setPositiveButton("Delete", (d, w) -> labelApi.deleteLabel(l.id).enqueue(new Callback<Void>() {
                    @Override public void onResponse(Call<Void> call, Response<Void> resp) {
                        if (resp.isSuccessful()) loadLabels();
                        else Toast.makeText(InboxActivity.this, "Delete failed (" + resp.code() + ")", Toast.LENGTH_LONG).show();
                    }
                    @Override public void onFailure(Call<Void> call, Throwable t) {
                        Toast.makeText(InboxActivity.this, "Delete failed: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    }
                }))
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void showSidebarError(String msg) {
        sidebarError.setText(msg);
        sidebarError.setVisibility(android.view.View.VISIBLE);
    }

    public String getLabelName() {
        return labelName;
    }

    public void setLabelName(String labelName) {
        this.labelName = labelName;
    }

    // ---------- RecyclerView Adapter for mails (unchanged) ----------
    private static class MailAdapter extends RecyclerView.Adapter<MailVH> {
        private final List<Mail> items = new ArrayList<>();

        public void submit(List<Mail> data) {
            items.clear();
            if (data != null) items.addAll(data);
            notifyDataSetChanged();
        }

        @Override public MailVH onCreateViewHolder(android.view.ViewGroup parent, int viewType) {
            android.view.View v = android.view.LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_mail, parent, false);
            return new MailVH(v);
        }

        // The function that get invokes after you click on a mail item.
        @Override
        public void onBindViewHolder(MailVH h, int pos) {
            Mail m = items.get(pos);
            h.subject.setText(m.subject != null ? m.subject : "(no subject)");
            String from = (m.from != null ? m.from : "");
            String to = (m.toLine() != null ? m.toLine() : "");
            h.from.setText(from.isEmpty() ? to : from);
            h.content.setText(m.content != null ? m.content : "");
            h.date.setText(m.date != null ? m.getFormattedDate() : "");
            h.itemView.setOnClickListener(v -> {
                InboxActivity activity = (InboxActivity) v.getContext();


                String currentLabel = activity.getLabelName();

                //Checks if the current mail is a draft (belongs to the "Drafts" label)
                if ("Drafts".equalsIgnoreCase(currentLabel)) {
                    ComposeMailBottomSheet sheet = new ComposeMailBottomSheet();
                    Bundle args = new Bundle();
                    args.putString("toInit", m.toLine() != null ? m.toLine() : "");
                    args.putString("subjectInit", m.subject != null ? m.subject : "");
                    args.putString("bodyInit", m.content != null ? m.content : "");
                    args.putString("draftId", m.id);


                    sheet.setArguments(args);
                    sheet.setOnSentListener(() -> activity.vm.refresh());
                    sheet.show(activity.getSupportFragmentManager(), "compose");
                } else {
                    MailDetailDialog dlg = MailDetailDialog.newInstance(m);
                    dlg.show(activity.getSupportFragmentManager(), "mailDetail");
                }
            });
            h.btnAddLabel.setOnClickListener(v -> {
                ((InboxActivity) h.itemView.getContext()).showAddLabelMenu(v, m);
            });
        }



        @Override public int getItemCount() { return items.size(); }
    }

    public void showAddLabelMenu(View anchor, Mail mail) {
        if (labelsAdapter == null || labelsAdapter.items.isEmpty()) return;

        PopupMenu popup = new PopupMenu(this, anchor);
        for (Label l : labelsAdapter.items) {
            popup.getMenu().add(l.name != null ? l.name : "Unnamed");
        }

        popup.setOnMenuItemClickListener(item -> {
            String labelName = item.getTitle().toString();
            Label selectedLabel = null;
            for (Label l : labelsAdapter.items) {
                if (labelName.equals(l.name)) {
                    selectedLabel = l;
                    break;
                }
            }
            if (selectedLabel != null) addMailToLabel(mail, selectedLabel);
            return true;
        });

        popup.show();
    }

    private void addMailToLabel(Mail mail, Label label) {
        Map<String, String> body = new HashMap<>();
        body.put("action", "ADD");
        body.put("mailId", mail.id);

        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer " + token);

        labelApi.updateLabelMails(label.id, headers, body).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(InboxActivity.this, "Mail added to label " + label.name, Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(InboxActivity.this, "Failed: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                Toast.makeText(InboxActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private static class MailVH extends RecyclerView.ViewHolder {
        TextView subject, from, content, date;
        ImageButton btnAddLabel;
        public MailVH(android.view.View itemView) {
            super(itemView);
            subject = itemView.findViewById(R.id.mailSubject);
            from = itemView.findViewById(R.id.mailFrom);
            content = itemView.findViewById(R.id.mailContext);
            date = itemView.findViewById(R.id.mailDate);
            btnAddLabel = itemView.findViewById(R.id.btnAddLabelToMail);

        }
    }

    // ---------- Labels adapter ----------
    private static class LabelAdapter extends RecyclerView.Adapter<LabelAdapter.LabelVH> {
        interface LabelActions {
            void onSelect(Label l);
            void onRename(Label l);
            void onDelete(Label l);
        }
        private final List<Label> items;
        private final LabelActions actions;
        private final List<String> protectedLabels;

        LabelAdapter(List<Label> items, LabelActions actions, List<String> protectedLabels) {
            this.items = items;
            this.actions = actions;
            this.protectedLabels = protectedLabels;
        }

        void submit(List<Label> data) {
            items.clear();
            if (data != null) items.addAll(data);
            notifyDataSetChanged();
        }

        @NonNull @Override public LabelVH onCreateViewHolder(@NonNull android.view.ViewGroup parent, int viewType) {
            android.view.View v = android.view.LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_label, parent, false);
            return new LabelVH(v);
        }

        @Override public void onBindViewHolder(@NonNull LabelVH h, int pos) {
            Label l = items.get(pos);
            h.name.setText(l.name != null ? l.name : "");
            h.itemView.setOnClickListener(v -> actions.onSelect(l));

            boolean isProtected = protectedLabels.contains(l.name);
            if (isProtected) {
                h.menu.setVisibility(View.GONE);
            } else {
                h.menu.setVisibility(View.VISIBLE);
                h.menu.setAlpha(1f);
                h.menu.setEnabled(true);
                h.menu.setOnClickListener(v -> {
                    PopupMenu pm = new PopupMenu(v.getContext(), h.menu);
                    pm.getMenu().add("Rename");
                    pm.getMenu().add("Delete");
                    pm.setOnMenuItemClickListener(item -> {
                        String t = String.valueOf(item.getTitle());
                        if ("Rename".equals(t)) actions.onRename(l);
                        else if ("Delete".equals(t)) actions.onDelete(l);
                        return true;
                    });
                    pm.show();
                });
            }

            h.menu.setOnClickListener(v -> {
                PopupMenu pm = new PopupMenu(v.getContext(), h.menu);
                pm.getMenu().add("Rename");
                pm.getMenu().add("Delete");
                pm.setOnMenuItemClickListener(item -> {
                    String t = String.valueOf(item.getTitle());
                    if ("Rename".equals(t)) actions.onRename(l);
                    else if ("Delete".equals(t)) actions.onDelete(l);
                    return true;
                });
                pm.show();
            });
        }

        @Override public int getItemCount() { return items.size(); }

        static class LabelVH extends RecyclerView.ViewHolder {
            TextView name;
            ImageButton menu;
            LabelVH(@NonNull android.view.View itemView) {
                super(itemView);
                name = itemView.findViewById(R.id.txtLabelName);
                menu = itemView.findViewById(R.id.btnLabelMenu);
            }
        }
    }
}
