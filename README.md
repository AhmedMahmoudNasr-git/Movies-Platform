# MoviesHub

## Deploy on Vercel

Vercel detects the root Express app in `index.js` and runs it as a Node.js
function. The `views/` templates are included with the function, and files in
`public/` are served by Vercel's CDN.

1. Import the repository into Vercel and use the repository root as the project
   root. No build command or output directory is required.
2. Add these environment variables to each Vercel environment you use
   (Production and Preview):
   - `MONGODB_CONNECTION` — MongoDB connection string.
   - `SESSION_SECRET` — a long, random secret used to sign session cookies.
   - `DB_NAME` — optional; defaults to `m01`.
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` — optional; set both to create the
     initial admin account when the users collection is empty. No default
     admin credentials are used.
   - `ADMIN_USERNAME` — optional; defaults to `Admin` when bootstrapping.
3. Configure MongoDB network access so the Vercel function can connect. Keep
   database credentials in Vercel environment variables, not in source files.
4. Create a **public** Vercel Blob store and connect it to the project. The SDK
   uses the Vercel OIDC connection automatically. For local Blob uploads, or
   when using a static token, configure `BLOB_READ_WRITE_TOKEN`.
5. Deploy. Existing images in `public/img/uploades/` are served with the site;
   new uploads are saved to Blob so they persist between function invocations.

Copy `.env.example` to `.env` and set `MONGODB_CONNECTION` and `SESSION_SECRET`
for local development. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` together if the
empty users collection should receive an initial admin account. Never commit
real environment values.

## Local development

Install dependencies with `npm install`, configure `.env`, then run
`npm run dev` or `npm start`.
