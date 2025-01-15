import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  
  email ='';
  message ='';
  errorMessage = '';
  confirmPassword = '';
  newPassword = '';
  constructor(private authSvc: AuthService, private router: Router) {}

  forgotPassword() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email';
      return;
    }
    // TODO: Display error message if email is not entered. (Will transition from alert messages to snack bars )
    this.authSvc.userForgotPassword(this.email)
        this.message = 'Password has been reset successfully'; //Confirm if I still need this
        this.router.navigate(['/login']);
  }

  toggleLogin () {
    this.router.navigate(['login'])
  }

}
