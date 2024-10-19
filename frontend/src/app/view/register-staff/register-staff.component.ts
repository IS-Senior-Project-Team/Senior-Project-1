import { Component, NgModule } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { StaffInfo } from '../../models/staff-info';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-register-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-staff.component.html',
  styleUrl: './register-staff.component.css'
})
export class RegisterStaffComponent {
  constructor(private authSvc: AuthService, private router:Router){
  }
  staffData: StaffInfo = {
    id: 0,
    staff_firstname: '',
    staff_lastname: '',
    staff_email: '',
    staff_username: '',
    staff_password: '',
    staff_address: '',
    staff_phone: 0
  }
  errorMessage:string = '';

  CreateNewUser(registerForm: any) {
    if (registerForm.valid) {
      this.authSvc.CreateUser(this.staffData).subscribe({
        next: () => {
          alert('User created!');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          alert("You have an existing account")
          this.errorMessage = err.message === 'User already exists' 
            ? 'You have an existing account!' 
            : 'User creation failed!';
        }
      });
    } else {
      this.errorMessage = 'Please fill out all fields correctly!';
    }
  }
  toggleLogin () {
    this.router.navigate(['login'])
  }

}
