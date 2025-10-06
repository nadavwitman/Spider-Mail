package com.example.exercise5.utils;

import android.util.Base64;

import org.json.JSONObject;

public class JwtUtils {
    public static String getUserIdFromToken(String token) {
        try {
            String[] parts = token.split("\\."); // header.payload.signature
            if (parts.length < 2) return null;

            String payload = new String(Base64.decode(parts[1], Base64.URL_SAFE), "UTF-8");
            JSONObject obj = new JSONObject(payload);

            // "id" is what backend puts in payload
            return obj.optString("id", null);
        } catch (Exception e) {
            return null;
        }
    }
}
