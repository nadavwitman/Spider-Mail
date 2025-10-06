package com.example.exercise5.data;

import android.content.Context;

import com.example.exercise5.data.api.ApiClient;
import com.example.exercise5.data.api.AuthApi;
import com.example.exercise5.data.api.AuthApiDynamic;
import com.example.exercise5.data.model.LoggedInUser;
import com.example.exercise5.data.model.LoginResponse;
import com.example.exercise5.data.session.SessionManager;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import android.util.Log;

import retrofit2.Call;

import retrofit2.Call;
import retrofit2.Response;

public class LoginDataSource {

    private final Context appContext;

    public LoginDataSource(Context appContext) {
        this.appContext = appContext.getApplicationContext();
    }
    public Result<LoggedInUser> login(String username, String password) {
        try {
            AuthApi api = ApiClient.get(appContext).create(AuthApi.class);

            Map<String, String> body = new HashMap<>();
            body.put("userName", username);
            body.put("password", password);

            Response<LoginResponse> resp = api.login(body).execute();

            if (!resp.isSuccessful() || resp.body() == null || resp.body().getToken() == null) {
                return new Result.Error(new IOException("Login failed (" + resp.code() + ")"));
            }

            String token = resp.body().getToken();

            // Save token for later API calls
            new SessionManager(appContext).saveToken(token);

            // 🔑 Extract Mongo _id from token payload
            String id = com.example.exercise5.utils.JwtUtils.getUserIdFromToken(token);

            // Fallback to userName if decode fails
            if (id == null) id = resp.body().getUserName();

            // Display name for UI
            String display = resp.body().getUserName() != null
                    ? resp.body().getUserName()
                    : username;

            return new Result.Success<>(new LoggedInUser(id, display));

        } catch (Exception e) {
            return new Result.Error(new IOException("Error logging in", e));
        }
    }


    public void logout() {
        new SessionManager(appContext).clear();
    }
}
