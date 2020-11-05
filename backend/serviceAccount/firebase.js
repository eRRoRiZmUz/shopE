const admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shop-985ca.firebaseio.com",
  storageBucket : "gs://shop-985ca.appspot.com"
});

let storage = admin.storage()
let firebase = admin.firestore();

module.exports = {firebase, storage}