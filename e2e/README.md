# E2E Auth & Security Tests

Playwright suite covering the four highest-value auth/security paths:

| Spec                              | Guards                                    |
| --------------------------------- | ----------------------------------------- |
| `auth-login.spec.ts`              | Valid login lands past `/login`           |
| `weak-password.spec.ts`           | Password strength meter blocks weak input |
| `impersonation-banner.spec.ts`    | Admin impersonation shows banner + guard  |
| `paywall-gate.spec.ts`            | Unpaid user is redirected to `/upgrade`   |

## Run

```bash
# First-time only
bunx playwright install chromium

# Point at whichever env you want to test
E2E_BASE_URL=https://app.liberatedkings.com \
E2E_USER_EMAIL=... E2E_USER_PASSWORD=... \
E2E_UNPAID_EMAIL=... E2E_UNPAID_PASSWORD=... \
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
E2E_IMPERSONATE_TARGET_ID=... \
bunx playwright test
```

Specs auto-skip when their required env vars are missing, so partial
configuration will not fail CI.