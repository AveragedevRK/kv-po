import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
export const db = getFirestore(app);
export const storage = getStorage(app);
