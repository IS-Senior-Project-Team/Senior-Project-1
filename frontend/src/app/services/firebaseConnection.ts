// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, getDoc, updateDoc, Firestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { Case } from '../models/case';

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

// This will create a staff member based on the email and temporary password set by admin.
// An email will then be sent for staff member to make changes and complete account creation
const auth = getAuth();

export function createUser (email: string, password: string) 
{ 
  createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed up 
   
    const staffData = {
      email : email,
      firstName : "",
      lastName: "",
      address: "",                  //<<<<<<======= GOING TO CHANGE THIS TO AN STAFF ADDRESS ARRAY LATER
      phoneNumber : ""
    }

    //Supposed to send email with creation

    sendEmailVerification(userCredential.user)
    .then(() => {
      alert("Email verification link sent. Please click \"Forgot Password\" link upon first login to reset your password and complete your account profile")
    }); 


  // Adding users to firestore
    const user = userCredential.user;
    const docRef = doc(db, "staffMembers", user.uid)
    setDoc(docRef, staffData)
    .catch((error)=>{
      console.log("Error writing document", error)
    })

    alert('Account has been created successfully!')
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    if(errorCode ==='/auth/email-already-exists'){
      alert("Email address already exists!")
    }
    else {
      alert("Sorry, unable to create staff member")
    }
    const errorMessage = error.message;
  });
}

  auth.onAuthStateChanged((currentUser) => {
    console.log("After Verification",currentUser)
  });

export function loginUser (email : string, password: string) {

//  ADD A FUNCTIONALITY LATER ON THAT CHECKS IF USER IS VERIFIED BEFORE LETTING THEM LOGIN
//    set the login function to check if the user's email is verified or not, the property is inside the firebase user, user.isEmailVerified, or something like that.
//   And then if it's not redirect to a "Pending Verification" page

  signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    sessionStorage.setItem('loggedInUser',user.uid)
    alert("You are now logged in")
    // router.navigate(['case-management'])
  })
  .catch((error) => {
    const errorCode = error.code;
    if (errorCode==="auth/invalid-credential") {
      alert ("Invalid Email or Password")
    }
    else if (errorCode==='auth/user-not-found') {
      alert ("Account does not exist")
    }
    const errorMessage = error.message;
  });
}

export async function forgotPassword (email: string) {
  // TODO: Stop redirecting to login if email does not exist
  //       Stop displaying 2 alerts if the email does not exist because it is invalid
  if (await checkEmailExists(email) == false) {
    return ;
  }
  sendPasswordResetEmail(auth, email)
  .then(() => {
    alert("A password reset link has been sent to your email, ")
  })
  .catch((error) => {
    const errorCode = error.code;
    if(errorCode ==="auth/invalid-email") {
      alert("Error resetting password. Please enter a valid email")
    }
    const errorMessage = error.message;
    // ..
  });
}

async function checkEmailExists(email: string) {
  try {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);

    if (signInMethods.length > 0) {
      // Email exists, proceed with password reset
      return true; 
    } else {
      alert("Email does not exist. Please try again")
      return false; 
    }
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    // ...
  } else {
    // User is signed out
    // ...
  }
});
