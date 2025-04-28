import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { STATUSES, SPECIES } from '../constants';
import { Timestamp } from 'firebase/firestore';

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
    isDeleted: false,
    callDate: ''
  };

  statuses: string[] = STATUSES.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); // Sort alphabetically
  species: string[] = SPECIES.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); // Sort alphabetically

  loading = true;

  // Initialize originalCase to later store the original case values
  private originalCase!: Case;

  constructor (
    private router: Router, 
    private route: ActivatedRoute, 
    private casesService: CasesService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    try {
      // Retrieve the case ID from the route parameters
      this.route.params.subscribe(params => {
        this.case.id = params['id'];
        this.getCaseDetails(this.case.id);
      });
    }
    catch (error) {
      console.log("Error fetching case details.", error);
    }
    finally {
      this.loading = false;
    }
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

  formatName(event: Event, nameModel: NgModel) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^a-zA-Z]/g, ''); // Remove all non-letter characters
    let formattedValue = value;

    if (formattedValue != '') {
      formattedValue = formattedValue[0].toUpperCase() + formattedValue.substring(1);
    }

    input.value = formattedValue;

    // Manually update the model and revalidate
    nameModel.control.setValue(formattedValue);
    nameModel.control.updateValueAndValidity();
  }

  // Formats the value in the phone number input field
  formatPhoneNumber(event: Event, phoneModel: NgModel) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D+/g, ''); // Remove all non-numeric characters
  
    // Limit to 10 digits
    value = value.substring(0, 10);
  
    // Format as xxx-xxx-xxxx
    let formattedValue = '';
    if (value.length > 3) {
      formattedValue = value.slice(0, 3) + '-';
    }
    if (value.length > 6) {
      formattedValue += value.slice(3, 6) + '-';
      formattedValue += value.slice(6);
    } else {
      formattedValue += value.slice(3);
    }
  
    input.value = formattedValue; // Update the input field

    // Manually update the model and revalidate
    phoneModel.control.setValue(formattedValue);
    phoneModel.control.updateValueAndValidity();
  }

  cancel() {
    // User canceled
    this.toastr.info('Case edit canceled', 'Canceled');
    setTimeout(() => {
      this.router.navigate(['/case-management']);
    }, 100);
  }

  save(editCaseForm: NgForm) {

    if (editCaseForm.valid) {
        this.case.updateDate = Timestamp.fromDate(new Date()); // Generate the case's updated date when a case is added
        this.casesService.updateCase(this.case).subscribe({
            next: updatedCase => {
                console.log('Case updated successfully:', updatedCase);
                // Display success message
                this.toastr.success('Case updated successfully', 'Success');
                this.router.navigate(['/case-management']);
            },
            error: error => {
                console.error('Error saving case', error);
                // Handle case where edit was not successful
                this.toastr.error('Failed to update case', 'Error');
            }
        });
    } else {
        console.log('Form is invalid');
    }
  }

}