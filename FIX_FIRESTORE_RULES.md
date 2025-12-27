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
    
    // User Profiles:
    // - Anyone can read a user profile (needed for article authors)
    // - Authenticated users can write only to their own profile
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Articles:
    // - Anyone can read articles
    // - Only authenticated users can create/update articles
    match /articles/{articleId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Click **Publish**.

Try signing up again in your app. It should work immediately.
