// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, getDoc, updateDoc, Firestore, doc, setDoc, query, where, Timestamp, CollectionReference, DocumentReference, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail, Auth, browserSessionPersistence, browserLocalPersistence, signOut } from "firebase/auth";
import { authState } from '@angular/fire/auth'
import { Case } from '../models/case';
import { AuthService } from "./auth.service";
import { Router } from "@angular/router";
import { StaffInfo } from "../models/staff-info";
import { from, Observable, of, switchMap } from "rxjs";
import { RegisterStaffComponent } from '../view/register-staff/register-staff.component';
// Required for side-effects
import "firebase/firestore";
import { EventEmitter, inject } from "@angular/core";
import { ToastrService } from "ngx-toastr";

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

// Get all cases with an optional status filter
export async function getCases(
  status?: string,
  specie?: string,
  timeFrame?: string,
  offset: number = 0
): Promise<Case[]> {
  const casesCollection = collection(db, 'cases');
  let q = query(casesCollection);

  // Apply status filter
  if (status) {
    q = query(q, where('status', '==', status));
  }

  // Apply species filter
  if (specie) {
    q = query(q, where('species', '==', specie));
  }

  // Apply timeFrame filter
  if (timeFrame) {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date = now;

    switch (timeFrame) {
      case 'Daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
        break;
      case 'Weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - (7 * offset));
        break;
      case 'Monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        break;
      case 'Yearly':
        startDate = new Date(now.getFullYear() - offset, 0, 1);
        break;
    }

    if (startDate) {
      q = query(q, where('createdDate', '>=', Timestamp.fromDate(startDate)));
      q = query(q, where('createdDate', '<=', Timestamp.fromDate(endDate)));
    }
  }
  // q = query(q, where('isDeleted', '==', false));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Case));
}
/*
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
*/

// Gets a case from Firebase by id 
export async function getCaseById(caseId: string): Promise<Case | null> {
  console.log(`Fetching case with stored case ID: ${caseId}`);

  const casesCol = collection(db, 'cases');
  const q = query(casesCol, where("id", "==", caseId));
  const querySnapshot = await getDocs(q)

  if (querySnapshot) {
    let caseData = {};

    querySnapshot.forEach(doc => {
      caseData = { id: doc.id, ...doc.data() }
    });

    return caseData as Case;
  } else {
    console.log("No such document!");
    return null;
  }
}

//Get the highest value in the id property of all Cases, used to assign IDs to new Cases
export async function getCaseHighestID() {
  const casesCol = collection(db, 'cases');
  const casesColSnapshot = await getDocs(casesCol);
  let highestID: string = "";
  for (let doc of casesColSnapshot.docs) {
    // console.log(doc.id + " " + typeof (doc.id));
    if (doc.data()['id'] > highestID) {
      highestID = doc.data()['id'];
    }
  }
  // console.log(highestID);
  return highestID;
  // casesColSnapshot.docs.sort((a,b) => {
  //   if (b.id['id'] < a.id) {
  //     return 1
  //   }
  // })

  // let query = query(casesCol, where('id', '==', "1"))
  // const specific = await getDocs(,casesCol);
  // const highestValueCase = await casesCol.orderBy('id').limit(1).get();
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

export async function createDoc(caseData: Case): Promise<boolean> {
  // Removed the below line to lower document reads, as it is not needed with unique case IDs
  // let highestID: string = await getCaseHighestID();
  const casesCol: CollectionReference = collection(db, 'cases');
  if (typeof caseData.createdDate === 'string') {
    caseData.createdDate = Timestamp.fromDate(new Date(caseData.createdDate));
  } else {
    caseData.createdDate = Timestamp.fromDate(new Date());
  }
  let newDoc: DocumentReference | null = null;
  newDoc = await addDoc(casesCol, caseData);
  if (newDoc == null) {
    return false;
  }

  return true;
}

//   <== ACCOUNT MANAGEMENT FUNCTIONS BELOW ==>

// This will create a staff member based on the email and temporary password set by admin.
// An email will then be sent for staff member to make changes and complete account creation
const auth = getAuth();

// getAuth().setPersistence(browserLocalPersistence)        //  ------Include   THIS LATER TO SET THE STORAGE TO SESSION STORAGE
export function createUser(email: string, password: string, isAdmin: boolean, router: Router, toastr: ToastrService) {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed up 

      const staffData = {
        email: email,
        firstname: "",
        lastname: "",
        address: "",                  //<<<<<<======= GOING TO CHANGE THIS TO AN STAFF ADDRESS ARRAY LATER
        phoneNumber: "",
        isAdmin: isAdmin,
        isActive: true
      }

      //NEED TO FIND A WAY TO INLUDE THIS MESSAGE IN THE RECIPIENTS EMAIL

      sendEmailVerification(userCredential.user)
        .then(() => {
          alert("Email verification link sent. They should click \"Forgot Password\" link upon first login to setup their password")
        });


      // Adding users to firestore
      const user = userCredential.user;
      const docRef = doc(db, "staffMembers", user.uid)
      setDoc(docRef, staffData)
        .catch((error) => {
          console.log("Error writing document", error)
        })

      toastr.success('Account has been created successfully!', 'Successful', {positionClass: "toast-bottom-left"});
      router.navigate(['/admin-dashboard/users'])
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode == 'auth/email-already-in-use') {
        toastr.warning('Email address already exists!', 'Warning', {positionClass: "toast-bottom-left"});
    }
      else {
        toastr.error('Unable to create staff member', 'Error', {positionClass: "toast-bottom-left"});
      }
      const errorMessage = error.message;
    });
}

