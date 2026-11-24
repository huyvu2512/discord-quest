# Security Policy

## Scope & Purpose

This project is built strictly for educational and non-commercial research purposes regarding session management, Discord Gateway/HTTP API protocols, and web task automation. Any unauthorized use, tampering with accounts you do not own, or violation of Discord's Terms of Service is strictly prohibited.

## User Data Handling

1. **No Server-Side Token Storage:** Serverless functions and backend handlers do not persist any Discord Tokens, account details, or user credentials to any database. Data is kept in memory only for the duration of the direct Discord API request and released immediately afterward.
2. **Safe Local Storage:** On the client side, account lists, settings, and quest state are stored locally in browser `localStorage` solely to maintain session state, and are cleared when the user logs out or resets data.
3. **Encrypted HTTPS Transport:** All communication between the browser, serverless proxy, and Discord APIs is encrypted over standard HTTPS / TLS.
4. **Security Headers:** Standard security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`) are configured on the Vercel Edge Network.

## Reporting a Vulnerability

If you discover any potential security issue in this repository, please follow these steps:

1. Do **not** publicly disclose the vulnerability via public GitHub Issues.
2. Send details of the vulnerability along with reproduction steps directly to the author:
   - Website: https://huyvu2512.io.vn
   - GitHub Profile: https://github.com/huyvu2512
3. The author will review, assess severity, and release a patch as soon as possible.
