# Fix "Missing or insufficient permissions" Error

This error is happening because your Firestore Security Rules are blocking your app from creating a new user document in the database.

### How to Fix

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **expertene-59771**.
3. In the left sidebar, click on **Build** > **Firestore Database**.
4. Click on the **Rules** tab at the top.
5. Replace the existing rules with the code below:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. Click **Publish**.

Try signing up again in your app. It should work immediately.
