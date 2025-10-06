package com.example.exercise5.ui.login;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.exercise5.R;
import com.example.exercise5.data.LoginRepository;
import com.example.exercise5.data.Result;
import com.example.exercise5.data.model.LoggedInUser;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LoginViewModel extends ViewModel {
    private final MutableLiveData<LoginFormState> loginFormState = new MutableLiveData<>();
    private final MutableLiveData<LoginResult> loginResult = new MutableLiveData<>();
    private final LoginRepository loginRepository;
    private final ExecutorService io = Executors.newSingleThreadExecutor();

    public LoginViewModel(LoginRepository loginRepository) {
        this.loginRepository = loginRepository;
    }

    public LiveData<LoginFormState> getLoginFormState() { return loginFormState; }
    public LiveData<LoginResult> getLoginResult() { return loginResult; }

    public void login(String username, String password) {
        io.execute(() -> {
            Result<LoggedInUser> result = loginRepository.login(username, password);
            if (result instanceof Result.Success) {
                LoggedInUser data = ((Result.Success<LoggedInUser>) result).getData();
                loginResult.postValue(new LoginResult(new LoggedInUserView(data.getDisplayName())));
            } else {
                loginResult.postValue(new LoginResult(R.string.login_failed));
            }
        });
    }

    public void loginDataChanged(String username, String password) {
        if (!isUserNameValid(username)) {
            loginFormState.setValue(new LoginFormState(R.string.invalid_username, null));
        } else if (!isPasswordValid(password)) {
            loginFormState.setValue(new LoginFormState(null, R.string.invalid_password));
        } else {
            loginFormState.setValue(new LoginFormState(true));
        }
    }

    private boolean isUserNameValid(String username) {
        return username != null && username.trim().length() > 3;
    }

    private boolean isPasswordValid(String password) {
        return password != null && password.trim().length() >= 6;
    }
}
