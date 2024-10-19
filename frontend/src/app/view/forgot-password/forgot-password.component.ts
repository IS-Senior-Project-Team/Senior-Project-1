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
    if (!this.email || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill out all fields';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
    this.authSvc.resetPassword(this.email, this.newPassword).subscribe({
      next: () => {
        this.message = 'Password has been reset successfully';
        this.errorMessage = '';
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error during password reset process:', err);
        this.errorMessage = 'Error resetting password. Please check the email entered.';
      }
    });
  }


}
