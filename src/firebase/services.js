import {
  collection,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  setDoc,
  deleteDoc, // <-- Added this!
  serverTimestamp,
  getDocs,
  getDoc,
  increment,
} from 'firebase/firestore'
import { getToken, onMessage } from 'firebase/messaging'
import { db, auth, messaging } from './config'

// ─── YOUR VAPID KEY ──────────────────────────────────────
const VAPID_KEY = 'BOR-NTVcmKvVjZOZEnzcEuYe7N03hamPrChvgh5xKF7CRC0vQYj2-75-4mMq1K4vJcq2YHko0azSTHEVgAIif4s'
const NOTIFY_URL  = 'https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/sendHeartNotification'
export const HER_UID = 'jsLNMk8ngjhLBV1dDgtWiUCPBZD3'
export const MY_UID = 'pua5QxmB3JafsQpZybe0cTxq3AU2';

const FALLBACK = { text: 'You are my today and all of my tomorrows.', author: 'Leo Christopher' }

// ─── SCREEN 1 — Today / Quote ───
export async function getDailyQuote() {
  const snap = await getDocs(collection(db, 'quotes'))
  if (snap.empty) return FALLBACK

  const docs  = snap.docs
  const now   = new Date()
  const seed  = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  const idx   = seed % docs.length
  const data  = docs[idx].data()
  return { text: data.text, author: data.author }
}

// Fetch all quotes at once so we can cycle through them locally
export async function getAllQuotes() {
  const snap = await getDocs(collection(db, 'quotes'));
  if (snap.empty) return [];
  return snap.docs.map(d => d.data());
}

export async function addQuote({ text, author }) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  await addDoc(collection(db, 'quotes'), {
    text,
    author,
    addedBy: uid,
    addedAt: serverTimestamp(),
  })
}

// ─── SCREEN 2 — Gallery (Link-Based) ───
export const addMediaViaLink = async (url) => {
  if (!url) return;
  
  try {
    // Smart detection: Catches mp4, Discord, and Google Drive!
    const isVideo = url.toLowerCase().match(/\.(mp4|mov|webm|quicktime)/) || 
                    url.includes('discordapp') || 
                    url.includes('drive.google.com');

    await addDoc(collection(db, 'gallery'), {
      url: url,
      type: isVideo ? 'video' : 'image',
      caption: '', 
      timestamp: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error("Firestore Save Error:", error);
    throw error;
  }
};

export const deleteGalleryItem = async (id) => {
  await deleteDoc(doc(db, 'gallery', id));
};

export function subscribeGallery(cb) {
  const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cb(items);
  });
}

// ─── SCREEN 3 — Hearts ───
export async function sendHeart(type) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')

  await addDoc(collection(db, 'hearts'), {
    type,
    sentBy: uid,
    sentAt: serverTimestamp(),
  })

  try {
    await fetch(NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, sentBy: uid }),
    })
  } catch (err) {
    console.warn('Push notification failed:', err)
  }
}

export function subscribeHearts(callback) {
  // Get the 5 most recent hearts sent by either of you
  const q = query(collection(db, 'hearts'), orderBy('sentAt', 'desc'), limit(5));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  });
}

// ─── SCREEN 4 — Plans ───
export function subscribePlans(callback) {
  const q = query(collection(db, 'plans'), orderBy('order', 'asc'))
  return onSnapshot(q, snap => {
    const plans = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(plans)
  })
}

export async function togglePlan(planId, done) {
  const uid = auth.currentUser?.uid
  await updateDoc(doc(db, 'plans', planId), {
    done,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  })
}

export async function addPlan({ title, category = 'Date Night', emoji = '✨' }) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')

  const snap = await getDocs(query(collection(db, 'plans'), orderBy('order', 'desc'), limit(1)))
  const maxOrder = snap.empty ? 0 : (snap.docs[0].data().order ?? 0)

  await addDoc(collection(db, 'plans'), {
    title,
    category,
    emoji,
    done:      false,
    order:     maxOrder + 1,
    addedBy:   uid,
    createdAt: serverTimestamp(),
  })
}

export function subscribePresence(callback) {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) return () => {};

  // Automatically figure out who the partner is!
  const partnerUid = currentUid === MY_UID ? HER_UID : MY_UID;

  let meData = { moodPercentage: 50, statusText: "Offline" };
  let partnerData = { moodPercentage: 50, statusText: "Offline" };

  function emit() {
    if (typeof callback === 'function') {
      callback({ me: meData, partner: partnerData });
    }
  }


const unsubMe = onSnapshot(doc(db, 'users', currentUid), snap => {
    if (snap.exists()) meData = snap.data();
    emit();
  });


const unsubPartner = onSnapshot(doc(db, 'users', partnerUid), snap => {
    if (snap.exists()) partnerData = snap.data();
    emit();
  });

return () => { unsubMe(); unsubPartner(); }

}

export async function updatePresence({ moodPercentage, statusText }) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  // Always updates the document of whoever is currently logged in
  await setDoc(doc(db, 'users', uid), {
    moodPercentage,
    statusText,
    presenceUpdatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── FCM — Push Notifications ───
export async function initFCM() {
  const uid = auth.currentUser?.uid
  if (!uid) return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (token) {
      await setDoc(doc(db, 'users', uid), { fcmToken: token }, { merge: true })
    }
  } catch (err) {
    console.warn('FCM init failed:', err)
  }
}

export function onForegroundMessage(callback) {
  return onMessage(messaging, callback)
}