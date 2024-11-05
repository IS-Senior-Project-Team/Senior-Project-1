// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, getDoc, updateDoc, Firestore, doc, setDoc } from 'firebase/firestore';
import { Case } from '../models/case';
import firebase from "firebase/compat/app";
// Required for side-effects
import "firebase/firestore";
// Follow this pattern to import other Firebase services
// import { } from 'firebase/<service>';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjYPCQ5wdM2DAWSRjvGSN_AQP4LrTIWb4",
  authDomain: "pawesome-test.firebaseapp.com",
  projectId: "pawesome-test",
  storageBucket: "pawesome-test.appspot.com",
  messagingSenderId: "601738301432",
  appId: "1:601738301432:web:9b08f758023198812b100d",
  measurementId: "G-WRGY0J3QBW"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Get all cases
export async function getCases(statusFilter: string | undefined): Promise<Case[]> {
  const casesCol = collection(db, 'cases');
    const casesSnapshot = await getDocs(casesCol);
    const casesList: Case[] = casesSnapshot.docs.map(doc => doc.data() as Case);
    if (statusFilter) {
      return casesList.filter(caseItem => caseItem.status === statusFilter);
    }
    return casesList;
}

// Gets a case from Firebase by id 
export async function getCaseById(caseId: string): Promise<Case | null> {
  console.log(`Fetching case with stored case ID: ${caseId}`);
  const casesCol = collection(db, 'cases');
  const casesSnapshot = await getDocs(casesCol);
  
  for (const doc of casesSnapshot.docs) {
    const caseData = { id: doc.id, ...doc.data() };
    if (caseData.id === caseId) { 
      console.log("Case found:", caseData);
      return caseData as Case;
    }
  }

  console.log("No such document!");
  return null;
}



export async function getContacts() {
  const contactsCol = collection(db, 'contacts');
  const contactsSnapshot = await getDocs(contactsCol);
  const contactsList = contactsSnapshot.docs.map(doc => doc.data());
  return contactsList;
}

// Updates a case in Firebase 
export async function updateCase(caseData: Case): Promise<void> {
  console.log(`Updating case with stored ID: ${caseData.id}`);

  // Get the collection reference
  const casesCol = collection(db, 'cases');
  const casesSnapshot = await getDocs(casesCol);

  // Find the document that matches the stored case ID
  const caseDoc = casesSnapshot.docs.find(doc => {
    const caseFromDb = doc.data();
    return caseFromDb['id'] === caseData.id; // Match based on the stored 'id'
  });

  // If the document is not found, throw an error
  if (!caseDoc) {
    throw new Error(`Case with stored ID ${caseData.id} not found in Firestore`);
  }

  // Use the document ID to update the document
  const caseRef = doc(db, 'cases', caseDoc.id); // Firestore document ID
  const { id, ...data } = caseData; // Separate id from the rest of the data

  // Update the document with the new data
  await updateDoc(caseRef, data as { [key: string]: any });

  console.log(`Case with Firestore document ID ${caseRef.id} updated successfully`);
}