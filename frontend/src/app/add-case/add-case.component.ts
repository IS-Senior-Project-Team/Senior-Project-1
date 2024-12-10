import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-add-case',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-case.component.html',
  styleUrl: './add-case.component.css',
  providers: [CasesService]
})
export class AddCaseComponent {

  case: Case = {
    id: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    notes: '',
    status: '',
    numOfPets: 0,
    species: '',
    isDeleted: false
  };

  statuses: string[] = [
    "Already Rehomed",
    "Asked for more info",
    "Bad # or No VM",
    "Duplicate",
    "Found Pet",
    "Keeping-Behavior",
    "Keeping- Medical",
    "Keeping- Other",
    "Kitten Pack & S/N",
    "LM with Info",
    "Lost Pet",
    "No Show Appt",
    "Not PSN",
    "Open",
    "Owner Surrender Intake",
    "PSN Boarding",
    "Rehome Attempt",
    "Rehome Confirmed",
    "Reunited",
    "Surrender Appt",
    "Surrender Denied",
    "Walk-in Surrender Attempt",
    "Walk-in- Stray Attempt",
    "Walk-In- OS Intake",
    "Walk-in- Stray Intake",
    "Walk-in- Other",
    "Call elevated to management",
    "ACPS"
  ];

  species: string[] = [
    "Adult Dog",
    "Adult Cat",
    "Puppy",
    "Kitten"
  ]

  constructor (private router: Router, 
    private route: ActivatedRoute, 
    private casesService: CasesService, 
    private toastr: ToastrService,
  ) {}

  cancel() {
    // User canceled
    this.toastr.info('Case addition canceled', 'Canceled');
    setTimeout(() => {
      this.router.navigate(['/case-management']);
    }, 100);
  }

  async save(addCaseForm: NgForm) {
    const confirmUpdate = window.confirm(`Are you sure you want to add this new case?`);

    if (confirmUpdate) {
        if (addCaseForm.valid) {
          try {
            this.case.id = new Date().getTime().toString();
            const success = await this.casesService.createCase(this.case);
            
            if (success) {
              // Display success message
              this.toastr.success('Case added successfully', 'Success');
              
              // Reset form and navigate back to case management page
              addCaseForm.reset();
              this.router.navigate(['/case-management']);
            } else {
              // Handle case where creation was not successful
              this.toastr.error('Failed to add case', 'Error');
            }
          } catch (error) {
            // Catch any unexpected errors
            console.error('Error adding case:', error);
            this.toastr.error('An unexpected error occurred', 'Error');
          }
        }
    } else {
      // User canceled
      this.toastr.info('Case addition canceled', 'Canceled');
    }
  }
}