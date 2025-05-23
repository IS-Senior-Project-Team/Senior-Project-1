// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, getDoc, updateDoc, Firestore, doc, setDoc, query, Query, where, orderBy, limit, Timestamp, CollectionReference, DocumentReference, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, deleteUser, signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail, updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider, User, onAuthStateChanged, verifyBeforeUpdateEmail } from "firebase/auth";
import { authState } from '@angular/fire/auth'
import { Case } from '../models/case';
import { AuthService } from "./auth.service";
import { Router } from "@angular/router";
import { StaffInfo } from "../models/staff-info";
import { from, Observable, of, switchMap } from "rxjs";
// Required for side-effects
import "firebase/firestore";
import { ToastrService } from "ngx-toastr";
import { HttpClient } from "@angular/common/http";

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

// Initialize Client Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get cases with optional filters
export async function getCases(
  status?: string,
  specie?: string,
  timeFrame?: string,
  offset: number = 0,
  createdStartDate?: Date,
  createdEndDate?: Date,
  updatedStartDate?: Date,
  updatedEndDate?: Date,
  searchValue?: string,
  casesDefault?: boolean,
  deletedCases?: boolean
): Promise<Case[]> {
  const casesCollection = collection(db, 'cases');
  let q = query(casesCollection);
  let results: Case[] = []

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

  if (createdStartDate && createdEndDate) {
    q = query(q, where('createdDate', '>=', Timestamp.fromDate(createdStartDate)));

    // Set end date to the end of the day to include cases created on the end date
    const endOfDayEndDate = new Date(createdEndDate);
    endOfDayEndDate.setHours(23, 59, 59, 999);
    q = query(q, where('createdDate', '<=', Timestamp.fromDate(endOfDayEndDate)));
  }

  if (updatedStartDate && updatedEndDate) {
    q = query(q, where('updateDate', '>=', Timestamp.fromDate(updatedStartDate)));

    // Set end date to the end of the day to include cases updated on the end date
    const endOfDayEndDate = new Date(updatedEndDate);
    endOfDayEndDate.setHours(23, 59, 59, 999);
    q = query(q, where('updateDate', '<=', Timestamp.fromDate(endOfDayEndDate)));
  }

  // Apply if no date range/filter applied
  if (casesDefault === true) {
    if (searchValue === '' || searchValue === undefined) {
      if (deletedCases === false) {
        // Up to 10 most recently created cases
        q = query(q, where('isDeleted', '==', false), orderBy('createdDate', 'desc'), limit(10));
      }
      else if (deletedCases === true) {
        // Up to 50 most recently created cases that are marked as deleted
        q = query(q, where('isDeleted', '==', true), orderBy('createdDate', 'desc'), limit(50));
      }
      const snapshot = await getDocs(q);
      results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
      return results; // Exit early
    }
  }

  // Apply if date range/filter is applied
  if (casesDefault === false) {
    if (deletedCases === false) {
      // Most recently created cases
      q = query(q, where('isDeleted', '==', false), orderBy('createdDate', 'desc'));
    }
    if (deletedCases === true) {
      // Most recently created cases that are marked as deleted
      q = query(q, where('isDeleted', '==', true), orderBy('createdDate', 'desc'));
    }
  }

  // Search value is defined and not empty
  if (searchValue && searchValue !== '') {
    // Parse search terms
    const searchTerms = searchValue.trim().split(/\s+/);

    // Array to hold all query results
    const allResults: Case[] = [];

    // Try exact search for first & last name
    if (searchTerms.length === 2) {
      // Try first name + last name match
      const firstNameQuery = query(
        q,
        where('firstName', '>=', searchTerms[0]),
        where('firstName', '<=', searchTerms[0] + '\uf8ff')
      );

      const snapshot = await getDocs(firstNameQuery);
      snapshot.forEach(doc => {
        const data = doc.data();
        // Check if last name also matches
        if (
          data['lastName'] &&
          data['lastName'].toLowerCase().startsWith(searchTerms[1].toLowerCase())
        ) {
          allResults.push({ id: doc.id, ...data } as Case);
        }
      });
    }

    // If no results from combined name search or not a 2-term search,
    // try individual term searches
    if (allResults.length === 0) {
      // Run individual term searches
      for (const term of searchTerms) {
        if (term.trim() === '') continue;

        const searchQueries: Query[] = [
          query(q, where('firstName', '>=', term), where('firstName', '<=', term + '\uf8ff')),
          query(q, where('lastName', '>=', term), where('lastName', '<=', term + '\uf8ff')),
          query(q, where('phoneNumber', '>=', term), where('phoneNumber', '<=', term + '\uf8ff')),
          query(q, where('id', '>=', term), where('id', '<=', term + '\uf8ff')),
        ];

        // Execute all search queries for this term
        for (const searchQuery of searchQueries) {
          const snapshot = await getDocs(searchQuery);
          snapshot.forEach(doc => {
            // Check if this document is already in results
            if (!allResults.some(item => item.id === doc.id)) {
              allResults.push({ id: doc.id, ...doc.data() } as Case);
            }
          });
        }
      }
    }

    results = allResults;
  }
  // Empty search value
  else if (searchValue === '') {
    if (casesDefault === false) {
      if (!status && !specie && !timeFrame && !createdStartDate && !createdEndDate && !updatedStartDate && !updatedEndDate) {
        // No filters applied - return empty results
        results = [];
      }
      else {
        // Empty search but other filters are applied - apply the filters
        const snapshot = await getDocs(q);
        results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Case));
      }
    }
  }
  else {
    // When searchValue == undefined, return filtered cases
    const snapshot = await getDocs(q);
    results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Case));
  }

  return results;
}

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

