import { Component, OnInit } from '@angular/core';
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CommonModule } from '@angular/common';

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

  constructor(private casesService: CasesService) {}

  ngOnInit(): void {
    //Load case data
    this.loadCases();
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
