# Shiply Frontend

## Local development
- Install dependencies with `npm install`.
- Run the app with `npm run dev`.
- If `VITE_API_BASE_URL` is not set, the app falls back to `http://localhost:8087`.

## Environment variables
- `VITE_API_BASE_URL`: public backend URL for Vercel, for example `https://api.yourdomain.com`
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID used by the login and signup screens

## Vercel
- `vercel.json` rewrites client-side routes back to `index.html`.
- Configure the two environment variables above in the Vercel project before deploying.
