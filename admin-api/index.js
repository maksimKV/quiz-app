const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const app = express();
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(cors());
app.use(express.json());

// Configure nodemailer SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Middleware to check admin token (to be implemented)
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  const idToken = match[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded.isAdmin) return res.status(403).json({ error: 'Admin privileges required' });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// List all users
app.get('/api/users', requireAdmin, async (req, res) => {
  const users = [];
  let nextPageToken;
  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    listUsersResult.users.forEach((userRecord) => {
      users.push({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        isAdmin: userRecord.customClaims?.isAdmin || false,
      });
    });
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
  res.json(users);
});

// Promote user to admin
app.post('/api/users/promote', requireAdmin, async (req, res) => {
  const { uid } = req.body;
  await admin.auth().setCustomUserClaims(uid, { isAdmin: true });
  res.json({ success: true });
});

// Demote user from admin
app.post('/api/users/demote', requireAdmin, async (req, res) => {
  const { uid } = req.body;
  await admin.auth().setCustomUserClaims(uid, { isAdmin: false });
  res.json({ success: true });
});

// Delete user
app.delete('/api/users/:uid', requireAdmin, async (req, res) => {
  await admin.auth().deleteUser(req.params.uid);
  res.json({ success: true });
});

// Invite user (send password reset link)
app.post('/api/users/invite', requireAdmin, async (req, res) => {
  const { email, name } = req.body;
  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (e) {
      userRecord = await admin.auth().createUser({ email, displayName: name });
    }
    if (name && userRecord.displayName !== name) {
      await admin.auth().updateUser(userRecord.uid, { displayName: name });
    }
    const link = await admin.auth().generatePasswordResetLink(email);
    // Send invite email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'You are invited to Quiz App',
      text: `Hello${name ? ' ' + name : ''},\n\nYou have been invited to join Quiz App. Click the link below to set your password and complete your registration:\n\n${link}\n\nIf you did not expect this, you can ignore this email.`,
    });
    res.json({ success: true, inviteLink: link });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Admin API listening on port ${PORT}`);
}); 