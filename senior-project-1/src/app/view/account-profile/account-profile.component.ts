import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { StaffInfo } from '../../models/staff-info';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-profile.component.html',
  styleUrl: './account-profile.component.css'
})
export class AccountProfileComponent {
  staffProfile: StaffInfo | null = null;
  errorMessage: string = '';

  constructor(private authSvc: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.getUserProfile();
  }

  getUserProfile(): void {
    this.authSvc.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.staffProfile = profile;
      },
      error: (error) => {
        console.error('Error fetching user profile:', error);
        this.errorMessage = 'Failed to load profile. Please try again later.';
      }
    });
  }
  toggleCases() {
    this.router.navigate(['case-management'])
  }
}