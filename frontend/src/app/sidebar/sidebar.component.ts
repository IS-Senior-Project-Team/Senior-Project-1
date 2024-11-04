import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})

export class SidebarComponent {

  constructor(private router: Router) {}

  // Navigate to the specified route
  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}