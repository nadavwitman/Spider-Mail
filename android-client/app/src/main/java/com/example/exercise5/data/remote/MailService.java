package com.example.exercise5.data.remote;
import com.example.exercise5.data.model.MailRequest;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class MailService {

    // If your Node server runs on your PC at http://localhost:3000,
    // use 10.0.2.2 from the Android emulator:
    private static final String BASE = "http://10.0.2.2:3000";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private static MailService INSTANCE;
    public static MailService getInstance() {
        if (INSTANCE == null) INSTANCE = new MailService();
        return INSTANCE;
    }

    private final OkHttpClient client = new OkHttpClient();
    private final Gson gson = new GsonBuilder().serializeNulls().create();

    public JSONObject saveMailDraft(String token, String draftId, MailRequest req)
            throws IOException, ApiException {
        return doCreateOrPatch(token, draftId, req, false);
    }

    public JSONObject sendMailNow(String token, String draftId, MailRequest req)
            throws IOException, ApiException {
        req.send = "true"; // JS: send: 'true'
        return doCreateOrPatch(token, draftId, req, true);
    }

    public void deleteDraft(String token, String draftId)
            throws IOException, ApiException {
        Request request = new Request.Builder()
                .url(BASE + "/api/mails/" + draftId)
                .addHeader("Authorization", "Bearer " + token)
                .delete()
                .build();

        try (Response res = client.newCall(request).execute()) {
            if (!res.isSuccessful()) {
                throw new ApiException("Failed to delete draft", res.code());
            }
        }
    }

    private JSONObject doCreateOrPatch(String token, String draftId, MailRequest req, boolean sending)
            throws IOException, ApiException {
        String url = (draftId != null && !draftId.isEmpty())
                ? BASE + "/api/mails/" + draftId
                : BASE + "/api/mails";
        String method = (draftId != null && !draftId.isEmpty()) ? "PATCH" : "POST";

        String json = gson.toJson(req);
        RequestBody body = RequestBody.create(json, JSON);

        Request.Builder builder = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + token)
                .addHeader("Content-Type", "application/json");

        Request request = ("PATCH".equals(method))
                ? builder.patch(body).build()
                : builder.post(body).build();

        try (Response res = client.newCall(request).execute()) {
            String text = (res.body() != null) ? res.body().string() : "";
            JSONObject data = new JSONObject();
            try { if (!text.isEmpty()) data = new JSONObject(text); } catch (JSONException ignore) {}

            if (!res.isSuccessful()) {
                if (res.code() == 413) throw new ApiException("Request Entity Too Large", 413);
                String serverMessage = data.optString("error",
                        data.optString("message", "Error " + res.code() + " " + res.message()));
                throw new ApiException(serverMessage, res.code());
            }
            return data;
        }
    }

    public static class ApiException extends Exception {
        public final int statusCode;
        public ApiException(String msg, int code) { super(msg); this.statusCode = code; }
    }
}
