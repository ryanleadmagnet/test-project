# Deploying Sellifyx Frontend to Vercel

Vercel is the best platform for deploying your Next.js frontend (`store-frontend`). Since your project is a monorepo, follow these steps to ensure a smooth deployment.

## Step 1: Connect to GitHub
1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** > **Project**.
3.  Connect your GitHub repository: `ryanleadmagnet/test-project`.

## Step 2: Configure Project Settings
When you select the repository, Vercel will show a configuration screen. This is where you tell Vercel to look inside the `store-frontend` folder.

1.  **Root Directory**: Click "Edit" and select `store-frontend`.
2.  **Framework Preset**: Should automatically detect **Next.js**.
3.  **Build and Output Settings**: Leave these as defaults.

## Step 3: Set Environment Variables
Vercel needs to know where your Strapi backend is and your Stripe keys. Expand the **Environment Variables** section and add:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_STRAPI_API_URL` | Your Backend URL (e.g., `https://your-strapi-app.a.run.app`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe Publishable Key |
| `STRIPE_SECRET_KEY` | Your Stripe Secret Key |
| `STRAPI_API_TOKEN` | (Optional) If you use authenticated requests |

## Step 4: Deploy
Click **Deploy**. Vercel will build your Next.js app and provide you with a production URL.

---

## 💡 Pro Tip: CORS in Strapi
If your frontend loads but can't fetch data from Strapi, you likely need to allow your new Vercel URL in your Strapi CORS settings.

1.  Go to `testproject/config/middlewares.ts`.
2.  Update the `strapi::cors` configuration if you've customized it, or ensure the backend environment allows the Vercel domain.
3.  Most Strapi instances allow all origins by default in development, but in production, you might need to set the `CORS_ORIGIN` environment variable on your backend host.
