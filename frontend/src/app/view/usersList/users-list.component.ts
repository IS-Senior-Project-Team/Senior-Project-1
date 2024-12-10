import { Component, OnInit } from '@angular/core';
import { fetchAllUsers } from '../../services/firebaseConnection';
import { StaffInfo } from '../../models/staff-info';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UserListComponent implements OnInit {
  users: StaffInfo[] = [];
  loading = true;

  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    try {
      this.users = await fetchAllUsers();
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      this.loading = false;
    }
  }

  viewProfile(uid: string): void {
    this.router.navigate(['/profile', uid]);
  }
}
