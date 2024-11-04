// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, Firestore, doc, setDoc, addDoc } from 'firebase/firestore';
import firebase from "firebase/compat/app";
import { firebaseConfig } from "../../../../firebase_config"
// Required for side-effects
import "firebase/firestore";
import { Case } from "../models/case";
// Follow this pattern to import other Firebase services
// import { } from 'firebase/<service>';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const app = initializeApp(firebaseConfig);
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

// Get all volunteers
export async function getContacts() {
  const contactsCol = collection(db, 'contacts');
  const contactsSnapshot = await getDocs(contactsCol);
  const contactsList = contactsSnapshot.docs.map(doc => doc.data());
  return contactsList;
}

// Add a case
export async function addCase(caseData: any) {
  try {
    const caseRef = collection(db, 'cases');
    await addDoc(caseRef, caseData);
    console.log('Case added successfully:', caseData);
  } catch (error) {
    console.error('Error adding case:', error);
  }
}

// Add a volunteer
export async function addVolunteer(volunteerData: any) {
  try {
    const volunteerRef = collection(db, 'volunteers');
    await addDoc(volunteerRef, volunteerData);
    console.log('Volunteer added successfully:', volunteerData);
  } catch (error) {
    console.error('Error adding volunteer:', error);
  }
}
