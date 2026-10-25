import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase project config used only for Google authentication.
const firebaseConfig = {
  apiKey: 'AIzaSyBn9l15GiV24RzNxZhLletgkyoEkG_wN9c',
  authDomain: 'medcare-5a446.firebaseapp.com',
  projectId: 'medcare-5a446',
  storageBucket: 'medcare-5a446.firebasestorage.app',
  messagingSenderId: '740369115375',
  appId: '1:740369115375:web:2d977d126c9ac36d0f931a',
  measurementId: 'G-16DV1PXMK7'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, googleProvider };
