package com.example.exercise5.data;

import android.content.Context;

import com.example.exercise5.data.api.ApiClient;
import com.example.exercise5.data.api.InboxApi;
import com.example.exercise5.data.model.Label;
import com.example.exercise5.data.model.LabelDetail;
import com.example.exercise5.data.model.Mail;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import retrofit2.Response;
import com.example.exercise5.data.api.ComposeApi;
import com.example.exercise5.data.model.MailRequest;
import com.example.exercise5.data.model.FilePart;

import java.util.ArrayList;

public class InboxRepository {
    private final InboxApi api;
    private final ComposeApi composeApi;

    public InboxRepository(Context ctx) {
        this.api = ApiClient.get(ctx.getApplicationContext()).create(InboxApi.class);
        this.composeApi = ApiClient.get(ctx.getApplicationContext()).create(ComposeApi.class);

    }

    public List<Mail> loadMails(String labelId) throws IOException {
        if (labelId == null || labelId.isEmpty()) {
            // default to Inbox: fetch labels, then the one named "Inbox"
            Response<List<Label>> r = api.getLabels().execute();
            if (!r.isSuccessful() || r.body() == null) throw new IOException("Labels fetch failed: " + r.code());
            Label inbox = null;
            for (Label l : r.body()) if ("Inbox".equalsIgnoreCase(l.name)) { inbox = l; break; }
            if (inbox == null) throw new IOException("Inbox label not found");
            Response<LabelDetail> r2 = api.getLabel(inbox.id).execute();
            if (!r2.isSuccessful() || r2.body() == null) throw new IOException("Inbox mails fetch failed: " + r2.code());
            return r2.body().mails != null ? r2.body().mails : Collections.emptyList();
        } else {
            // need to detect if it's "All Mails"
            Response<List<Label>> labelsRes = api.getLabels().execute();
            if (!labelsRes.isSuccessful() || labelsRes.body() == null) throw new IOException("Labels fetch failed: " + labelsRes.code());
            String allMailsId = null;
            for (Label l : labelsRes.body()) if ("All Mails".equalsIgnoreCase(l.name)) { allMailsId = l.id; break; }

            if (allMailsId != null && allMailsId.equals(labelId)) {
                Response<List<Mail>> all = api.getAllMails().execute();
                if (!all.isSuccessful() || all.body() == null) throw new IOException("All mails fetch failed: " + all.code());
                return all.body();
            } else {
                Response<LabelDetail> one = api.getLabel(labelId).execute();
                if (!one.isSuccessful() || one.body() == null) throw new IOException("Label fetch failed: " + one.code());
                return one.body().mails != null ? one.body().mails : Collections.emptyList();
            }
        }
    }

    public List<Mail> search(String query) throws IOException {
        Response<List<Mail>> r = api.search(query).execute();
        if (!r.isSuccessful() || r.body() == null) throw new IOException("Search failed: " + r.code());
        return r.body();
    }

    public void sendMail(String to, String subject, String body) throws IOException {
        java.util.Map<String, String> payload = new java.util.HashMap<>();
        payload.put("to", to);
        payload.put("subject", subject != null ? subject : "");
        payload.put("content", body != null ? body : "");

        retrofit2.Response<Void> r = api.sendMail(payload).execute();
        if (!r.isSuccessful()) throw new IOException("Send failed: " + r.code());
    }

    public Mail sendMailNow(String token,
                            List<String> to,
                            String subject,
                            String content) throws IOException {
        // Mirror the exact JSON your React client sends
        MailRequest req = new MailRequest();
        req.to = (to != null) ? to : Collections.emptyList();      // must be array
        req.subject = (subject != null) ? subject : "";
        req.content = (content != null) ? content : "";
        req.files = Collections.emptyList();
        req.scheduledSend = "";                                     // match web
        req.reply = Collections.emptyList();
        req.send = "true";                                          // STRING, not boolean

        retrofit2.Response<Mail> r =
                composeApi.createMail("Bearer " + token, req).execute();

        if (!r.isSuccessful() || r.body() == null) {
            throw new IOException("Send failed: " + r.code() + " "
                    + (r.errorBody() != null ? r.errorBody().string() : ""));
        }
        return r.body();
    }


    public Mail sendExistingDraft(String token, String draftId,
                                  List<String> to, String subject, String content) throws IOException {
        MailRequest req = new MailRequest();
        req.to = (to != null) ? to : Collections.emptyList();
        req.subject = (subject != null) ? subject : "";
        req.content = (content != null) ? content : "";
        req.files = Collections.emptyList();
        req.scheduledSend = "";
        req.reply = Collections.emptyList();
        req.send = "true"; // STRING


        retrofit2.Response<Mail> r =
                composeApi.updateMail("Bearer " + token, draftId, req).execute();

        if (!r.isSuccessful() || r.body() == null) {
            throw new IOException("Send (PATCH) failed: " + r.code() + " "
                    + (r.errorBody() != null ? r.errorBody().string() : ""));
        }
        return r.body();
    }



}
