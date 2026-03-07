// Script to create systemConfig/accessCodes document in Firestore
// Run this once to set up the access codes

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC8Edq2QpkRFWdpL3AaUQKc2bYFSwiOun8",
  authDomain: "purchase-orders-5c899.firebaseapp.com",
  projectId: "purchase-orders-5c899",
  storageBucket: "purchase-orders-5c899.firebasestorage.app",
  messagingSenderId: "135151903373",
  appId: "1:135151903373:web:bb6b559375369c557db8c4",
  measurementId: "G-49P897SEVE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createAccessCodes() {
  try {
    const configDocRef = doc(db, 'systemConfig', 'accessCodes');
    await setDoc(configDocRef, {
      editCode: 'KV10X',
      adminCode: 'sudo KV',
      createdAt: new Date(),
    });
    console.log('Access codes created successfully!');
    console.log('Edit Code: KV10X');
    console.log('Admin Code: sudo KV');
  } catch (error) {
    console.error('Error creating access codes:', error);
  }
}

createAccessCodes();
