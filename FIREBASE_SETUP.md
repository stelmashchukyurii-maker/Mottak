# Firebase setup for AI Scanner Mottak v4

The page already contains the cloud-draft logic. It needs one Firebase project before two devices can share the same unfinished Bunner stack.

## Firebase console

1. Create or select a Firebase project.
2. Add a **Web app** and copy its Firebase configuration object.
3. Open **Authentication → Sign-in method** and enable **Anonymous**.
4. Create a **Cloud Firestore** database.
5. Open **Firestore → Rules**, paste the contents of `firestore.rules`, and publish the rules.

## Scanner and phone

1. Open `cloud-bunner-test.html`.
2. Expand **Firebase web config**.
3. Paste the web configuration as JSON and save it.
4. Repeat once on the phone.
5. On the scanner, create a Bunner draft and copy the phone link or enter the displayed session code on the phone.

The Firebase web configuration is not an administrator password. Do not place service-account keys or other private credentials in the page.
