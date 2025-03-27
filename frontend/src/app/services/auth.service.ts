import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { StaffInfo } from '../models/staff-info';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, from, map, mergeMap, Observable, throwError } from 'rxjs';
import { createUser, forgotPassword, updateUser, signOutUser } from './firebaseConnection'
import { loginUser } from './firebaseConnection';
import { RegisterStaffEmail } from '../models/register-staff-email';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  userLoggedIn: EventEmitter <Partial<StaffInfo>> = new EventEmitter<Partial<StaffInfo>>();
  constructor(private httpClient: HttpClient, private router: Router, private toastr: ToastrService) { }

  //This should only take in the email and then temp password is generated somewhere in between
  CreateUser(email: RegisterStaffEmail, isAdminRole: boolean): void { //This is calling the create user function from firebase service 
    createUser(email.staffEmail, this.generateTempPassword(), isAdminRole, this.router, this.toastr);
  }

  loginUser(email: string, password: string) {
    loginUser(email, password, this.router, this.toastr).then((userData) => {
      if (userData) {
        this.userLoggedIn.emit(userData); // Emit the user data when logged in
      }
    });
  }

  userForgotPassword(email: string) {
    return forgotPassword(email, this.toastr)
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

  navigateTo(path: string) {
    this.router.navigate([path])
  }

  logoutUser(): void {
    signOutUser().then(()=>{
      sessionStorage.removeItem('loggedInUser');
      this.router.navigate(['/login']);
    })
  }

  logoutUserAfterDeletion(): void {
    signOutUser().then(()=>{
      sessionStorage.removeItem('loggedInUser');
      window.location.href = '/login'
    })
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('loggedInUser');
  }

  updateUser(userData: StaffInfo): Observable<void> {

    return from(updateUser(userData));
  }

}
