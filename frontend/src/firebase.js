import firebase from '@firebase/app';
import '@firebase/firestore'
import '@firebase/auth'

firebase.initializeApp({
  apiKey: "AIzaSyDzq21S_rOxnJsBS9j4qBY1HPmQvghcawY",
  authDomain: "sensei-b9fb6.firebaseapp.com",
  databaseURL: "https://sensei-b9fb6.firebaseio.com",
  projectId: "sensei-b9fb6",
  storageBucket: "sensei-b9fb6.appspot.com",
  messagingSenderId: "8499900719"
});


window.fb = firebase;

export default firebase;
