# FLORIVO ANDROID TERMINAL — PROGRESS LOG

## 2026-08-17 — PREP FOR NATIVE APP

### Physical facts already confirmed
- Corporate badge repeatedly reads the same UID in native Android NFC Tools.
- Badge technologies include NFC-A / IsoDep and is a MIFARE Plus card.
- Web prototype can detect a tag interaction but Web NFC cannot read the badge as required; browser route is not the final NFC implementation.

### Browser UX prepared
- `florivo-terminal-web-test.html`: Web NFC diagnostics + server TEST log.
- `florivo-terminal-products-test.html`: yellow 3D product UX.
- Main products: BUNNER, HYLLER x30, HYLLER x60, FORLENGERE KORTE, FORLENGERE LANGE, FORLENGERE PLAST.
- Separate red VRAK/AVVIK: VRAK BUNNER, VRAK HYLLER, BUNNER UTEN BRIKK.

### TEST server prepared
New isolated tables:
- florivo_terminal_test_employees
- florivo_terminal_test_employee_nfc
- florivo_terminal_test_finished_events
Existing:
- florivo_terminal_test_log

TEST RPCs created and validated transactionally:
- lookup UID
- register employee + UID
- register finished product +1 and return 6-digit server number

A TEST mapping exists for the physically tested badge -> TEST ANSATT.
No production stock/order/Nordic data was changed.

### Native Android starter prepared
Folder: `android-terminal-test/`
Package: `com.florivo.terminaltest`
Starter includes Kotlin + Compose configuration and an earlier NFC/server prototype.

### Not yet physically passed
- No native app NFC PASS yet.
- No product +1 from native APK yet.
- No kiosk mode yet.

## 2026-08-21 — ACCEPTED UI-FIRST ORDER

User explicitly changed the immediate build order:
1. First deliver a ready-looking Android app based on `florivo-terminal-products-test.html`.
2. First APK must be LOCAL TEST only: no card/NFC gate, no login, no INTERNET permission, no server write, no production access.
3. User physically checks the app UI and button behavior on the phone.
4. Only after UI physical acceptance, add NFC/card as the entry gate in front of the same product screen.
5. Then connect TEST employee lookup and TEST product +1.
6. Production Nordic/TIL RAMPE/TIL LAGER remain frozen and isolated.

Implementation branch: `florivo-android-ui-v01`
Pull request: #16

Current v0.1 scope:
- Native Kotlin + Jetpack Compose.
- NO / UK language switch.
- Green/yellow product screen matching browser prototype direction.
- Main product buttons and separate red VRAK/AVVIK screen.
- Local 6-digit test counter only.
- 3-second local confirmation overlay.
- No NFC permission.
- No INTERNET permission.
- No server calls.
- No WORK/production writes.

Google Drive release folder created under `Florivo`:
- `Florivo Android App`

### Next milestone
Build CI APK -> upload APK to Google Drive -> physical phone UI PASS.
Do not call UI PASS until user installs and confirms the APK on a real phone.
