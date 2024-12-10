import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { STATUSES, SPECIES } from '../constants';

@Component({
  selector: 'app-edit-case',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-case.component.html',
  styleUrl: './edit-case.component.css'
})
export class EditCaseComponent implements OnInit {
  
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

  statuses: string[] = STATUSES;

  species: string[] = SPECIES;

  // Initialize originalCase to later store the original case values
  private originalCase!: Case;

  constructor (
    private router: Router, 
    private route: ActivatedRoute, 
    private casesService: CasesService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    // Retrieve the case ID from the route parameters
    this.route.params.subscribe(params => {
      this.case.id = params['id'];
      this.getCaseDetails(this.case.id);
    });
  }

  getCaseDetails(id: string): void {
    this.casesService.getOne(id).subscribe(caseData => {
      if (caseData) {
        this.case = caseData;
        // Clone original case for comparison if user cancels the edit
        this.originalCase = { ...this.case };
      } else {
        console.error('Case not found');
      }
    });
  }

  // Custom validator to check if the value is a number
  isNumber(value: any): boolean {
    return !isNaN(value) && Number.isFinite(value);
  }

  cancel() {
    // User canceled
    this.toastr.info('Case edit canceled', 'Canceled');
    setTimeout(() => {
      this.router.navigate(['/case-management']);
    }, 100);
  }

  save(editCaseForm: NgForm) {
    const confirmUpdate = window.confirm(`Are you sure you want to update and apply changes to Case #${this.case.id}?`);

    if (confirmUpdate) {
        if (editCaseForm.valid) {
            this.casesService.updateCase(this.case).subscribe({
                next: updatedCase => {
                    console.log('Case updated successfully:', updatedCase);
                    // Display success message
                    this.toastr.success('Case edited successfully', 'Success');
                    this.router.navigate(['/case-management']);
                },
                error: error => {
                    console.error('Error saving case', error);
                    // Handle case where edit was not successful
                    this.toastr.error('Failed to edit case', 'Error');
                }
            });
        } else {
            console.log('Form is invalid');
        }
    } else {
        console.log('Update canceled by the user. Reverting to previous values.');

        // User canceled
        this.toastr.info('Case edit canceled', 'Canceled');

        // Restore original values
        this.case = { ...this.originalCase };
    }
  }

}