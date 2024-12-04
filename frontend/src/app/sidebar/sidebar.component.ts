import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NgIf } from '@angular/common';
import { AccountProfileComponent } from '../accountProfile/account-profile.component';
import { StaffInfo } from '../models/staff-info';
// import { throws } from 'assert';

@Component({
  standalone: true,
  imports: [NgIf],
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})

export class SidebarComponent {

  loggedInUser : boolean | null = null;
  constructor(private router: Router, private authSvc: AuthService) {}
  
  // Navigate to the specified route
  navigateTo(route: string) {
    this.router.navigate([route]);
  }
  
  logout () {
    // TODO: Add an event listener that checks if a user is logged in or not to display the button appropriately
    this.loggedInUser = this.authSvc.isLoggedIn() //Populating loggedInUser field to check if theres a logged in user
    this.authSvc.logoutUser();
  }
}