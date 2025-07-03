require('dotenv').config()
const express = require('express')
const admin = require('firebase-admin')
const cors = require('cors')
const nodemailer = require('nodemailer')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')
const path = require('path')

const rawCreds = process.env.GOOGLE_CREDENTIALS
if (!rawCreds) {
  throw new Error('GOOGLE_CREDENTIALS environment variable is not set.')
}

let serviceAccount
try {
  serviceAccount = JSON.parse(rawCreds)
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
  }
} catch (err) {
  throw new Error('Failed to parse GOOGLE_CREDENTIALS: ' + err.message)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const app = express()
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://www.gstatic.com',
        'https://www.googleapis.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
      ],
      connectSrc: [
        "'self'",
        'https://identitytoolkit.googleapis.com',
        'https://firestore.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://www.googleapis.com',
        'https://firebase.googleapis.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https://firebasestorage.googleapis.com',
        'https://lh3.googleusercontent.com',
      ],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    },
  })
)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
)
app.use(cors())
app.use(morgan('combined'))
app.use(express.json())

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
})

// Checks for valid admin token and privileges
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const match = authHeader.match(/^Bearer (.+)$/)
  if (!match) return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  const idToken = match[1]
  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    if (!decoded.isAdmin) return res.status(403).json({ error: 'Admin privileges required' })
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

app.get('/api/users', requireAdmin, async (req, res) => {
  const users = []
  let nextPageToken
  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken)
    listUsersResult.users.forEach(userRecord => {
      users.push({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        isAdmin: userRecord.customClaims?.isAdmin || false,
      })
    })
    nextPageToken = listUsersResult.pageToken
  } while (nextPageToken)
  res.json(users)
})

app.post('/api/users/promote', requireAdmin, async (req, res) => {
  const { uid } = req.body
  await admin.auth().setCustomUserClaims(uid, { isAdmin: true })
  try {
    const userRecord = await admin.auth().getUser(uid)
    if (userRecord.email) {
      const appUrl = process.env.APP_URL || 'https://your-app-url.com'
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: userRecord.email,
        subject: 'You have been granted admin access on Quiz App',
        text: `Hello${userRecord.displayName ? ' ' + userRecord.displayName : ''},\n\nYou have been granted admin access on Quiz App. You can now manage users, quizzes, and view analytics.\n\nGo to: ${appUrl}\n\nIf you did not expect this, please contact support or ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
            <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 32px;">
              <h2 style="color: #2563eb; margin-bottom: 16px;">Admin Access Granted <span style='color:#9333ea'>Quiz App</span></h2>
              <p style="font-size: 16px; color: #222;">Hello${userRecord.displayName ? ' ' + userRecord.displayName : ''},</p>
              <p style="font-size: 16px; color: #222;">You have been granted <b>admin access</b> on <b>Quiz App</b>. You can now manage users, quizzes, and view analytics.</p>
              <a href="${appUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: linear-gradient(90deg,#2563eb,#9333ea); color: #fff; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Go to Admin Panel</a>
              <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size: 13px; color: #666; word-break: break-all;">${appUrl}</p>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #aaa;">If you did not expect this, please contact support or ignore this email.</p>
            </div>
          </div>
        `,
      })
    }
  } catch (e) {
    console.error('Failed to send admin confirmation email:', e)
  }
  res.json({ success: true })
})

app.post('/api/users/demote', requireAdmin, async (req, res) => {
  const { uid } = req.body
  await admin.auth().setCustomUserClaims(uid, { isAdmin: false })
  res.json({ success: true })
})

app.delete('/api/users/:uid', requireAdmin, async (req, res) => {
  await admin.auth().deleteUser(req.params.uid)
  res.json({ success: true })
})

app.post('/api/users/invite', requireAdmin, async (req, res) => {
  const { email, name, isAdmin } = req.body
  try {
    let userRecord
    try {
      userRecord = await admin.auth().getUserByEmail(email)
    } catch (e) {
      userRecord = await admin.auth().createUser({ email, displayName: name })
    }
    if (name && userRecord.displayName !== name) {
      await admin.auth().updateUser(userRecord.uid, { displayName: name })
    }
    if (isAdmin) {
      await admin.auth().setCustomUserClaims(userRecord.uid, { isAdmin: true })
    }
    const link = await admin.auth().generatePasswordResetLink(email)
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'You are invited to Quiz App',
      text: `Hello${name ? ' ' + name : ''},\n\nYou have been invited to join Quiz App. Click the link below to set your password and complete your registration:\n\n${link}\n\nIf you did not expect this, you can ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
          <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 32px;">
            <h2 style="color: #2563eb; margin-bottom: 16px;">Welcome to <span style='color:#9333ea'>Quiz App</span>!</h2>
            <p style="font-size: 16px; color: #222;">Hello${name ? ' ' + name : ''},</p>
            <p style="font-size: 16px; color: #222;">You have been invited to join <b>Quiz App</b>. Click the button below to set your password and complete your registration:</p>
            <a href="${link}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: linear-gradient(90deg,#2563eb,#9333ea); color: #fff; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Accept Invite</a>
            <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 13px; color: #666; word-break: break-all;">${link}</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #aaa;">If you did not expect this, you can ignore this email.</p>
          </div>
        </div>
      `,
    })
    res.json({ success: true, inviteLink: link })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/register', async (req, res) => {
  const { email, password, name, isAdmin } = req.body
  try {
    let userRecord
    try {
      userRecord = await admin.auth().getUserByEmail(email)
      return res.status(400).json({ error: 'User already exists.' })
    } catch (e) {
      userRecord = await admin.auth().createUser({ email, password, displayName: name })
    }
    if (name && userRecord.displayName !== name) {
      await admin.auth().updateUser(userRecord.uid, { displayName: name })
    }
    if (isAdmin) {
      await admin.auth().setCustomUserClaims(userRecord.uid, { isAdmin: true })
    }
    // Send email verification link after registration
    const continueUrl = (process.env.APP_URL || 'http://localhost:5173') + '/verified'
    const link = await admin.auth().generateEmailVerificationLink(email, { url: continueUrl })
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Verify your email for Quiz App',
      text: `Hello${name ? ' ' + name : ''},\n\nThank you for registering for Quiz App. Please verify your email by clicking the link below:\n\n${link}\n\nIf you did not expect this, you can ignore this email.`,
      html: `<div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;"><div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 32px;"><h2 style="color: #2563eb; margin-bottom: 16px;">Welcome to <span style='color:#9333ea'>Quiz App</span>!</h2><p style="font-size: 16px; color: #222;">Hello${name ? ' ' + name : ''},</p><p style="font-size: 16px; color: #222;">Thank you for registering for <b>Quiz App</b>. Please verify your email by clicking the button below:</p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;font-weight:bold;font-size:16px;">Verify Email</a><p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p><p style="font-size: 13px; color: #666; word-break: break-all;">${link}</p><hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" /><p style="font-size: 12px; color: #aaa;">If you did not expect this, you can ignore this email.</p></div></div>`,
    })
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.use(express.static(path.join(__dirname, '../dist')))

app.get('/healthz', (req, res) => {
  res.status(200).send('OK')
})

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found' })
  res.sendFile(path.join(__dirname, '../dist', 'index.html'))
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Admin API listening on port ${PORT}`)
})
