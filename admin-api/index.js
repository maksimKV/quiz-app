const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Admin API listening on port ${PORT}`);
}); 