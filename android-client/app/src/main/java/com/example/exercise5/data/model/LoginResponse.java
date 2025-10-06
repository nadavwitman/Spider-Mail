package com.example.exercise5.data.model;

public class LoginResponse {
    private String token;
    private String id;        // optional
    private String userName;  // optional

    public String getToken() { return token; }
    public String getId() { return id; }
    public String getUserName() { return userName; }
}
