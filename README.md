# quiz-app

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Email Invites (Admin)

The backend now supports sending email invites when an admin invites a user. This uses Nodemailer and SMTP. You must set the following environment variables in your deployment or `.env` file:

```
SMTP_HOST=your.smtp.host
SMTP_PORT=587 # or 465 for SSL
SMTP_SECURE=false # true if using port 465
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=Quiz App <noreply@yourdomain.com> # optional, defaults to SMTP_USER
```

When an admin invites a user, the backend will send an email with a password setup link.
