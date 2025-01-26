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

  email: string = '';
  password: string = '';
  errorMessage: string = '';


  loginUser() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }
    this.authSvc.loginUser(this.email, this.password)

    this.email = "";
    this.password = "";
  }
  
  toggleRegister() {
    this.router.navigate(['register'])
  }

  toggleForgotPassword() {
    this.router.navigate(['forgot-password'])
  }
}
