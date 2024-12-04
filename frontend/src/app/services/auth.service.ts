import { Injectable, OnInit } from '@angular/core';
import { StaffInfo } from '../models/staff-info';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, from, map, mergeMap, Observable, throwError } from 'rxjs';
import { createUser, forgotPassword } from './firebaseConnection'
import { loginUser } from './firebaseConnection';
import { RegisterStaffEmail } from '../models/register-staff-email';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpClient: HttpClient, private router: Router) { }

  checkUserExists(email: string): Observable<any> {
    return this.httpClient.get<StaffInfo[]>(`http://localhost:3000/staffMembers?staff_email=${email}`).pipe(
      map(users => users.length > 0 ? users[0] : null)
    );
  }

  // CreateUser(staffData: StaffInfo): Observable<StaffInfo> {
  //   return this.checkUserExists(staffData.staff_email).pipe(
  //     mergeMap(userExists => {
  //       if (userExists) {
  //         return throwError(() => new Error('User already exists'));
  //       } else {

  //         return this.httpClient.get<StaffInfo[]>('http://localhost:3000/staffMembers').pipe(
  //           map(staffMembers => {
  //             const maxId = staffMembers.length > 0 ? Math.max(...staffMembers.map(s => s.id)) : 0;

  //             staffData.id = maxId + 1;
  //             return staffData;
  //           }),

  //           mergeMap(updatedStaffData => 
  //             this.httpClient.post<StaffInfo>('http://localhost:3000/staffMembers', updatedStaffData)
  //           )
  //         );
  //       }
  //     }),
  //     catchError(err => {
  //       console.error('Error creating user', err);
  //       return throwError(err);
  //     })
  //   );
  // }

  //This should only take in the email and then temp password is generated somewhere in between
  CreateUser(email: RegisterStaffEmail): void { //This is calling the create user function from firebase service 
    console.log("Temp Password from Auth Service:", this.generateTempPassword())
    return createUser(email.staffEmail, this.generateTempPassword());
  }

  loginUser(email: string, password: string) {
    console.log(email, "and", password)
    return loginUser(email, password)
  }

  userForgotPassword(email: string) {
    console.log("Password sucessfully reset")
    return forgotPassword(email)
  }

  //This is intended to generate temp password along with admin creating a new account using just the user email
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let tempPassword = '';
    for (let i = 0; i < 8; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return tempPassword;
  }

  logoutUser(): void {
    sessionStorage.removeItem('loggedInUser');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('loggedInUser');
  }

  //  loginUser ( username: string, password: string) : Observable<any> {
  //   return this.httpClient.get<StaffInfo[]>(`http://localhost:3000/staffMembers?staff_username=${username}&staff_password=${password}`).pipe(
  //     map(users => {
  //       if (users.length > 0) {
  //         sessionStorage.setItem('loggedInUser', JSON.stringify(users[0]));
  //         return true;
  //       } else {
  //         // No matching user found
  //         console.log("Invalid username or password")
  //         return false;
  //       }
  //     }),
  //     catchError(err => {
  //       console.error('Error logging in user:', err);
  //       return err;
  //     })
  //   );
  // }
    // checkCredentials() {
  //   if (!sessionStorage.getItem("loggedInUser")) {
  //     alert("Access restricted. Please login")
  //     this.router.navigate(['login'])
  //   }
  //   else if (sessionStorage.getItem('loggedInUser')) {
  //     alert('From Auth Service: Welcome User!')
  //   }
  // }



  // This is my logic for account creation
  // Admin go to create account
  //  They input staff member email and enter 
  //    A temp password is generated with that email
  //      An email is sent that allows staff to complete sign up (by changing password filling other info how (maybe mention in the email that they need to go
  //       to complete their profile?))
  //         Send a final email that verifies them


  //NEW CHANGES: 
  // How to get to login in page or complete sign up page (should only include personal and contact info) from email verification
  //      Maybe from the email verification confirm page (might just have to be localhost:... in action link-could test with loading cases page for starters
  //      ) it includes a link to complete sign up/login ======(DONE-substituted complete sign up page to Login)
  //
  // Since the temp password is not viewable by staff members, they can just click the forgot password link in the login page ========(DONE)
  // From there, they can also edit fill in their account information (Maybe include a message that tells them they should update their profile later?)

  //TODO:
  //  Complete forgot password function to update user password upon first login (DONE)
  //  Add created users to firestore as staff members (DONE)
  //  Fix email verifications status (DONE)
  //  Edit Account Profile



}
