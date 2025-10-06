package com.example.exercise5.data.api;

import com.example.exercise5.data.model.LoginResponse;
import java.util.Map;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface AuthApi {
    @POST("api/users")          // signup
    Call<Void> signup(@Body Map<String, String> body);

    @POST("api/tokens")         // <-- correct login endpoint
    Call<LoginResponse> login(@Body Map<String, String> body);
}
