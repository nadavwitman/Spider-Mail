package com.example.exercise5.data.api;

import com.example.exercise5.data.model.LoginResponse;
import java.util.Map;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;
import retrofit2.http.Url;

public interface AuthApiDynamic {
    @POST
    Call<LoginResponse> login(@Url String url, @Body Map<String, String> body);
}
