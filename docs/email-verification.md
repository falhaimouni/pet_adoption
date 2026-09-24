Email verification and password recovery

Apply the database migration before starting the updated backend:

    npm run migration:run

For compiled production deployments, use the existing production migration command:

    npm run migration:run:production -w pet-adoption-backend

The existing MAIL_USER and MAIL_PASSWORD settings send both verification and password-reset emails. FRONTEND_URL must point to the public frontend URL so email links open the correct site.

New public signups must verify their email before signing in. Verification links expire after 24 hours and can be used once. Requesting a new link replaces the previous link. Existing users and administratively created accounts retain access; Google signup already requires a verified Google email.

If initial email delivery fails, the account remains pending and the user can request a new link from the verification screen or login page.

Forgot password requires a valid email on the login screen. The recovery screen displays that email as read-only. The final reset screen retrieves the account email from the reset token; clients cannot choose which account the token resets.
