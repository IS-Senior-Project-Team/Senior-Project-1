import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RegisterStaffEmail } from '../../models/register-staff-email';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-staff.component.html',
  styleUrl: './register-staff.component.css'
})

export class RegisterStaffComponent {
  creatingUser: boolean = false;
  constructor(private authSvc: AuthService, private router:Router, private toastr:ToastrService){
  }
  isAdmin = false;
  staffEmailForCreation: RegisterStaffEmail = {
    staffEmail : ''
  }
  errorMessage:string = '';

  async createAccount(registerForm: any) {
    this.creatingUser = true;
    try{
    if (registerForm.valid) {
      this.toastr.info("Please Wait", "User is being created...", { positionClass: 'toast-bottom-left',  progressBar: true, tapToDismiss: false })
      await this.authSvc.CreateUser(this.staffEmailForCreation, this.isAdmin)
      this.toastr.clear();
      registerForm = ""
    } else {
      this.errorMessage = 'Please fill out all fields correctly!';
    }
  } catch (err){
    console.error("Error:", err);
      this.toastr.error("Failed to create user", "Error");
  }
  finally {
    this.creatingUser = false;
  }
}
  toggleLogin () {
    this.router.navigate(['login'])
  }

}
