# Deploying Sellifyx to Google Cloud Run

Your project is structured as a monorepo with `store-frontend` (Next.js) and `testproject` (Strapi Backend). To deploy this to Google Cloud Run, you need to deploy two separate services: one for the backend and one for the frontend.

## ⚠️ Important Database Warning
**Do NOT deploy Strapi with SQLite to Cloud Run.** Cloud Run containers are ephemeral (they disappear when idle), so you will lose all your data (products, admin users) every time the app restarts.

**You must use an external database**, such as:
- **Google Cloud SQL** (PostgreSQL) - Best integration but costs money.
- **Supabase / Neon** (PostgreSQL) - Good free tiers, easy to setup.

---

## Step 1: Deploy the Backend (Strapi)

1.  **Prepare your Database**: Get the connection details (Host, User, Password, Database Name) for your PostgreSQL database.
2.  Go to the [Google Cloud Run Console](https://console.cloud.google.com/run).
3.  Click **Create Service**.
4.  **Source**: Select "Continuously deploy new revisions from a source repository".
5.  **Repository**: Connect your GitHub repo (`ryanleadmagnet/test-project`).
6.  **Configuration**:
    *   **Source directory**: Click "Edit" and change `/` to `/testproject` (This is crucial!).
    *   **Dockerfile**: Select "Dockerfile" (it should be auto-detected in `testproject/Dockerfile`).
7.  **Environment Variables**:
    Expand the "Container, Networking, Security" section, go to the **Variables** tab, and add these:
    *   `HOST`: `0.0.0.0`
    *   `PORT`: `1337`
    *   `APP_KEYS`: (Generate 4 random, comma-separated strings)
    *   `API_TOKEN_SALT`: (Random string)
    *   `ADMIN_JWT_SECRET`: (Random string)
    *   `TRANSFER_TOKEN_SALT`: (Random string)
    *   `DATABASE_CLIENT`: `postgres` (or `mysql`)
    *   `DATABASE_HOST`: (Your DB Host)
    *   `DATABASE_PORT`: `5432`
    *   `DATABASE_NAME`: (Your DB Name)
    *   `DATABASE_USERNAME`: (Your DB User)
    *   `DATABASE_PASSWORD`: (Your DB Password)
    *   `DATABASE_SSL`: `true` (usually required for external DBs)
8.  **Authentication**: Select "Allow unauthenticated invocations" (so your frontend can hit the API).
9.  Click **Create**.

*Wait for the deployment to finish. Copy the URL (e.g., `https://testproject-xyz.a.run.app`).*

---

## Step 2: Deploy the Frontend (Next.js)

1.  Go back to the [Cloud Run Console](https://console.cloud.google.com/run).
2.  Click **Create Service**.
3.  **Source**: Connect the same GitHub repo.
4.  **Configuration**:
    *   **Source directory**: Change `/` to `/store-frontend`.
    *   **Dockerfile**: Select "Dockerfile" (it should be detected in `store-frontend/Dockerfile`).
5.  **Environment Variables**:
    *   `NEXT_PUBLIC_STRAPI_API_URL`: Paste the **Backend URL** from Step 1 (e.g., `https://testproject-xyz.a.run.app`).
    *   `STRIPE_SECRET_KEY`: (Your Stripe Secret Key)
    *   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: (Your Stripe Public Key)
6.  **Authentication**: Select "Allow unauthenticated invocations" (so users can visit the site).
7.  Click **Create**.

---

## Step 3: Connect Frontend to Backend

1.  Once the Frontend is deployed, copy its URL (e.g., `https://store-frontend-abc.a.run.app`).
2.  Go to your **Strapi Admin Panel** (Backend URL + `/admin`).
3.  Go to **Settings** > **API Tokens** (if you use them) or ensure your Public API permissions are set to allow access to Products/Categories.
4.  (Optional) If you have CORS issues, you might need to update the `config/middlewares.ts` in Strapi to accept the Frontend URL, push the change to GitHub, and let Cloud Run redeploy.

You are now live! 🚀
