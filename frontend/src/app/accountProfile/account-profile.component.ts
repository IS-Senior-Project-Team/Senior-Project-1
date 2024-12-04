import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [],
  templateUrl: './account-profile.component.html',
  styleUrl: './account-profile.component.css'
})
export class AccountProfileComponent {
  
  loggedInUser : boolean | null = null;
  constructor(private router: Router, private authSvc: AuthService) {}
  userProfile = {
    name: 'Pat Ink',
    email: 'patink23@gmail.com',
    phone: '1234567890',
    firstName: 'Pat',
    lastName: 'Ink',
    address: '123 W Street, Jacksonville, Florida, 12345'
  };

  logout () {
    // TODO: Add an event listener that checks if a user is logged in or not to display the button appropriately
    this.loggedInUser = this.authSvc.isLoggedIn() //Populating loggedInUser field to check if theres a logged in user
    this.authSvc.logoutUser();
  }

}