export async function permDeleteCase(caseData: Case): Promise<void> {
  console.log(`Deleting case with stored ID: ${caseData.id}`);

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

  // Use the Firestore document ID to get the document
  const caseRef = doc(db, 'cases', caseDoc.id);
  await deleteDoc(caseRef); // Delete the document in Firestore

  console.log(`Case with Firestore document ID ${caseRef.id} deleted successfully`);
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

//   <== ACCOUNT MANAGEMENT FUNCTIONS BELOW ==> //

const auth = getAuth();

export async function createUser(email: string, password: string, isAdmin: boolean, router: Router, toastr: ToastrService, httpClient: HttpClient) {
  var apiUrl = "https://jax-humane-pet-center-system.onrender.com/create-user"; // using a backend server for admin sdk to create users
  try {

    const usersCollection = collection(db, "staffMembers");

    // Check if the email already exists in database
    const q = query(usersCollection, where("email", "==", email), where("isDeleted", "==", false));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      toastr.warning('An account with this email already exists!', 'Warning', { positionClass: "toast-bottom-left" });
      return;
    } else {
      return httpClient.post(apiUrl, { email, password, isAdmin }).toPromise()
        .then(() =>
          toastr.success('User Created', 'Success', { positionClass: 'toast-bottom-left' })
        ).then(() =>
          router.navigate(['/admin-dashboard/users']))
        .catch(()=> {
            toastr.error('Error creating staff member', 'Error', { positionClass: 'toast-bottom-left' })
        })
    }
  } catch (err) {
    return;
  }
}

