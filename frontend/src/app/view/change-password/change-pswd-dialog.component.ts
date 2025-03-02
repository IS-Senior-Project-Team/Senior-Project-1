import { Component } from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import { MatDialog,MatDialogRef,MatDialogActions,MatDialogClose,MatDialogTitle,MatDialogContent } from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import { changePassword } from '../../services/firebaseConnection';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-pswd-dialog',
  standalone: true,
  imports: [MatDialogModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent, MatFormFieldModule
          , FormsModule, ReactiveFormsModule, MatInputModule, MatCardModule, MatButtonModule, CommonModule],
  templateUrl: './change-pswd-dialog.component.html',
  styleUrl: './change-pswd-dialog.component.css'
})
export class ChangePswdDialogComponent {

  pswd : string = "";
  newPswd : string = "";
  confirmNewPswd : string = "";
  pswdInputFilled : boolean = false;
  errorMessage : string = "";
  passwordMismatch : boolean = false;

  constructor(public dialogRef: MatDialogRef<ChangePswdDialogComponent>, private toastr: ToastrService) {}

  closeDialog() {
    this.dialogRef.close();
  }

  changePassword(currentPassword : string, newPassword : string, confirmPassword: string) {
    if (this.newPswd !== this.confirmNewPswd) {
      this.passwordMismatch = true;
      this.errorMessage = "";
      return;
    } else {
      this.passwordMismatch = false;
    }

    changePassword(currentPassword, newPassword, this.toastr)
    this.clearFields()
  }
  clearFields() {
    this.pswd = "";
    this.newPswd = "";
    this.confirmNewPswd = "";
  }
}
