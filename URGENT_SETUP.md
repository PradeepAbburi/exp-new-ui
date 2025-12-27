# 🚨 CRITICAL FIREBASE SETUP REQUIRED

Your app is connected to Firebase, but the **Database is Locked**.

You **must** do this for the "Permission Denied" error to stop:

1.  Go to [Firebase Console > Firestore Database](https://console.firebase.google.com/project/expertene-59771/firestore/rules)
2.  Click the **Rules** tab.
3.  **Delete everything** currently there.
4.  **Paste this exact code** (This is "Test Mode" - allows everything):

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

5.  Click **Publish**.

**Once you do this, your app will work instantly.**
