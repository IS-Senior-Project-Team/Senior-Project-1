import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-email-confirm',
  standalone: true,
  imports: [],
  templateUrl: './email-confirm.component.html',
  styleUrl: './email-confirm.component.css'
})
export class EmailConfirmComponent {

  constructor (private router: Router) {}

  toggleLogin() {
    this.router.navigate(['login'])
  }

}
