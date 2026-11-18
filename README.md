# Social AI Command Center

A secure starter repository for a private social-media publishing dashboard.

## Important scope
This repository gives you a deployable dashboard foundation: Firebase email/password login, admin allow-list checks, Firestore security rules, a protected API, publishing queue records, and deployment configuration.

**It is not yet a turnkey 100-account publisher.** Real Instagram and YouTube publishing requires Meta/Google developer apps, OAuth consent, account permissions, API review/eligibility, and server-side token setup. The provider adapters intentionally return a clear `PROVIDER_NOT_CONFIGURED` response until those integrations are configured. Never paste social passwords or private keys into GitHub or chat.

## Architecture
- `web/`: Vite + React dashboard, Firebase Authentication.
- `functions/`: Node.js API on Firebase Cloud Functions (2nd gen), Firebase Admin, authenticated routes.
- `firestore.rules`: deny-by-default rules; users can only read their own admin profile and jobs.
- `firestore.indexes.json`: query indexes.
- Firebase Hosting serves the dashboard and rewrites `/api/**` to the Cloud Function.

## Requirements
- Node.js 20+
- Firebase CLI: `npm i -g firebase-tools`
- A Firebase project
- A Firebase project on the Blaze plan for Cloud Functions / external API calls (costs may apply).

## Setup
1. Create a Firebase project at https://console.firebase.google.com/
2. In **Authentication → Sign-in method**, enable **Email/Password**. Do not enable public account creation in the app.
3. Create a Firestore database in production mode.
4. Register a Firebase Web App. Copy its config into `web/.env`.
5. In Firebase Console → Authentication → Users, create your own admin user.
6. In Firestore, create `admins/{YOUR_FIREBASE_AUTH_UID}` with:
   ```json
   { "active": true, "role": "owner" }
   ```
   Use the UID shown in Firebase Authentication. Do not use an email address as the document ID.
7. Copy `.env.example` to `web/.env` and fill in the Firebase web config. These web config values identify the Firebase project; access is enforced by Auth and Security Rules, not by hiding the config.
8. Set your project:
   ```bash
   firebase login
   firebase use --add
   ```
9. Install and build:
   ```bash
   cd web && npm install && npm run build && cd ..
   cd functions && npm install && cd ..
   ```
10. Deploy:
   ```bash
   firebase deploy
   ```

## Local development
```bash
cd web
cp .env.example .env
npm install
npm run dev
```
The API must be deployed to Firebase for publishing endpoints to work.

## Custom domain
Use Firebase Hosting's **Add custom domain** flow and follow its DNS instructions at your domain registrar/Hostinger. If you prefer Hostinger hosting, it can serve the built `web/dist` files, but the protected API still needs Firebase Cloud Functions (or another server). Do not put API secrets in frontend files.

## Current dashboard features
- Private login (Firebase Auth).
- Admin allow-list enforced by the backend.
- Add/select connected-account records (manual placeholders only).
- Create a publishing job and view its status.
- API health endpoint.
- No social-media password collection.

## Publishing integration status
The queue and protected API are included, but provider adapters are intentionally guarded until OAuth is implemented and reviewed:
- Instagram: requires eligible Instagram Professional account(s), linked Facebook Page where applicable, Meta app and approved Graph API permissions.
- YouTube: requires Google OAuth per channel and YouTube Data API quota/eligibility.
- A single upload to many channels can be queued, but each destination is a separate API operation. Some media formats/features and account types have restrictions.

Do not store long-lived OAuth tokens in browser storage. Production token storage should use Secret Manager / encrypted server-side storage with least-privilege IAM and token rotation.

## Security checklist before production
- Use a unique admin password and enable MFA on the Google account.
- Restrict Firebase Auth authorized domains.
- Keep public sign-up disabled.
- Review Firestore and Storage rules before deployment.
- Enable App Check after configuring the web app.
- Configure billing alerts and API quotas.
- Add Cloud Armor / WAF if exposed to significant hostile traffic.
- Rotate any credential that is accidentally committed.
- Run dependency and security updates regularly.

## License
Private project starter. Review third-party service terms before use.
