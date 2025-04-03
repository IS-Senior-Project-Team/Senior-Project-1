import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { currentUserProfile, updateUser } from '../services/firebaseConnection';
import { Observable } from 'rxjs';
import { StaffInfo } from '../models/staff-info';
import { FormControl, NonNullableFormBuilder } from '@angular/forms';
import { ChangePswdDialogComponent } from '../view/change-password/change-pswd-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [FormsModule, NgIf, ReactiveFormsModule],
  templateUrl: './account-profile.component.html',
  styleUrl: './account-profile.component.css'
})

export class AccountProfileComponent implements OnInit {
  currentUserProfile$: Promise<StaffInfo | null> = currentUserProfile(); // Observable for user profile data
  staffInfo: StaffInfo | null = null
  staffName: string = ''
  isEditing: boolean = false; // Track if the form is in edit mode
  profileForm: FormGroup
  loading = true;

  constructor(private router: Router, private authSvc: AuthService, private fb: NonNullableFormBuilder, private dialog: MatDialog, private toastr: ToastrService) {
    this.profileForm = this.fb.group({
      email: [''],
      firstname: [''],
      lastname: [''],
      phoneNumber: [''],
      address: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      const profile = await currentUserProfile();
      if (profile) {
        this.staffInfo = profile;
        this.profileForm.patchValue(profile);
      } else {
        console.error('No profile found for the current user.');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      this.loading = false;
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (!this.isEditing) {
      // If exiting edit mode, reset the form to the original values
      this.profileForm.patchValue(this.staffInfo!);
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.valid) {
      const updatedUser = { ...this.staffInfo, ...this.profileForm.value } as StaffInfo;

      try {
        await updateUser(updatedUser).toPromise(); // Update Firestore with the new values
        this.staffInfo = updatedUser; // Update the local data
        this.isEditing = false; // Exit edit mode
        this.toastr.success('Profile updated successfully!', 'Updated', { positionClass: "toast-bottom-left" });
      } catch (error) {
        console.error('Error updating profile:', error);
        this.toastr.error('Failed to update profile. Please try again later.', 'Error', { positionClass: "toast-bottom-left" });
      }
    } else {
      this.toastr.warning('Please fill out all required fields before saving.', 'Fill out required fields', { positionClass: "toast-bottom-left" });
    }
  }

  changePassword(): void {
    this.dialog.open(ChangePswdDialogComponent, {
      width: '500px',
    });
  }
}