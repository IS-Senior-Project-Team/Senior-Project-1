// Import the Firebase functions you need
const firebase = require("firebase/compat/app");
const firestore =  require("firebase/firestore"); // Required for side-effects

// Import Firebase configuration
const { firebaseConfig } = require("./firebaseConfig");

// Initialize Firebase app
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firestore

const db = firestore.getFirestore(app);
// Add a case
async function addCase(caseData) {
  try {
    const caseRef = firestore.collection(db, 'cases');
    await firestore.addDoc(caseRef, caseData);
    console.log('Case added successfully:', caseData);
  } catch (error) {
    console.error('Error adding case:', error);
  }
}

// Add a volunteer
async function addVolunteer(volunteerData) {
  try {
    const volunteerRef = firestore.collection(db, 'volunteers');
    await firestore.addDoc(volunteerRef, volunteerData);
    console.log('Volunteer added successfully:', volunteerData);
  } catch (error) {
    console.error('Error adding volunteer:', error);
  }
}

module.exports = {addCase, addVolunteer}