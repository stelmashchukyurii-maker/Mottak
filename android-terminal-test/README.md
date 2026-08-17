# Florivo Terminal Android TEST

Prepared 2026-08-17 for next physical session.

This is an isolated native Android starter. It does not replace or modify any Nordic/WORK page.

Current starter scope:
- Kotlin + Jetpack Compose
- package `com.florivo.terminaltest`
- native NFC reader mode
- reads `Tag.id` UID and tag technologies
- skips NDEF dependency
- looks up badge in TEST Supabase RPC
- yellow terminal visual direction
- no product write yet from APK

Build baseline prepared from current official Android guidance:
- Android Gradle Plugin 9.3.1
- Kotlin / Compose compiler plugin 2.3.21
- Compose BOM 2026.06.00
- compileSdk / targetSdk 37
- JDK 17

Tomorrow sequence:
1. Open this folder as an Android Studio project.
2. Sync Gradle and let Android Studio install required SDK components.
3. Generate/use Gradle wrapper if Android Studio requests it.
4. Build debug APK.
5. Install on the real NFC Android phone.
6. Tap corporate badge repeatedly.
7. Confirm same UID each time and TEST server returns `TEST ANSATT`.
8. Only after physical PASS, port product screen and +1 server registration.

Do not mark PASS from emulator or code inspection.
