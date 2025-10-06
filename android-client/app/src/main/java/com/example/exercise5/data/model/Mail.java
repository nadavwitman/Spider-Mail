package com.example.exercise5.data.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class Mail {
    public String id;

    // Sender username/display name
    public String from;

    // Sender email (optional if backend sets it)
    public String fromEmail;

    // TO is an array on backend
    @SerializedName(value = "to", alternate = {"recipients"})
    public List<String> to;

    public String subject;
    public String content;

    // Date field may vary, cover alternates
    @SerializedName(value = "date", alternate = {"createdAt", "sentAt"})
    public String date;

    // Reply chain (mail IDs)
    public List<String> reply;

    // Files (attachments)
    @SerializedName("files")
    public List<FileObj> files;

    @SerializedName("read")
    public Boolean read;

    // ---------- Inner class for attachments ----------
    public static class FileObj {
        public String name;
        public String type;
        public long size;
        public String data; // base64-encoded content
    }

    // ---------- Helpers ----------
    public String getFormattedDate() {
        if (date == null) return "";

        try {
            // with milliseconds
            SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            parser.setLenient(false);
            Date parsedDate = parser.parse(date);

            SimpleDateFormat formatter = new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());
            return formatter.format(parsedDate);

        } catch (ParseException e1) {
            try {
                // fallback – without milliseconds
                SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                parser.setLenient(false);
                Date parsedDate = parser.parse(date);

                SimpleDateFormat formatter = new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());
                return formatter.format(parsedDate);

            } catch (ParseException e2) {
                return date; // final fallback
            }
        }
    }

    @SerializedName("labels")
    public List<String> labels;

    // Helper for UI: join recipients nicely
    public String toLine() {
        if (to == null || to.isEmpty()) return "";
        return String.join(", ", to);
    }
}
