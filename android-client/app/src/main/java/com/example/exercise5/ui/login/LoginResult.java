package com.example.exercise5.ui.login;

import androidx.annotation.Nullable;

public class LoginResult {
    @Nullable private LoggedInUserView success;
    @Nullable private Integer error;

    public LoginResult(@Nullable Integer error) {
        this.error = error;
        this.success = null;
    }

    public LoginResult(LoggedInUserView success) {
        this.success = success;
        this.error = null;
    }

    @Nullable public LoggedInUserView getSuccess() { return success; }
    @Nullable public Integer getError() { return error; }
}
