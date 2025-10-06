package com.example.exercise5.data.model;

/** Simple in-memory representation of the authenticated user. */
public class LoggedInUser {
    private final String userId;
    private final String displayName;

    public LoggedInUser(String userId, String displayName) {
        this.userId = userId;
        this.displayName = displayName;
    }

    public String getUserId() { return userId; }
    public String getDisplayName() { return displayName; }
}
