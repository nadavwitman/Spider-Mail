package com.example.exercise5.data.api;

import android.content.Context;

import com.example.exercise5.BuildConfig;
import com.example.exercise5.data.session.SessionManager;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiClient {
    private static Retrofit retrofit;

    public static Retrofit get(Context ctx) {
        if (retrofit == null) {
            final SessionManager sm = new SessionManager(ctx.getApplicationContext());

            Interceptor auth = new Interceptor() {
                @Override public Response intercept(Chain chain) throws IOException {
                    Request original = chain.request();
                    Request.Builder b = original.newBuilder();
                    String jwt = sm.getToken();
                    if (jwt != null) b.header("Authorization", "Bearer " + jwt);
                    return chain.proceed(b.build());
                }
            };

            HttpLoggingInterceptor log = new HttpLoggingInterceptor();
            log.setLevel(HttpLoggingInterceptor.Level.BODY);

            OkHttpClient ok = new OkHttpClient.Builder()
                    .addInterceptor(auth)
                    .addInterceptor(log)
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BuildConfig.API_BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create())
                    .client(ok)
                    .build();
        }
        return retrofit;
    }
}
