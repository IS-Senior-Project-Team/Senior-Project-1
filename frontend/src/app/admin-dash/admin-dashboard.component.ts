import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { deleteDeactivatedUsers } from '../services/firebaseConnection';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

  constructor(private toastr: ToastrService) {}

  ngOnInit(): void {
    this.updateDeactivatedUsers();
  }
  updateDeactivatedUsers() {
    return deleteDeactivatedUsers(this.toastr);
  }
}
