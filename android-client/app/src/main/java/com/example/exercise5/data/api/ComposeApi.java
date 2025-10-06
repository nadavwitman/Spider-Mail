package com.example.exercise5.data.api;

import com.example.exercise5.data.model.Mail;
import com.example.exercise5.data.model.MailRequest;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.Path;

public interface ComposeApi {

    // New mail: same as your web: POST /api/mails
    @POST("api/mails")
    Call<Mail> createMail(
            @Header("Authorization") String auth,   // "Bearer <token>"
            @Body MailRequest body
    );

    // Update existing draft and send: PATCH /api/mails/{id}
    @PATCH("api/mails/{id}")
    Call<Mail> updateMail(
            @Header("Authorization") String auth,   // "Bearer <token>"
            @Path("id") String id,
            @Body MailRequest body
    );

}
