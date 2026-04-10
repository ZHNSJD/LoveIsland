import { initializeApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getMessaging } from 'firebase/messaging'
import { getStorage } from 'firebase/storage' // <--- ADDED STORAGE

const firebaseConfig = {
  apiKey: "AIzaSyABdFpcy1i8Ex9H5NieAu2HsPcmBSpO6Qc",
  authDomain: "loveisland-d9c3e.firebaseapp.com",
  projectId: "loveisland-d9c3e",
  storageBucket: "loveisland-d9c3e.firebasestorage.app",
  messagingSenderId: "387442661162",
  appId: "1:387442661162:web:8e0f0dcb27be2c55697053",
  measurementId: "G-J2JEZGC454"
}

export const app       = initializeApp(firebaseConfig)
export const db        = getFirestore(app)
export const auth      = getAuth(app)
export const messaging = getMessaging(app)
export const storage   = getStorage(app) // <--- INITIALIZED STORAGE

// Enable offline persistence (best-effort)
enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Offline persistence unavailable: multiple tabs open.')
  } else if (err.code === 'unimplemented') {
    console.warn('Offline persistence not supported in this browser.')
  }
})