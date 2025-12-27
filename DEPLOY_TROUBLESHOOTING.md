# Firebase & Vercel Production Setup Guide

## 1. Google Login Error: "Unauthorized Domain"
To fix the "unauthorized domain" error when logging in with Google on your new Vercel domain:

1.  Go to the **[Firebase Console](https://console.firebase.google.com/)**.
2.  Select your project: **expertene-59771**.
3.  Navigate to **Authentication** -> **Settings** -> **Authorized Domains**.
4.  Click **"Add Domain"**.
5.  Enter your new Vercel domain (e.g., `expertene-ui.vercel.app`).
6.  Click **Add**.

*Wait a few minutes for changes to propagate.*

---

## 2. Posts Not Loading
If posts are not loading on the deployed site, it is likely due to the backend URL configuration or CORS.

### A. CORS Verification
Ensure your new Vercel domain is allowed in your backend. In your `server/index.ts` (or wherever CORS is configured), make sure you are not strictly blocking the new domain. Since you are using a proxy/rewrite in Vercel (`vercel.json`), this is often less of an issue, but good to check.

### B. Firestore Security Rules
If your production domain cannot read from the database, check your Firestore Rules.
1.  Go to **Firestore Database** -> **Rules**.
2.  Ensure read access is allowed. For public articles, it should be open.
    ```
    match /articles/{articleId} {
      allow read: if resource.data.isPublic == true || request.auth.uid == resource.data.authorId;
    }
    ```

### C. Environment Variables
Ensure you have added the necessary environment variables to your **Vercel Project Settings**:
1.  `DATABASE_URL` (if using Postgres/Neon)
2.  `SESSION_SECRET`
3.  Any other keys from `.env`

## 3. Deployment Checklist
1.  [ ] Added domain to Firebase Authorized Domains.
2.  [ ] Checked Firestore Security Rules.
3.  [ ] Verified Vercel Environment Variables.
4.  [ ] Redeployed or refreshed Vercel (sometimes needed after env var changes).
