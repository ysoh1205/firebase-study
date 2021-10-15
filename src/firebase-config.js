const config = {
  apiKey: "AIzaSyDr1wT-aH50GX3SNlWq4pQEoBFi1foq4-w",
  authDomain: "myboard-bc1c3.firebaseapp.com",
  projectId: "myboard-bc1c3",
  storageBucket: "myboard-bc1c3.appspot.com",
  messagingSenderId: "1075046048009",
  appId: "1:1075046048009:web:970643e1243c671917f3d8"
};

export function getFirebaseConfig() {
  if (!config || !config.apiKey) {
    throw new Error('No Firebase configuration object provided.' + '\n' +
    'Add your web app\'s configuration object to firebase-config.js');
  } else {
    return config;
  }
}