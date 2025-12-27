# Fix Firebase "CONFIGURATION_NOT_FOUND" Error

The error `400 (Bad Request) : CONFIGURATION_NOT_FOUND` means your Google Cloud project has not enabled the necessary APIs for Firebase Authentication to work.

### Step 1: Enable Identity Toolkit API
1. Click this link: [Enable Identity Toolkit API](https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=expertene-59771)
2. Ensure project **expertene-59771** is selected at the top.
3. Click the blue **Enable** button.

### Step 2: Enable Email/Password Provider
1. Go to Firebase Console: [Authentication Sign-in Method](https://console.firebase.google.com/project/expertene-59771/authentication/providers)
2. Click on **Email/Password**.
3. Toggle "Enable" to **On**.
4. Click **Save**.

### Step 3: Check API Key Restrictions (Only if above fails)
1. Go here: [API Credentials](https://console.cloud.google.com/apis/credentials?project=expertene-59771)
2. Click the specific API Key (starts with `AIza...`).
3. Under "API restrictions", verify it is set to "Don't restrict key" OR ensures "Identity Toolkit API" is checked.

Once you complete Step 1 & 2, the error will vanish immediately.
