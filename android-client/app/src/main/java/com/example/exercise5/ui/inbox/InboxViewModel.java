package com.example.exercise5.ui.inbox;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.example.exercise5.data.InboxRepository;
import com.example.exercise5.data.model.Mail;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class InboxViewModel extends AndroidViewModel {
    private final InboxRepository repo;
    private final ExecutorService io = Executors.newSingleThreadExecutor();

    private final MutableLiveData<List<Mail>> mails = new MutableLiveData<>();
    private final MutableLiveData<Boolean> loading = new MutableLiveData<>(false);
    private final MutableLiveData<String> error = new MutableLiveData<>(null);
    private String currentLabelId;

    public InboxViewModel(@NonNull Application app) {
        super(app);
        repo = new InboxRepository(app.getApplicationContext());
    }

    public LiveData<List<Mail>> getMails() { return mails; }
    public LiveData<Boolean> getLoading() { return loading; }
    public LiveData<String> getError() { return error; }
    public void setLabelId(String id) { currentLabelId = id; }

    public void refresh() {
        loading.postValue(true);
        error.postValue(null);
        io.execute(() -> {
            try {
                List<Mail> data = repo.loadMails(currentLabelId);
                mails.postValue(data);
            } catch (Exception e) {
                error.postValue(e.getMessage());
            } finally {
                loading.postValue(false);
            }
        });
    }
    public void refreshSilent() {
        error.postValue(null);
        io.execute(() -> {
            try {
                List<Mail> data = repo.loadMails(currentLabelId);
                mails.postValue(data);
            } catch (Exception e) {
                error.postValue(e.getMessage());
            }
        });
    }


    public void search(String q) {
        loading.postValue(true);
        error.postValue(null);
        io.execute(() -> {
            try {
                if (q == null || q.trim().isEmpty()) {
                    List<Mail> data = repo.loadMails(currentLabelId);
                    mails.postValue(data);
                } else {
                    List<Mail> data = repo.search(q.trim());
                    mails.postValue(data);
                }
            } catch (Exception e) {
                error.postValue(e.getMessage());
            } finally {
                loading.postValue(false);
            }
        });
    }
}
