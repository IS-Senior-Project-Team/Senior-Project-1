import { Component, OnInit } from '@angular/core';
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CommonModule } from '@angular/common';
import { getCases, getContacts } from '../../../../backend/src/firebase/firebaseConnection';
import { DocumentData } from 'firebase/firestore';
import { FirebaseTestObj } from '../../../../backend/src/models/FirebaseTestObj'

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
  statuses: string[] = ['Open', 'In Progress', 'Closed']; 

  testDBArray: DocumentData[] = [];
  testDBObjects: FirebaseTestObj[] = [];

  constructor(private casesService: CasesService) {}

  ngOnInit(): void {
    //Load case data
    this.loadCases();
    this.testfunc()
  }

  async testfunc() {
    //Get all Contacts documents
    await getContacts().then(result => this.testDBArray?.push(result))
    this.testDBArray.forEach(elem => {
      //drill down to the objects and add each to the array
      elem['forEach']((element: FirebaseTestObj) => {
        console.log(element)
        this.testDBObjects.push(element)
      });
    })
  }

  //Fetch and load all case data
  loadCases(): void {
    this.casesService.getAll().subscribe((data: Case[]) => {
      this.cases = data;
    });
  }

  //Method for updating a case's status
  onStatusChange(selectedCase: Case, event: Event): void {
    const newStatus = (event.target as HTMLSelectElement).value;
    const confirmUpdate = window.confirm(`Are you sure you want to update the case status to "${newStatus}"?`);

    if (confirmUpdate) {
      selectedCase.status = newStatus;
      this.casesService.updateCase(selectedCase).subscribe(updatedCase => {
        console.log('Case status updated:', updatedCase);
      });
    } else {
      // Reset the select value to the previous status if the user cancels the update
      (event.target as HTMLSelectElement).value = selectedCase.status;
    }
  }
}
