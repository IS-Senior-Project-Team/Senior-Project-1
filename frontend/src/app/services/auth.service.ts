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

  CreateUser(email: RegisterStaffEmail, isAdminRole: boolean): void {
    createUser(email.staffEmail, this.generateTempPassword(), isAdminRole, this.router, this.toastr, this.httpClient);
  }

  loginUser(email: string, password: string) {
    loginUser(email, password, this.router, this.toastr).then((userData) => {
      if (userData) {
        this.userLoggedIn.emit(userData); // Emit the user data when logged in for sidebar
      }
    });
  }

  userForgotPassword(email: string) {
    return forgotPassword(email, this.toastr)
  }

  //This is intended to generate temp password along with admin creating a new account using just the user email per firebase setup
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

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('loggedInUser');
  }

}
