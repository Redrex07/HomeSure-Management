# Email System (Gmail SMTP)

## Environment variables

Copy `.env.example` to `.env` or `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_USER` | Yes | Gmail address used for SMTP authentication |
| `EMAIL_PASS` | Yes | Google App Password for `EMAIL_USER` |
| `EMAIL_FROM` | No | Sender address; defaults to `EMAIL_USER` |
| `APP_URL` | Yes | Public app URL, no trailing slash |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | For auth admin + token storage |
| `SUPPORT_EMAIL` | No | Shown in email footers |

**Important:** Use a Google App Password for `EMAIL_PASS`. Do not use your regular Google account password.

## Database setup

Run `supabase/migrations/001_email_system.sql` in the Supabase SQL Editor.

## npm packages

Email is sent with `nodemailer` through Gmail SMTP at `smtp.gmail.com:587`.

## Disable Supabase built-in emails

In Supabase Dashboard -> **Authentication** -> **Providers** -> **Email**:

- You may disable **Confirm email** to avoid duplicate emails; verification is handled by the app email flow.

## Test endpoint (remove before production)

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"you@example.com\"}"
```

## Flows

| Flow | Trigger | Email |
|------|---------|-------|
| Signup | `/signup` -> `registerAccount` | Verification (24h token) |
| Verify | `/auth/verify?token=` | Welcome (async) |
| Invite | Super Admin -> Invite user | Invitation (24h token) |
| Forgot password | `/forgot-password` | Reset (30min token) |
| Reset password | `/reset-password?token=` | - |

## Email logs

Query `email_logs` in Supabase to audit sent/failed emails.
