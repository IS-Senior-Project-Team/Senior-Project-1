import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})

export class SidebarComponent {

  currentRoute: string = '';
  constructor(private router: Router) {
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
  // Check if a route is active
  isActive(route: string): boolean {
    return this.currentRoute === route;
  }
}