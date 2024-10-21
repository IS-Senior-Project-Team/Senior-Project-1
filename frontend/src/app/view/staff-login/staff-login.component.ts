import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './staff-login.component.html',
  styleUrl: './staff-login.component.css'
})
export class StaffLoginComponent {

  constructor (private router : Router, private authSvc : AuthService) {}

  username: string = '';
  password: string = '';
  errorMessage: string = '';


  loginUser() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }
    this.authSvc.loginUser(this.username, this.password).subscribe({
      next: (isLoggedIn) => {
        if (isLoggedIn) {
          this.router.navigate(['case-management']);
        } else {
          alert('Invalid username or password')
          this.errorMessage = 'Invalid username or password';
          this.username = '';
          this.password = '';
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage = 'An error occurred during login';
      }
    });
  }
  
  toggleRegister() {
    this.router.navigate(['register'])
  }

  toggleForgotPassword() {
    this.router.navigate(['forgot-password'])
  }
}
