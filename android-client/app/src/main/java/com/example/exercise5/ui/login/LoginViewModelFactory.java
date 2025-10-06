package com.example.exercise5.ui.login;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;

import com.example.exercise5.data.LoginRepository;

public class LoginViewModelFactory implements ViewModelProvider.Factory {

    private final Context appContext;

    public LoginViewModelFactory(Context context) {
        this.appContext = context.getApplicationContext();
    }

    @NonNull @Override
    @SuppressWarnings("unchecked")
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(LoginViewModel.class)) {
            return (T) new LoginViewModel(LoginRepository.getInstance(appContext));
        }
        throw new IllegalArgumentException("Unknown ViewModel class");
    }
}
