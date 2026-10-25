const admin = require('firebase-admin');

const DEFAULT_FIREBASE_PROJECT_ID = 'medcare-5a446';

function buildServiceAccountFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : null;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_FIREBASE_PROJECT_ID;

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    const parsed = JSON.parse(rawJson);
    return admin.initializeApp({
      projectId,
      credential: admin.credential.cert(parsed)
    });
  }

  const serviceAccount = buildServiceAccountFromEnv();
  if (serviceAccount) {
    return admin.initializeApp({
      projectId,
      credential: admin.credential.cert(serviceAccount)
    });
  }

  // Verification of Firebase ID tokens can work with projectId-only initialization.
  return admin.initializeApp({ projectId });
}

async function verifyFirebaseIdToken(idToken) {
  const app = initializeFirebaseAdmin();
  if (!app.options.projectId) {
    throw new Error('Firebase projectId is not configured');
  }
  return admin.auth().verifyIdToken(idToken);
}

module.exports = {
  verifyFirebaseIdToken
};
