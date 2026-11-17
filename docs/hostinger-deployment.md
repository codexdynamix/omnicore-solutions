# Static development mode

The PHP/MySQL API and administrator authentication have been removed for now.
The backoffice at `/admin` is intentionally open during development.

CRM leads, inventory edits, deployments, site copy, and profile details are
stored in the current browser's `localStorage`. They are not shared across
browsers or visitors, and clearing browser data removes them. Website quote
requests are added to that local CRM and can still be sent through WhatsApp;
there is no server receiving or syncing them.

The Hostinger build is static-only. Do not use this open, browser-local
backoffice for sensitive data or deploy it as a production admin system. Add a
server-side backend and authentication before using it with multiple users or
real customer records.

## Deploying the static site

Pushing to `main` runs the Hostinger deployment workflow. Configure these
GitHub Actions repository secrets:

- `HOSTINGER_HOST`
- `HOSTINGER_USERNAME`
- `HOSTINGER_PASSWORD`

The workflow builds `dist/` and uploads its contents to the FTP account's
current directory. The FTP credentials are used only by the deployment
workflow; website visitors do not need to sign in.
