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

  //This should only take in the email and then temp password is generated somewhere in between
  CreateUser(email: RegisterStaffEmail, isAdminRole : boolean): void { //This is calling the create user function from firebase service 
    return createUser(email.staffEmail, this.generateTempPassword(), isAdminRole);
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

  navigateTo (path: string) {
    this.router.navigate([path])
  }

  logoutUser(): void {
    sessionStorage.removeItem('loggedInUser');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('loggedInUser');
  }


  // This is my intended logic for account creation
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
  // (DONE) Edit Account Profile (Maybe do it by making the fields in account profile editable and then have a save button OR make the fields unlocked and then a save&cancel button)
  // (DONE) Develop admin dashboard and implement manage users to direct to lists of user and a create account button/redirect to register 
  // (DONE) Deactivate/ Delete Accounts functionality for specific user accounts/profiles (will have to get the selected user instead of logged in user to view their profile 
  //                                                                 OR include the buttons on the accounts list and include a search button to search for staff) 
  // (DONE) Add admin account using a checkbox and check firebase options
  // (DONE) Add guards for respective pages to only be acessible by admin
  // Handle redirect after login as admin/staff
  // Incude the users tab on sidebar for admins
  // (DONE) Include create account button from the admin users list page and to be only accessible by admin
  // Fix input validations, error messages, and alerts
  // Upload History (Last to be implemented) 
  // Include search & filters for staff based USER LISTS

}
