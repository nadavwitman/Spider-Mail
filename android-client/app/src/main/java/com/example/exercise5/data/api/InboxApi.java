package com.example.exercise5.data.api;

import com.example.exercise5.data.model.Label;
import com.example.exercise5.data.model.LabelDetail;
import com.example.exercise5.data.model.Mail;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Path;

public interface InboxApi {
    @GET("api/labels")
    Call<List<Label>> getLabels();

    @GET("api/labels/{id}")
    Call<LabelDetail> getLabel(@Path("id") String labelId);

    @GET("api/mails")
    Call<List<Mail>> getAllMails();

    @GET("api/mails/search/{q}")
    Call<List<Mail>> search(@Path("q") String query);
    @retrofit2.http.POST("api/mails")
    retrofit2.Call<Void> sendMail(@retrofit2.http.Body java.util.Map<String, String> body);

}
