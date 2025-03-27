import { Component, OnInit } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog, MatDialogRef, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { changePassword, currentUserProfile, deleteAccount } from '../../services/firebaseConnection';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { StaffInfo } from '../../models/staff-info';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-delete-account-dialog',
  standalone: true,
  imports: [MatDialogModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent, MatFormFieldModule
    , FormsModule, ReactiveFormsModule, MatInputModule, MatCardModule, MatButtonModule, CommonModule],
  templateUrl: './delete-account-dialog.component.html',
  styleUrl: './delete-account-dialog.component.css'
})
export class DeleteAccountDialogComponent implements OnInit {

  showDeleteModal = false;
  isLoading = false;
  email = '';
  password = '';
  errorMessage = '';
  staffInfo: StaffInfo | null = null;
  emailInputFilled : boolean = false;

  constructor(public dialogRef: MatDialogRef<DeleteAccountDialogComponent>, private toastr: ToastrService, private router: Router, private authSvc: AuthService) { }

  async ngOnInit(): Promise<void> {
    this.staffInfo = await currentUserProfile()
  }

  closeDialog() {
    this.dialogRef.close();
  }

  deleteAccount() {
    if (!this.email || !this.password) {
      this.errorMessage = "Please enter your email and password.";
      return;
    }

    if (!this.staffInfo) {
      this.errorMessage = "No user is logged in.";
      this.isLoading = false;
      this.toastr.error("Unable to delete due to no user being logged in", "Error", { positionClass: "toast-bottom-left" })
      return;
    }

    try {
      deleteAccount(this.email, this.password, this.toastr, this.router, this.authSvc)
      this.toastr.success('Account deleted successfully', 'Success', {positionClass:'toast-bottom-left'}) 

    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      this.isLoading = false;
    }
  }
}
