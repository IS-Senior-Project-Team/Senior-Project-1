import { Component } from '@angular/core';
import { FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StaffInfo } from '../models/staff-info';
import { NgIf } from '@angular/common';
import { getUserProfile } from '../services/firebaseConnection';
import { RouterLink } from '@angular/router';
import { deactivateUser } from '../services/firebaseConnection';
import { activateUser } from '../services/firebaseConnection';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-profile-view',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './admin-profile-view.component.html',
  styleUrl: './admin-profile-view.component.css'
})
export class AdminProfileViewComponent {
  profileForm: FormGroup
  staffInfo: StaffInfo | null = null

  constructor(public route: ActivatedRoute, private fb: NonNullableFormBuilder, private router : Router, private toastr : ToastrService) {
    this.profileForm = this.fb.group({
      email: [''],
      firstname: [''],
      lastname: [''],
      phoneNumber: [''],
      address: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (uid) {
      try {
        const profile = await getUserProfile(uid); // Update to fetch by UID
        if (profile) {
          this.staffInfo = profile;
          this.profileForm.patchValue(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  }

  deactivateUser(uid : string | null) {
    deactivateUser(uid, this.router, this.toastr);
  }

  activateUser(uid : string | null) {
    activateUser(uid, this.router, this.toastr);
  }
}
