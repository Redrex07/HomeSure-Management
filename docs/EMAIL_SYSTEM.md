# Email System (Resend)

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Resend API key (server-only) |
| `EMAIL_FROM` | Yes | Verified sender address in Resend |
| `APP_URL` | Yes | Public app URL, no trailing slash |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | For auth admin + token storage |
| `SUPPORT_EMAIL` | No | Shown in email footers |

**Important:** In Resend, verify your sending domain before production use. Gmail addresses cannot be used as `from` unless configured in Resend.

## Database setup

Run `supabase/migrations/001_email_system.sql` in the Supabase SQL Editor.

## npm packages

No additional email packages are required — the Resend REST API is called via native `fetch`.

## Disable Supabase built-in emails

In Supabase Dashboard → **Authentication** → **Providers** → **Email**:

- You may disable **Confirm email** to avoid duplicate emails (verification is handled by Resend).

## Test endpoint (remove before production)

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"you@example.com\"}"
```

## Flows

| Flow | Trigger | Email |
|------|---------|-------|
| Signup | `/signup` → `registerAccount` | Verification (24h token) |
| Verify | `/auth/verify?token=` | Welcome (async) |
| Invite | Super Admin → Invite user | Invitation (24h token) |
| Forgot password | `/forgot-password` | Reset (30min token) |
| Reset password | `/reset-password?token=` | — |

## Email logs

Query `email_logs` in Supabase to audit sent/failed emails.
