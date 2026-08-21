plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.florivo.terminaltest"
    compileSdk = 36

    signingConfigs {
        create("florivoTest") {
            storeFile = rootProject.file("florivo-test.keystore")
            storePassword = "florivo-test-2026"
            keyAlias = "florivo-test"
            keyPassword = "florivo-test-2026"
        }
    }

    defaultConfig {
        applicationId = "com.florivo.terminaltest"
        minSdk = 26
        targetSdk = 36
        versionCode = 3
        versionName = "0.3-db-test"
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("florivoTest")
        }
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.06.00")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
