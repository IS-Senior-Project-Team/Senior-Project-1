import { Injectable } from '@angular/core';
import { StaffInfo } from '../models/staff-info';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, mergeMap, Observable, throwError } from 'rxjs';

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

  CreateUser(staffData: StaffInfo): Observable<StaffInfo> {
    return this.checkUserExists(staffData.staff_email).pipe(
      mergeMap(userExists => {
        if (userExists) {
          return throwError(() => new Error('User already exists'));
        } else {

          return this.httpClient.get<StaffInfo[]>('http://localhost:3000/staffMembers').pipe(
            map(staffMembers => {
              const maxId = staffMembers.length > 0 ? Math.max(...staffMembers.map(s => s.id)) : 0;

              staffData.id = maxId + 1;
              return staffData;
            }),

            mergeMap(updatedStaffData => 
              this.httpClient.post<StaffInfo>('http://localhost:3000/staffMembers', updatedStaffData)
            )
          );
        }
      }),
      catchError(err => {
        console.error('Error creating user', err);
        return throwError(err);
      })
    );
  }

  loginUser ( username: string, password: string) : Observable<any> {
    
    return this.httpClient.get<StaffInfo[]>(`http://localhost:3000/staffMembers?staff_username=${username}&staff_password=${password}`).pipe(
      map(users => {
        if (users.length > 0) {
          sessionStorage.setItem('loggedInUser', JSON.stringify(users[0]));
          return true;
        } else {
          // No matching user found
          console.log("Invalid username or password")
          return false;
        }
      }),
      catchError(err => {
        console.error('Error logging in user:', err);
        return err;
      })
    );
  }

    logoutUser(): void {
      sessionStorage.removeItem('loggedInUser');
      this.router.navigate(['/login']);
    }
  
    isLoggedIn(): boolean {
      return !!sessionStorage.getItem('loggedInUser');
    }

  GetUserByEmail (staff: StaffInfo){
    return this.httpClient.get(`http://localhost:3000/staffMembers?staff_email=${staff.staff_email}`)
  }

  //Fix error with updating password
  resetPassword(email: string, newPassword: string): Observable<StaffInfo> {
    return this.checkUserExists(email).pipe(
      mergeMap(user => {
        if (user) {

          console.log('User found:', user);
        console.log('User ID:', user.id); 

          const userId = String(user.id);
          user.staff_password = newPassword;

          return this.httpClient.post<StaffInfo>(`http://localhost:3000/staffMembers/?${userId}`, user).pipe(
            map(updatedUser => updatedUser),
            catchError(err => {
              console.error('Error updating password:', err);
              return throwError(err);
            })
          );
        } else {
          throw new Error('User not found');
        }
      }),
      catchError(err => {
        console.error('Error resetting password:', err);
        return throwError(err);
      })
    );
  }

}
