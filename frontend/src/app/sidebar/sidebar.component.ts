import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgIf, NgOptimizedImage } from '@angular/common';
import { StaffInfo } from '../models/staff-info';
import { currentUserProfile } from '../services/firebaseConnection';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  imports: [NgIf, NgOptimizedImage],
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})

export class SidebarComponent implements OnInit {

  loggedInUser: boolean | null = null;
  staffInfo: StaffInfo | null = null
  currentStaffInfo: Promise<StaffInfo | null> = currentUserProfile()
  private userSubscription: Subscription | null = null;

  currentRoute: string = '';
  constructor(private router: Router, private authSvc: AuthService) {
    this.authSvc = authSvc;
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects; // Update the current route
      }
    });
  }

  ngOnInit(): void {
    //Subscribe to user login event
    this.userSubscription = this.authSvc.userLoggedIn.subscribe((userInfo: StaffInfo) => {
      this.staffInfo = userInfo;
      console.log("Sidebar updated with user info:", userInfo);
    });

    //Load user info from session storage if already logged in
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser) {
      this.staffInfo = JSON.parse(loggedInUser);
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // Navigate to the specified route
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.authSvc.logoutUser();
    this.staffInfo = null;  // Clear user info after logout
    this.router.navigate(['/login']); // Redirect to login page
  }

  // Check if a route is active
  isActive(route: string): boolean {
    return this.currentRoute === route;
  }
}