package com.example.exercise5.data.session;

import android.content.Context;
import android.content.SharedPreferences;

public class SessionManager {
    private static final String PREFS="session";
    private static final String KEY_TOKEN="jwt";
    private final SharedPreferences prefs;

    public SessionManager(Context ctx){
        prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
    public void saveToken(String t){ prefs.edit().putString(KEY_TOKEN, t).apply(); }
    public String getToken(){ return prefs.getString(KEY_TOKEN, null); }
    public void clear(){ prefs.edit().clear().apply(); }
}
