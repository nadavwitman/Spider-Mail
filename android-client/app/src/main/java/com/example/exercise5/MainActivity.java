package com.example.exercise5;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.example.exercise5.ui.login.LoginActivity;
import com.example.exercise5.ui.signup.SignupActivity;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        TextView welcomeText = findViewById(R.id.welcomeText);
        Button signInBtn = findViewById(R.id.btnSignIn);
        Button signUpBtn = findViewById(R.id.btnSignUp);
        welcomeText.setText("Welcome!"); // adjust text

        signInBtn.setOnClickListener(v ->
                startActivity(new Intent(MainActivity.this, LoginActivity.class)));

        signUpBtn.setOnClickListener(v ->
                startActivity(new Intent(MainActivity.this, SignupActivity.class)));
    }
}
