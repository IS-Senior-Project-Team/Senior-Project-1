// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, getDoc, updateDoc, Firestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail,fetchSignInMethodsForEmail, Auth, browserSessionPersistence } from "firebase/auth";
import { authState } from '@angular/fire/auth'
import { Case } from '../models/case';
import { AuthService } from "./auth.service";
import { Router } from "@angular/router";
import { StaffInfo } from "../models/staff-info";
import { from, Observable, of, switchMap } from "rxjs";
// Required for side-effects
import "firebase/firestore";
import { inject } from "@angular/core";

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
// getAuth().setPersistence(browserSessionPersistence)          ------Include   THIS LATER TO SET THE STORAGE TO SESSION STORAGE
export function createUser(email: string, password: string) {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed up 

      const staffData = {
        staff_email: email,
        staff_firstname: "",
        staff_lastname: "",
        staff_address: "",                  //<<<<<<======= GOING TO CHANGE THIS TO AN STAFF ADDRESS ARRAY LATER
        staff_phoneNumber: ""
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
        .catch((error) => {
          console.log("Error writing document", error)
        })

      alert('Account has been created successfully!')
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === '/auth/email-already-exists') {
        alert("Email address already exists!")
      }
      else {
        alert("Sorry, unable to create staff member")
      }
      const errorMessage = error.message;
    });
}

auth.onAuthStateChanged((currentUser) => {
  console.log("User Status", currentUser)
});

export function loginUser(email: string, password: string) {

  //  ADD A FUNCTIONALITY LATER ON THAT CHECKS IF USER IS VERIFIED BEFORE LETTING THEM LOGIN
  //    set the login function to check if the user's email is verified or not, the property is inside the firebase user, user.isEmailVerified, or something like that.
  //   And then if it's not redirect to a "Pending Verification" page
  // const router = inject(Router)
  // const route: Router = {
  //   path: "user/:userId",
  //   component: User,
  //   canActivate: [
  //     () => {
  //       const router = inject(Router);
  //       const authService = inject(AuthenticationService);
  
  //       if (!authService.isLoggedIn()) {
  //         const loginPath = router.parseUrl("/login");
  //         return new RedirectCommand(loginPath, {
  //           skipLocationChange: "true",
  //         });
  //       }
  
  //       return true;
  //     },
  //   ],
  // };
  // const authSvc = inject (AuthService)
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      sessionStorage.setItem('loggedInUser', user.uid)
      alert("You are now logged in")
      // authSvc.navigateTo('case-management')
      // router.navigate(['case-management'])
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === "auth/invalid-credential") {
        alert("Invalid Email or Password")
      }
      else if (errorCode === 'auth/user-not-found') {
        alert("Account does not exist")
      }
      const errorMessage = error.message;
    });
}

export async function forgotPassword(email: string) {
  // TODO: Stop redirecting to login if email does not exist
  //       Stop displaying 2 alerts if the email does not exist because it is invalid
  const emailExists = await checkEmailExists(email)
  if (!emailExists) {
    return;
  }
  sendPasswordResetEmail(auth, email)
    .then(() => {
      alert("A password reset link has been sent to your email, ")
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // ..
    });
}
// TODO: Check if the observable return type is needed
// export function updateUser(user: StaffInfo): Observable<void> {
//   const ref = doc(collection(db,'staffMembers'),user.uid)
//   // const ref = doc(db, 'staffMembers', user.uid);
//   return from(updateDoc(ref, { ...user }));
// }
export function updateUser(user: StaffInfo): Observable<void> {
  console.log('Updating user with UID:', user.uid);

  if (!user.uid || user.uid.trim() === '') {
    throw new Error('Invalid UID. Cannot update user without a valid UID.');
  }

  const ref = doc(db, 'staffMembers', user.uid); // Ensure valid UID
  return from(updateDoc(ref, { ...user }));
}


export async function currentUserProfile(): Promise<StaffInfo | null> {

    // Listen for auth state changes
    const user = auth.currentUser
      if (user && user.uid) {
        try {
          const ref = doc(db, 'staffMembers', user.uid); // Get document reference
          const docSnap = await getDoc(ref); // Fetch document from Firestore
          
          if (docSnap.exists()) {
            const profile = docSnap.data() as StaffInfo;
            return profile; // Emit the user profile
          } else {
            console.error('No document found for the current user.');
            return null; // Emit null if no document is found
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
           // Emit error
        }
      } else {
        console.log('No user is currently logged in.');
         return null; // Emit null if no user is logged in
      }
      return null
}

async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // Check if the email format is valid
    if (!email || !validateEmail(email)) {
      alert("Invalid email format. Please enter a valid email.");
      return false;
    }

    // NOTE: This is a risky method becuase it is prone to email enumeration attacks
    // TODO: Turn the email enumeration protection back on in firebase
    const signInMethods = await fetchSignInMethodsForEmail(auth,email);

    if (signInMethods && signInMethods.length > 0) {
      // Email exists
      return true;
    } else {
      console.log("from checkemail exists",signInMethods)
      alert("Email does not exist. Please try again.");
      return false;
    }
  } catch (error: any) {
    if (error.code === "auth/invalid-email") {
      alert("The email address is invalid. Please try again.");
    } else if (error.code === "auth/user-not-found") {
      alert("No user found with this email address. Please try again.");
    } else {
      console.error("Error checking email:", error);
      alert("An unexpected error occurred. Please try again later.");
    }
    return false;
  }
}

// Helper function to validate email format
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