export async function deleteUserByAdmin(userUid: string, toastr: ToastrService, router: Router) {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    toastr.error("Admin not logged in.");
    return;
  }

  try {
    const idToken = await currentUser.getIdToken(); // Get admin's ID token

    const response = await fetch(`https://jax-humane-pet-center-system.onrender.com/admin/delete-user/${userUid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      toastr.success("User deleted successfully.",'User Deleted', { positionClass: 'toast-bottom-left' });
      router.createUrlTree(['/admin-dashboard/users'])

    } else {
      toastr.error(data.error || "Failed to delete user.",'Error', { positionClass: 'toast-bottom-left'});
    }

  } catch (error) {
    toastr.error("An unexpected error occurred.",'Error', { positionClass: 'toast-bottom-left'});
  }
}

export async function loginUser(email: string, password: string, router: Router, toastr: ToastrService): Promise<Partial<StaffInfo> | null> {

  const usersCollection = collection(db, "staffMembers");

  // Check if the email already exists in database
  const q = query(usersCollection, where("email", "==", email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    toastr.error('Account does not exist', 'Error', { positionClass: "toast-bottom-left" });
    return null;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "staffMembers", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as StaffInfo;

      if (!userData.isActive || userData.isDeleted) {
        await signOut(auth);
        toastr.error("Your account has been deactivated or deleted. Please contact an administrator.", 'Unauthorized', { positionClass: 'toast-bottom-left' });
        return null;
      }

      const userInfo = {
        firstname: userData.firstname || "",
        lastname: userData.lastname || "",
        isAdmin: userData.isAdmin || false,
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
  } catch (error: any) {

    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-email" || error.code === "auth/invalid-credential") {
      toastr.warning('Invalid Email or Password', 'Warning', { positionClass: "toast-bottom-left" });
    } else if (error.code === 'auth/user-not-found') {
      toastr.error('Account does not exist', 'Error', { positionClass: "toast-bottom-left" });
    }
    
    return null;
  }
}

export async function forgotPassword(email: string, toastr: ToastrService) {
  const emailExists = await checkEmailExists(email, toastr)
  if (!emailExists) { //
    return;
  }
  sendPasswordResetEmail(auth, email)
    .then(() => {
      toastr.info('A password reset link has been sent to your email!', 'Password Reset', { positionClass: "toast-bottom-left" });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
    });
}

export async function changePassword(currentPswd: string, newPswd: string, toastr: ToastrService) {
  const user = auth.currentUser;

  if (!user) {
    toastr.error('No user is logged in', 'Error', { positionClass: 'toast-bottom-left' })
    return;
  }

  const credential = EmailAuthProvider.credential(user.email!, currentPswd);

  try {
    // Reauthenticate the user before password change
    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPswd).then(() => {
      // Update successful.
      toastr.success('Password updated successfully', 'Updated', { positionClass: 'toast-bottom-left' })
    }).catch((error) => {
      if (error.code === "auth/weak-password") {
        toastr.warning('The new password is too weak.', 'Password Too Weak', { positionClass: "toast-bottom-left" })
      }
    });

  } catch (error: any) {
    if (error.code === "auth/wrong-password") {
      toastr.error('The current password is incorrect.', 'Incorrect Password', { positionClass: "toast-bottom-left" })
    }
    else if (error.code === "auth/requires-recent-login") {
      toastr.error('You need to log in again before updating your password.', 'Login Required', { positionClass: "toast-bottom-left" })
    }
    else {
      toastr.error('An error occurred. Please try again.', 'Error', { positionClass: "toast-bottom-left" })
    }
  }
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
    let confirmDeactivate = confirm('Are you sure you want to deactivate this user?')
    if (confirmDeactivate) {
      const userDocRef = doc(db, "staffMembers", uid!);

      updateDoc(userDocRef, {
        isActive: false,
        deactivationDate: serverTimestamp()
      })
        .then(() => {
          toastr.success('User has been deactivated', 'Deactivated', { positionClass: "toast-bottom-left" });
          router.navigate(['/admin-dashboard/users'])
        })
        .catch((error) => {
          console.error(error);
        });
    }
    else {
      toastr.info('Deactivation was canceled', 'Canceled', { positionClass: "toast-bottom-left" });
    }
  } catch (error) {
    console.error(error)
  }
}

export async function activateUser(uid: string | null, router: Router, toastr: ToastrService) {
  try {
    const userDocRef = doc(db, "staffMembers", uid!);

    updateDoc(userDocRef, { isActive: true })
      .then(() => {
        toastr.success('User has been reactivated', 'Activated', { positionClass: "toast-bottom-left" });
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

  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        try {
          const ref = doc(db, 'staffMembers', user.uid);
          const docSnap = await getDoc(ref);

          if (docSnap.exists()) {
            resolve(docSnap.data() as StaffInfo);
          } else {
            console.error("No document found for the current user.");
            resolve(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
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
      console.error(error);
    }
  } else {
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
    if (!email || !validateEmail(email)) {
      toastr.warning('Invalid email format. Please enter a valid email.', 'Error', { positionClass: "toast-bottom-left" });
      return false;
    }

    const usersCollection = collection(db, "staffMembers");
    const q = query(usersCollection, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return true;
    } else {
      toastr.error('This email does not exist. Please try again.', 'Error', { positionClass: "toast-bottom-left" });
      return false;
    }
  } catch (error: any) {
    if (error.code === "auth/invalid-email") {
      toastr.error('The email address is invalid. Please try again.', 'Error', { positionClass: "toast-bottom-left" });
    } else if (error.code === "auth/user-not-found") {
      toastr.error('No user found with this email address. Please try again.', 'Error', { positionClass: "toast-bottom-left" });
    } else {
      toastr.error('An unexpected error occurred. Please try again later', 'Error', { positionClass: "toast-bottom-left" });
    }
    return false;
  }
}


export async function deleteDeactivatedUsers(toastr: ToastrService) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const q = query(
    collection(db, "staffMembers"),
    where("isDeleted", "==", false),
    where("isActive", "==", false),
    where("deactivationDate", "<=", sixMonthsAgo)
  );

  const snapshot = await getDocs(q);
  snapshot.forEach(async (doc) => {
    await updateDoc(doc.ref, { isDeleted: true });
  });

  if (snapshot.size > 0) {
    toastr.info(`${snapshot.size} user(s) have been deleted automatically due to account expiration after deactivation.`, 'Announcement', { positionClass: "toast-bottom-left" })
  }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function signOutUser() {
  signOut(auth)
};
