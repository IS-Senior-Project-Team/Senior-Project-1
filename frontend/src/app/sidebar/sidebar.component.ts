import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgIf } from '@angular/common';
import { AccountProfileComponent } from '../accountProfile/account-profile.component';
import { StaffInfo } from '../models/staff-info';
// import { throws } from 'assert';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [NgIf],
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})

export class SidebarComponent {

  loggedInUser : boolean | null = null;
  
  currentRoute: string = '';
  constructor(private router: Router, private authSvc: AuthService) {
    this.authSvc = authSvc;
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects; // Update the current route
      }
    });
  }

  // Navigate to the specified route
  navigateTo(route: string) {
    this.router.navigate([route]);
  }
  
  logout () {
    // TODO: Add an event listener that checks if a user is logged in or not to display the button appropriately
    this.loggedInUser = this.authSvc.isLoggedIn() //Populating loggedInUser field to check if theres a logged in user
    this.authSvc.logoutUser();
  }
  // Check if a route is active
  isActive(route: string): boolean {
    return this.currentRoute === route;
  }
}