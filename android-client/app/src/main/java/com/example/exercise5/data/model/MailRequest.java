package com.example.exercise5.data.model;

import java.util.ArrayList;
import java.util.List;

public class MailRequest {
    public List<String> to;
    public String subject;
    public String content;
    public List<FilePart> files;
    public String scheduledSend;
    public String send;           // "true" to send now
    public List<String> reply;    // [] if not a reply

    public static List<String> normalizeTo(Object to) {
        List<String> out = new ArrayList<>();
        if (to == null) return out;
        if (to instanceof List) {
            for (Object o : (List<?>) to) {
                if (o == null) continue;
                String s = o.toString().trim();
                if (!s.isEmpty()) out.add(s);
            }
            return out;
        }
        String s = to.toString().trim();
        if (s.isEmpty()) return out;
        String[] parts = s.contains(",") ? s.split(",") : s.split("\\s+");
        for (String p : parts) {
            String t = p.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    public static MailRequest fromInputs(
            String toStr, String subject, String content,
            List<FilePart> files, String scheduledSend, List<String> reply, boolean sendNow
    ) {
        MailRequest r = new MailRequest();
        r.to = normalizeTo(toStr);
        r.subject = subject;
        r.content = content;
        r.files = (files != null) ? files : new ArrayList<>();
        r.scheduledSend = (scheduledSend != null) ? scheduledSend : "";
        r.send = sendNow ? "true" : null;
        r.reply = (reply != null) ? reply : new ArrayList<>();
        return r;
    }
}
