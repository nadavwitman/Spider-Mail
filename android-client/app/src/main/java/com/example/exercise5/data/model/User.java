package com.example.exercise5.data.model;

public class User {
    private String id;
    private String firstName;
    private String lastName;
    private String userName;
    private String picture; // <-- add this

    public String getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getUserName() { return userName; }
    public String getPicture() { return picture; } // <-- add getter
}
