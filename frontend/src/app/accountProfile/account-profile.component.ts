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

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [FormsModule, NgIf, ReactiveFormsModule],
  templateUrl: './account-profile.component.html',
  styleUrl: './account-profile.component.css'
})
export class AccountProfileComponent implements OnInit {
  loggedInUser: boolean | null = null;
  currentUserProfile$: Promise<StaffInfo | null> = currentUserProfile(); // Observable for user profile data
  staffInfo: StaffInfo | null = null
  staffName : string = ''
  isEditing: boolean = false; // Track if the form is in edit mode
  profileForm : FormGroup
  loading = true;

  constructor(private router: Router, private authSvc: AuthService, private fb: NonNullableFormBuilder) {
    this.profileForm = this.fb.group({
      email: [''],
      firstname: [''],
      lastname: [''],
      phoneNumber: [''],
      address: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const profile = await currentUserProfile();
      if (profile) {
        this.staffInfo = profile;
        console.log(profile)
        this.profileForm.patchValue(profile); // Populate form with user data
        console.log(this.profileForm.value)
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
        alert('Profile updated successfully!');
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again later.');
      }
    } else {
      alert('Please fill out all required fields before saving.');
    }
  }

  changePassword() {

  }

  //Not being used since logout button is added on sidebar
  logout(): void {
    this.loggedInUser = null; // Set to null on logout
    this.staffInfo = null;
    this.authSvc.logoutUser();
    this.router.navigate(['/login']); // Redirect to login page
  }
}