auth.onAuthStateChanged((currentUser) => {
  if (currentUser) {
    const user_id = currentUser.uid;
    console.log("User Status", user_id)
  }
});

// export function loginUser(email: string, password: string, router: Router) {

//   const UserLoggedIn: EventEmitter<string> = new EventEmitter<string>();
//   //  ADD A FUNCTIONALITY LATER ON THAT CHECKS IF USER IS VERIFIED BEFORE LETTING THEM LOGIN
//   //    set the login function to check if the user's email is verified or not, the property is inside the firebase user, user.isEmailVerified, or something like that.
//   //   And then if it's not redirect to a "Pending Verification" page
//   signInWithEmailAndPassword(auth, email, password)
//     .then(async (userCredential) => {
//       // Signed in 
//       const user = userCredential.user;
//       // Fetch user role from Firestore
//       const userDocRef = doc(db, "staffMembers", user.uid);
//       const userDoc = await getDoc(userDocRef);

//       if (userDoc.exists()) {
//         const userData = userDoc.data();
//         sessionStorage.setItem("loggedInUser", JSON.stringify({
//           uid: user.uid,
//           isAdmin: userData["isAdmin"] || false,
//         }))
//         UserLoggedIn.emit(email);

//         if (userData["isAdmin"]) {
//           router.navigate(["/admin-dashboard"]); // Redirect admin
//         } else {
//           router.navigate(["/case-management"]); // Redirect staff
//         }
//       }

//       alert("You are now logged in")
//       return true;
//     })
//     .catch((error) => {
//       const errorCode = error.code;
//       const errorMessage = error.message;
//       console.log(errorCode, errorMessage)
//       if (errorCode === "auth/wrong-password") {
//         alert("Invalid Email or Password")
//       }
//       else if (errorCode === "auth/invalid-email") {
//         alert("Invalid Email or Password")
//       }
//       else if (errorCode === 'auth/user-not-found') {
//         alert("Account does not exist")
//       }
//       // const errorMessage = error.message;
//     });
// }

export function loginUser(email: string, password: string, router: Router, toastr: ToastrService): Promise<StaffInfo | null> {
  return signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      const userDocRef = doc(db, "staffMembers", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as StaffInfo;

        if (!userData.isActive) {
          await signOut(auth);
          alert("Your account has been deactivated. Please contact an administrator.");
          return null;
        }

        const userInfo = {
          uid: user.uid,
          firstname: userData.firstname || "",
          lastname: userData.lastname || "",
          email: userData.email || "",
          isAdmin: userData.isAdmin || false,
          address: userData.address,
          password: userData.password,
          phoneNumber: userData.phoneNumber,
          isActive: userData.isActive
        };

        sessionStorage.setItem("loggedInUser", JSON.stringify(userInfo));

        // Redirect based on user role
        if (userData["isAdmin"]) {
          router.navigate(["/admin-dashboard"]);
        } else {
          router.navigate(["/case-management"]);
        }

        return userInfo; // Return user data
      }

      return null;
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage)
      if (errorCode === "auth/wrong-password") {
        toastr.warning('Invalid Email or Password', 'Warning', {positionClass: "toast-bottom-left"}); 
      }
      else if (errorCode === "auth/invalid-email") {
        toastr.warning('Invalid Email or Password', 'Warning', {positionClass: "toast-bottom-left"});
      }
      else if (errorCode === 'auth/user-not-found') {
        toastr.error('Account does not exist', 'Error', {positionClass: "toast-bottom-left"});
      }
      // const errorMessage = error.message;
      return null;
    });
}

