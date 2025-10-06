plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.example.exercise5"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.example.exercise5"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    // BuildConfig.API_BASE_URL comes from gradle.properties (falls back to 10.0.2.2)
    buildTypes {
        getByName("debug") {
            val apiUrl: String = project.findProperty("API_BASE_URL") as String?
                ?: "http://10.0.2.2:3000/"
            buildConfigField("String", "API_BASE_URL", "\"$apiUrl\"")
        }
        getByName("release") {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            val apiUrl: String = project.findProperty("API_BASE_URL") as String?
                ?: "http://10.0.2.2:3000/"
            buildConfigField("String", "API_BASE_URL", "\"$apiUrl\"")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true   // <-- fixes the error
    }
}

dependencies {
    // Retrofit / OkHttp
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Lifecycle (Java)
    implementation("androidx.lifecycle:lifecycle-viewmodel:2.8.4")
    implementation("androidx.lifecycle:lifecycle-livedata:2.8.4")

    // AndroidX (version catalog)
    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.activity)
    implementation(libs.constraintlayout)
    implementation(libs.annotation)

    // You can remove these if you’re strictly Java-only:
    implementation(libs.lifecycle.livedata.ktx)
    implementation(libs.lifecycle.viewmodel.ktx)

    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
    implementation("androidx.recyclerview:recyclerview:1.3.2") // (needed for the list)

}
