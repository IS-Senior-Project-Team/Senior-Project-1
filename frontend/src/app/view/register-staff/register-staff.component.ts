import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RegisterStaffEmail } from '../../models/register-staff-email';

@Component({
  selector: 'app-register-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-staff.component.html',
  styleUrl: './register-staff.component.css'
})

export class RegisterStaffComponent {
  constructor(private authSvc: AuthService, private router:Router){
  }
  isAdmin = false;
  staffEmailForCreation: RegisterStaffEmail = {
    staffEmail : ''
  }
  errorMessage:string = '';

  create(registerForm: any) {
    if (registerForm.valid) {
      this.authSvc.CreateUser(this.staffEmailForCreation, this.isAdmin)

      registerForm = ""

    } else {
      this.errorMessage = 'Please fill out all fields correctly!';
    }
  }
  toggleLogin () {
    this.router.navigate(['login'])
  }

}
