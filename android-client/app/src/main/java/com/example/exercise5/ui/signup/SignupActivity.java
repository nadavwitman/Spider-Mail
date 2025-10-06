package com.example.exercise5.ui.signup;

import android.app.DatePickerDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.text.TextUtils;
import android.util.Base64;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import com.example.exercise5.R;
import com.example.exercise5.data.api.ApiClient;
import com.example.exercise5.data.api.AuthApi;
import com.example.exercise5.ui.login.LoginActivity;
import com.example.exercise5.ui.theme.ThemeManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SignupActivity extends AppCompatActivity {

    // Text fields
    private EditText firstNameEt, lastNameEt, birthdayEt, userNameEt, passwordEt, confirmPasswordEt;

    // Optional legacy fallback (if your layout still has an EditText with id 'picture')
    private EditText pictureEt;

    // New image-picker UI (add these views in activity_signup.xml; safe if absent)
    private Button btnSelectPicture;
    private ImageView picturePreview;

    // Spinner + button
    private Spinner genderSp;
    private Button signupBtn;

    // Will hold "data:<mime>;base64,<encoded>"
    private String pictureBase64 = null;

    private ActivityResultLauncher<String> pickImageLauncher;

    private static final Pattern GMAIL =
            Pattern.compile("^[a-zA-Z0-9._%+-]+@gmail\\.com$");
    private static final Pattern BIRTHDAY_DDMMYYYY =
            Pattern.compile("^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\\d{4}$");
    private static final Pattern PASSWORD_COMPLEX =
            Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);
        ThemeManager.applySavedTheme(getApplicationContext());
        setTitle("Sign Up");

        // Find views
        firstNameEt = findViewById(R.id.firstName);
        lastNameEt  = findViewById(R.id.lastName);
        birthdayEt  = findViewById(R.id.birthday);
        userNameEt  = findViewById(R.id.userName);
        passwordEt  = findViewById(R.id.password);
        confirmPasswordEt = findViewById(R.id.confirmPassword);
        genderSp    = findViewById(R.id.gender);
        signupBtn   = findViewById(R.id.signup);


        // New optional views (add to layout if not present)
        btnSelectPicture = findViewById(R.id.btnSelectPicture);
        picturePreview   = findViewById(R.id.picturePreview);

        // Spinner options: male / female / other
        ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(
                this, R.array.gender_options, android.R.layout.simple_spinner_item);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        genderSp.setAdapter(adapter);

        // Calendar picker for birthday (writes DD/MM/YYYY)
        birthdayEt.setInputType(InputType.TYPE_NULL);
        birthdayEt.setFocusable(false);
        birthdayEt.setOnClickListener(v -> openDatePicker());
        birthdayEt.setOnFocusChangeListener((v, hasFocus) -> { if (hasFocus) openDatePicker(); });

        // Image picker launcher (Activity Result API)
        pickImageLauncher = registerForActivityResult(
                new ActivityResultContracts.GetContent(),
                this::onImagePicked
        );


        if (btnSelectPicture != null) {
            btnSelectPicture.setOnClickListener(v -> pickImageLauncher.launch("image/*"));
        }

        signupBtn.setOnClickListener(v -> attemptSignup());
    }

    private void onImagePicked(Uri uri) {
        if (uri == null) return;
        try {
            if (picturePreview != null) {
                picturePreview.setVisibility(View.VISIBLE);
                picturePreview.setImageURI(uri);
            }

            String mime = getContentResolver().getType(uri);
            if (mime == null) mime = "image/jpeg"; // fallback

            byte[] bytes = readAllBytes(getContentResolver().openInputStream(uri));
            // Build data URL like the web version
            pictureBase64 = "data:" + mime + ";base64," + Base64.encodeToString(bytes, Base64.NO_WRAP);

        } catch (Exception e) {
            toast("Failed to read picture: " + e.getMessage());
            pictureBase64 = null;
        }
    }

    private void openDatePicker() {
        Calendar c = Calendar.getInstance();
        c.add(Calendar.YEAR, -18);
        int y = c.get(Calendar.YEAR);
        int m = c.get(Calendar.MONTH);
        int d = c.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog dlg = new DatePickerDialog(
                this,
                (DatePicker view, int year, int month, int dayOfMonth) ->
                        birthdayEt.setText(String.format("%02d/%02d/%04d", dayOfMonth, month + 1, year)),
                y, m, d
        );
        dlg.show();
    }

    private void attemptSignup() {
        String firstName = safeText(firstNameEt);
        String lastName  = safeText(lastNameEt);
        String birthday  = safeText(birthdayEt);          // DD/MM/YYYY
        String gender    = genderSp.getSelectedItem().toString(); // male/female/other
        String userName  = safeText(userNameEt);          // must be @gmail.com
        String password  = passwordEt.getText().toString();
        String confirmPw = confirmPasswordEt.getText().toString();

        // Same validations + confirm password like web
        if (TextUtils.isEmpty(firstName) || TextUtils.isEmpty(lastName)
                || TextUtils.isEmpty(birthday) || TextUtils.isEmpty(userName)
                || TextUtils.isEmpty(password) || TextUtils.isEmpty(confirmPw)) {
            toast("All fields except picture are required");
            return;
        }
        if (!BIRTHDAY_DDMMYYYY.matcher(birthday).matches()) {
            toast("Birthday must be DD/MM/YYYY");
            return;
        }
        if (!GMAIL.matcher(userName).matches()) {
            toast("Username must be a valid Gmail address");
            return;
        }
        if (!PASSWORD_COMPLEX.matcher(password).matches()) {
            toast("Password: 8+ chars, 1 letter, 1 number, 1 special");
            return;
        }
        if (!password.equals(confirmPw)) {
            toast("Passwords do not match");
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("firstName", firstName);
        body.put("lastName",  lastName);
        body.put("birthday",  birthday);
        body.put("gender",    gender.toLowerCase());
        body.put("userName",  userName);
        body.put("password",  password);


        if (!TextUtils.isEmpty(pictureBase64)) {
            body.put("picture", pictureBase64);
        } else if (pictureEt != null) {
            String legacy = safeText(pictureEt);
            if (!TextUtils.isEmpty(legacy)) body.put("picture", legacy);
        }

        AuthApi api = ApiClient.get(getApplicationContext()).create(AuthApi.class);
        signupBtn.setEnabled(false);

        api.signup(body).enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> call, Response<Void> resp) {
                signupBtn.setEnabled(true);
                if (resp.isSuccessful() && resp.code() == 201) {
                    toast("Account created! Please sign in.");
                    startActivity(new Intent(SignupActivity.this, LoginActivity.class));
                    finish();
                } else {
                    String msg = "Signup failed (" + resp.code() + ")";
                    try {
                        if (resp.errorBody() != null) {
                            String e = resp.errorBody().string();
                            if (!TextUtils.isEmpty(e)) msg = e;
                        }
                    } catch (Exception ignored) {}
                    toast(msg);
                }
            }
            @Override public void onFailure(Call<Void> call, Throwable t) {
                signupBtn.setEnabled(true);
                toast("Network error: " + t.getMessage());
            }
        });
    }

    private String safeText(EditText et) {
        return et == null ? "" : et.getText().toString().trim();
    }

    private byte[] readAllBytes(InputStream is) throws IOException {
        if (is == null) return new byte[0];
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[16 * 1024];
        int n;
        while ((n = is.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, n);
        }
        return buffer.toByteArray();
    }

    private void toast(String s) {
        Toast.makeText(this, s, Toast.LENGTH_LONG).show();
    }
}
