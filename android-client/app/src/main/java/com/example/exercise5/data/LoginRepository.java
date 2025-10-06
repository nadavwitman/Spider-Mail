package com.example.exercise5.data;

import android.content.Context;

import com.example.exercise5.data.model.LoggedInUser;

public class LoginRepository {

    private static volatile LoginRepository instance;
    private final LoginDataSource dataSource;

    private LoggedInUser user;

    private LoginRepository(LoginDataSource dataSource) {
        this.dataSource = dataSource;
    }

    public static LoginRepository getInstance(Context ctx) {
        if (instance == null) {
            synchronized (LoginRepository.class) {
                if (instance == null) {
                    instance = new LoginRepository(new LoginDataSource(ctx.getApplicationContext()));
                }
            }
        }
        return instance;
    }

    public boolean isLoggedIn() { return user != null; }
    public void logout() { user = null; dataSource.logout(); }
    private void setLoggedInUser(LoggedInUser user) { this.user = user; }

    public Result<LoggedInUser> login(String username, String password) {
        Result<LoggedInUser> result = dataSource.login(username, password);
        if (result instanceof Result.Success) setLoggedInUser(((Result.Success<LoggedInUser>) result).getData());
        return result;
    }

    public LoggedInUser getUser() { return user; }
}
