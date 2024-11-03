import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CommonModule } from '@angular/common';
//import { getCases, getContacts } from '../../../../backend/src/firebase/firebaseConnection';
//import { DocumentData } from 'firebase/firestore';
//import { FirebaseContact } from '../../../../backend/src/models/FirebaseTestObj'

@Component({
  selector: 'app-case-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './case-management.component.html',
  styleUrl: './case-management.component.css',
  providers: [CasesService]
})
export class CaseManagementComponent implements OnInit {

  cases: Case[] = [];
  showDeleted: boolean = false; // Toggle to show/hide deleted cases
  showDeletedMessage = false; // Control visibility of the delete button message

  /*
  testDBArray: DocumentData[] = [];
  testDBObjects: FirebaseContact[] = [];
  */

  constructor(private router: Router, private casesService: CasesService) {}

  ngOnInit(): void {
    //Load case data
    this.loadCases();
    //this.gotFirebaseContacts()
  }

  /*
  // Test method for Firebase implementation
  async gotFirebaseContacts() {
    //Get all Contacts documents
    await getContacts().then(result => this.testDBArray?.push(result))
    this.testDBArray.forEach(elem => {
      //drill down to the objects and add each to the array
      elem['forEach']((element: FirebaseContact) => {
        // console.log(element)
        this.testDBObjects.push(element)
      });
    })
  }
  */

  //Fetch and load all case data
  loadCases(): void {
    this.casesService.getAll().subscribe((data: Case[]) => {
      this.cases = data;
    });
  }

  toggleReadMore(item: Case) {
    item.isExpanded = !item.isExpanded; // Toggle the expanded state for the specific item
  }

  // Method to toggle the showDeleted 
  toggleShowDeleted() {
    this.showDeleted = !this.showDeleted;
  }

  // Method to toggle the deleted cases message
  toggleDeletedMessage() {
    if (this.showDeletedMessage == true) {
      this.showDeletedMessage = false;
    } else {
      this.showDeletedMessage = true;
    }
  }

  // Check if there are any deleted cases
  hasDeletedCases(): boolean {
    return this.cases.some(item => item.isDeleted);
  }

  // Method to delete a case:
    // The method does not currently delete them from the database because
    // this functionality will be needed to temporarily store the deleted cases
    // for recovery later if needed 
  deleteCase(caseItem: Case) {
    const confirmDelete = window.confirm(`Are you sure you want to DELETE Case #${caseItem.id}?`);

    if (confirmDelete) {
      // set the case's deleted flag to true
      caseItem.isDeleted = true;
      this.casesService.updateCase(caseItem).subscribe();
    } else {
      console.log('Delete case canceled.')
    }
  }

  // Method to recover a deleted case
  recoverCase(caseItem: Case) {
    const confirmRecover = window.confirm(`Are you sure you want to RECOVER Case #${caseItem.id}?`);

    if (confirmRecover) {
      // set the case's deleted flag to true
      caseItem.isDeleted = false;
      this.casesService.updateCase(caseItem).subscribe();

      // Check if all deleted cases have been recovered
      if (!this.hasDeletedCases()) {
        this.showDeleted = false; // Reset the showDeleted flag
      }
    } else {
      console.log('Recover case canceled')
    }
  }

  // Method to navigate to the edit case component/page
  editCase(caseId: string): void {
    this.router.navigate(['/edit-case', caseId]);
  }

  // Filter cases based on the deleted flag
  get displayedCases() {
    // Return deleted cases if showDeleted is active or "true"
    // Return regular cases if showDeleted is not active or "false"
    return this.showDeleted ? this.cases.filter(item => item.isDeleted) : this.cases.filter(item => !item.isDeleted);
  }

  // Get the amount/count of deleted cases
  get deletedCasesCount() {
    return this.cases.filter(item => item.isDeleted).length;
  }
}
