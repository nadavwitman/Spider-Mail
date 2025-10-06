package com.example.exercise5.data.api;

import com.example.exercise5.data.model.Label;
import java.util.List;
import java.util.Map;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.HeaderMap;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.Path;


public interface LabelApi {
    @GET("api/labels")
    Call<List<Label>> getLabels();

    @POST("api/labels")
    Call<Void> createLabel(
            @HeaderMap Map<String, String> headers,
            @Body Map<String, String> body
    );

    @PATCH("api/labels/{id}")
    Call<Void> renameLabel(
            @Path("id") String id,
            @HeaderMap Map<String, String> headers,
            @Body Map<String, String> body);


    @PATCH("api/labels/{id}")
    Call<Void> updateLabelMails(
            @Path("id") String id,
            @HeaderMap Map<String, String> headers,
            @Body Map<String, String> body
    );


    @DELETE("api/labels/{id}")
    Call<Void> deleteLabel(@Path("id") String id);
}
