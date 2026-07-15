# Shiply Frontend

## Local development
- Install dependencies with `npm install`.
- Run the app with `npm run dev`.
- If `VITE_API_BASE_URL` is not set, the app falls back to `http://localhost:8087`.

## Environment variables
- `VITE_API_BASE_URL`: public backend URL for Vercel, for example `http://shiplygateway.thetalisman.co.zw`
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID used by the login and signup screens

## GitHub App import flow
- The GitHub App setup URL must point to `/projects/import/github`.
- The frontend never receives GitHub App private keys or installation tokens.
- Users can reconnect GitHub access from the import page when repository access changes.

## Production note
- The confirmed public gateway URL is currently `http://shiplygateway.thetalisman.co.zw`.
- Move this to HTTPS in production as soon as TLS is available, then update `VITE_API_BASE_URL` to match.

## Vercel
- `vercel.json` rewrites client-side routes back to `index.html`.
- Configure the two environment variables above in the Vercel project before deploying.
