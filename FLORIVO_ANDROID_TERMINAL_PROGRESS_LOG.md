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
Starter includes:
- Kotlin + Compose project config
- NFC + INTERNET manifest permissions
- native NfcAdapter reader mode
- NFC-A polling + skip NDEF check
- displays Tag.id and tech list for TEST diagnostics
- calls TEST server UID lookup
- yellow terminal visual direction

### Not yet physically passed
- Android starter has not yet been built/installed on the real phone.
- No native app NFC PASS yet.
- No product +1 from native APK yet.
- No kiosk mode yet.

### Next physical milestone
ANDROID NFC UID READ — PHYSICAL PASS
Only mark PASS after real APK + real phone + real badge repeated-read test.
