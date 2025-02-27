import { EventEmitter, Injectable, OnInit } from '@angular/core';
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
  userLoggedIn: EventEmitter<StaffInfo> = new EventEmitter<StaffInfo>();
  constructor(private httpClient: HttpClient, private router: Router) { }

  //This should only take in the email and then temp password is generated somewhere in between
  CreateUser(email: RegisterStaffEmail, isAdminRole : boolean): void { //This is calling the create user function from firebase service 
    return createUser(email.staffEmail, this.generateTempPassword(), isAdminRole, this.router);
  }

  // loginUser(email: string, password: string) {
  //   console.log(email, "and", password)
  //   return loginUser(email, password, this.router)
  // }
  loginUser(email: string, password: string) {
    loginUser(email, password, this.router).then((userData) => {
      if (userData) {
        this.userLoggedIn.emit(userData); // Emit the user data when logged in
      }
    });
  }

  userForgotPassword(email: string) {
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

  //TODO:
  // (DONE) Edit Account Profile (Maybe do it by making the fields in account profile editable and then have a save button OR make the fields unlocked and then a save&cancel button)
  // (DONE) Develop admin dashboard and implement manage users to direct to lists of user and a create account button/redirect to register 
  //                                                                 OR include the buttons on the accounts list and include a search button to search for staff) 
  // (DONE) Add admin account using a checkbox and check firebase options
  // (DONE) Add guards for respective pages to only be acessible by admin
  // (DONE) Handle redirect after login as admin/staff
  // (DONE) Include create account button from the admin users list page and to be only accessible by admin
  
  // Deactivate/ Delete Accounts functionality for specific user accounts/profiles (will have to get the selected user instead of logged in user to view their profile 
  // Incude the users tab on sidebar for admins
  // Fix input validations, error messages, and alerts
  // Include search & filters for staff based USER LISTS
  // Upload History (Last to be implemented) 

}
