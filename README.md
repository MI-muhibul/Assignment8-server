# Good Neighbors API

Express and MongoDB REST API for the Good Neighbors community events platform.

## Local development

1. Copy `.env.example` to `.env`.
2. Configure `MONGODB_URI`, `GOOGLE_CLIENT_ID`, and provide a random `JWT_SECRET` of at least 32 characters.
3. Install dependencies with `npm install`.
4. Run `npm run dev`; the API listens on port `4000` by default.

Set `CLIENT_ORIGIN` to the client origin when deployed.

## Deploy the API to Render

The root `render.yaml` is a Render Blueprint for this repository. Before deploying:

1. Push this server repository to its own GitHub repository. The server folder is a separate local Git repository from the client.
2. In Render, choose **New → Blueprint**, connect the server repository, and deploy the `render.yaml` Blueprint.
3. During setup, set the requested `MONGODB_URI` to your MongoDB Atlas connection string and `GOOGLE_CLIENT_ID` to your Google OAuth web client ID. Render generates `JWT_SECRET` for you; keep it private.
4. After the client is deployed, set `CLIENT_ORIGIN` in the Render service to the exact client origin, for example `https://your-site.vercel.app` (no path or trailing slash), then redeploy.
5. Verify the service's `/api/health` URL returns `{"status":"ok"}`.

In MongoDB Atlas, create a database user for the API and add Render's outbound IP addresses to the project's network access list. If the Render plan does not provide stable outbound IPs, `0.0.0.0/0` allows connections from any IP; use it only if necessary, with a strong database user password and least-privilege access.

## API

- Public: `GET /api/events`, `GET /api/events/:id`, `POST /api/auth/register`, `POST /api/auth/login`.
- `POST /api/auth/google` verifies a Google ID token, creates or links a user with a verified email, and returns the app's JWT.
- JWT-protected: profile, event creation, join, manage, and personal event endpoints.
- Only the authenticated event owner can update or delete their event.
- Event creation and edits require valid future dates and validated event fields.
