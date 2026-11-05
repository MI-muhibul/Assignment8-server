# Good Neighbors API

Express and MongoDB REST API for the Good Neighbors community events platform.

## Local development

1. Copy `.env.example` to `.env`.
2. Configure `MONGODB_URI` and provide a random `JWT_SECRET` of at least 32 characters.
3. Install dependencies with `npm install`.
4. Run `npm run dev`; the API listens on port `4000` by default.

Set `CLIENT_ORIGIN` to the client origin when deployed.

## API

- Public: `GET /api/events`, `GET /api/events/:id`, `POST /api/auth/register`, `POST /api/auth/login`.
- JWT-protected: profile, event creation, join, manage, and personal event endpoints.
- Only the authenticated event owner can update or delete their event.
- Event creation and edits require valid future dates and validated event fields.
