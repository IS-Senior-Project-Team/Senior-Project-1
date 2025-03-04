import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { STATUSES, SPECIES } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

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
    status: 'Open',
    numOfPets: 1,
    species: '',
    isDeleted: false,
    createdDate: undefined,
  };

  statuses: string[] = STATUSES;

  species: string[] = SPECIES;

  constructor (private router: Router, 
    private route: ActivatedRoute, 
    private casesService: CasesService, 
    private toastr: ToastrService,
  ) {}

  cancel() {
    // User canceled
    this.toastr.info('Add case was canceled', 'Canceled');
    setTimeout(() => {
      this.router.navigate(['/case-management']);
    }, 100);
  }

  async save(addCaseForm: NgForm) {
    
    if (addCaseForm.valid) {
      try {
        this.case.id = uuidv4(); // Generate unique id using the UUID library
        this.case.createdDate = Timestamp.fromDate(new Date()); // Generate the case's created date when a case is added
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
  }
}