export async function forgotPassword(email: string, toastr: ToastrService) {
  const emailExists = await checkEmailExists(email, toastr)
  if (!emailExists) {
    return;
  }
  sendPasswordResetEmail(auth, email)
    .then(() => {
      toastr.info('A password reset link has been sent to your email!', 'Password Reset', {positionClass: "toast-bottom-left"});
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // ..
    });
}

export function updateUser(user: StaffInfo): Observable<void> {
  const currentUser = auth.currentUser

  if (!currentUser?.uid || currentUser?.uid.trim() === '') {
    throw new Error('Invalid UID. Cannot update user without a valid UID.');
  }

  const ref = doc(db, 'staffMembers', currentUser.uid); // Ensure valid UID
  return from(updateDoc(ref, { ...user }));
}

export async function deactivateUser(uid: string | null, router: Router, toastr: ToastrService) {
  try {
    // const user = await getUserProfile(uid)
    // const userId = user?.uid;
    let confirmDeactivate = confirm('Are you sure you want to deactivate this user?')
    if (confirmDeactivate) {
      const userDocRef = doc(db, "staffMembers", uid!);

      updateDoc(userDocRef, { isActive: false })
        .then(() => {
          toastr.success('User has been deactivated', 'Deactivated', {positionClass: "toast-bottom-left"});
          router.navigate(['/admin-dashboard/users'])
        })
        .catch((error) => {
          console.error("Error deactivating user:", error);
        });
    }
    else {
      toastr.info('Deactivation was canceled', 'Canceled', {positionClass: "toast-bottom-left"});
    }
  } catch (error) {
    console.error("Error getting current user")
  }
}

export async function activateUser(uid: string | null, router: Router, toastr: ToastrService) {
  try {
    // const user = await getUserProfile(uid)
    // const userId = user?.uid;
    const userDocRef = doc(db, "staffMembers", uid!);

    updateDoc(userDocRef, { isActive: true })
      .then(() => {
        toastr.success('User has been activated', 'Activated', {positionClass: "toast-bottom-left"});
        router.navigate(['/admin-dashboard/users'])
      })
      .catch((error) => {
        console.error("Error activating user:", error);
      });
  } catch (error) {
    console.error("Error getting current user")
  }
}


export async function currentUserProfile(): Promise<StaffInfo | null> {

  const user = auth.currentUser
  if (user && user.uid) {
    try {
      const ref = doc(db, 'staffMembers', user.uid);
      const docSnap = await getDoc(ref);

      if (docSnap.exists()) {
        const profile = docSnap.data() as StaffInfo;
        return profile;
      } else {
        console.error('No document found for the current user.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:');
    }
  } else {
    console.log('From firebase connection: No user is currently logged in.');
    return null;
  }
  return null
}

export async function getUserProfile(uid: string): Promise<Promise<StaffInfo> | null> {
  if (uid != null) {
    try {
      const ref = doc(db, 'staffMembers', uid);
      const docSnap = await getDoc(ref);

      if (docSnap.exists()) {
        const profile = docSnap.data() as StaffInfo;
        return profile;
      } else {
        console.error('No document found for the current user.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  } else {
    console.log('The user UID is invalid');
    return null;
  }
  return null
}

export async function fetchAllUsers(): Promise<StaffInfo[]> {
  const usersCollection = collection(db, "staffMembers");
  const querySnapshot = await getDocs(usersCollection);
  return querySnapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data()
  })) as StaffInfo[];
}

async function checkEmailExists(email: string, toastr: ToastrService): Promise<boolean> {
  try {
    // Check if the email format is valid
    if (!email || !validateEmail(email)) {
      toastr.warning('Invalid email format. Please enter a valid email.', 'Error', {positionClass: "toast-bottom-left"});
      return false;
    }

    // NOTE: This is a risky method becuase it is prone to email enumeration attacks
    // TODO: Turn the email enumeration protection back on in firebase
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);

    if (signInMethods && signInMethods.length > 0) {
      // Email exists
      return true;
    } else {
      toastr.error('This email does not exist. Please try again.', 'Error', {positionClass: "toast-bottom-left"});
      return false;
    }
  } catch (error: any) {
    if (error.code === "auth/invalid-email") {
      toastr.error('The email address is invalid. Please try again.', 'Error', {positionClass: "toast-bottom-left"});
    } else if (error.code === "auth/user-not-found") {
      toastr.error('No user found with this email address. Please try again.', 'Error', {positionClass: "toast-bottom-left"});
    } else {
      console.error("Error checking email:", error);
      toastr.error('An unexpected error occurred. Please try again later', 'Error', {positionClass: "toast-bottom-left"});
    }
    return false;
  }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}