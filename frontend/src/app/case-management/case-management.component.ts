import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-buttons';
import 'datatables.net-buttons-dt';
import { Router } from '@angular/router';
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { getCases, getContacts } from '../services/firebaseConnection';
import { DocumentData } from 'firebase/firestore';
import { FirebaseContact } from '../../../../backend/src/models/FirebaseTestObj'
import { Config } from 'datatables.net'
import { Subject } from 'rxjs';

@Component({
  selector: 'app-case-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './case-management.component.html',
  styleUrl: './case-management.component.css',
  providers: [CasesService]
})
export class CaseManagementComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('dataTable', { static: false }) dataTable!: ElementRef;

  cases: Case[] = [];
  showDeleted: boolean = false; // Toggle to show/hide deleted cases
  private dtInitialized = false; // Track the DataTable initialization state

  constructor (
    private router: Router, 
    private casesService: CasesService, 
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    //Load case data
    this.loadCases();
    this.bindTableEvents();
  }

  ngOnDestroy() {
    $('body').off('click', '[data-action="edit"]');
    $('body').off('click', '[data-action="delete"]');
    $('body').off('click', '[data-action="recover"]');
  }
  
  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
  
  ngAfterViewChecked() {
    if (this.dataTable && !this.dtInitialized) {
      this.initDataTable();
    }
  }

  private bindTableEvents(): void {
    $('body').on('click', '[data-action="edit"]', (event) => {
      const caseId = $(event.currentTarget).data('id');
      this.editCase(caseId);
    });

    $('body').on('click', '[data-action="delete"]', (event) => {
      const row = $(event.currentTarget).closest('tr');
      const rowData = $(this.dataTable.nativeElement)
        .DataTable()
        .row(row)
        .data();
      this.deleteCase(rowData);
    });

    $('body').on('click', '[data-action="recover"]', (event) => {
      const row = $(event.currentTarget).closest('tr');
      const rowData = $(this.dataTable.nativeElement)
        .DataTable()
        .row(row)
        .data();
      this.recoverCase(rowData);
    });
  }

  private renderActions(caseItem: Case): string {
    if (caseItem.isDeleted) {
      return `
        <button class="btn btn-link" data-action="recover" data-id="${caseItem.id}">
          <img src="undo.png" alt="Recover" style="width: 25px; height: 25px;">
        </button>`;
    } else {
      return `
        <button class="btn btn-link" data-action="edit" data-id="${caseItem.id}">
          <img src="edit-icon.png" alt="Edit" style="width: 25px; height: 25px;">
        </button>
        <button class="btn btn-link" data-action="delete" data-id="${caseItem.id}">
          <img src="red-trashcan-icon.png" alt="Delete" style="width: 25px; height: 25px;">
        </button>`;
    }
  }

  private initDataTable(): void {
    if (this.dataTable) {
      $(this.dataTable.nativeElement).DataTable().destroy(); // Destroy existing instance
      $(this.dataTable.nativeElement).DataTable({
        data: this.displayedCases,
        columns: [
          { data: 'firstName' },
          { data: 'lastName' },
          { data: 'phoneNumber' },
          { 
            data: 'notes',
            render: function(data, type, row) {
              // For display type, truncate the text if too long
              if (type === 'display') {
                return data && data.length > 75 
                  ? `<span title="${data}">${data.substring(0, 75)}...</span>` 
                  : data;
              }
              // For sorting, filtering, and other types, return full data
              return data;
            }
          },
          { data: 'status' },
          { data: 'numOfPets' },
          { data: 'species' },
          {
            data: null,
            orderable: false,
            searchable: false,
            render: (data: any, type: any, row: any) => this.renderActions(row)
          }
        ],
        pageLength: 5,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        language: {
          lengthMenu: "Display _MENU_ records per page",
          zeroRecords: "Nothing Found",
          info: "Showing page _PAGE_ of _PAGES_",
          infoEmpty: "No records available",
          infoFiltered: "(filtered from _MAX_ total records)"
        },
        layout: {
          topStart: 'pageLength',
          topEnd: {
            search: {
              placeholder: 'Search'
            }
          }
        }
      });
      this.dtInitialized = true;
    } else {
      console.error('DataTable element not found.');
    }
  }

  private reInitDataTable(): void {
    if (this.dataTable) {
      const dataTableInstance = $(this.dataTable.nativeElement).DataTable();
      dataTableInstance.clear();
      dataTableInstance.rows.add(this.displayedCases);
      dataTableInstance.draw();
    }
  }
  
  //Fetch and load all case data
  loadCases(): void {
    this.casesService.getAll().then((data: Case[]) => {
      this.cases = data;
      this.reInitDataTable(); // Reinitialize the DataTable after data is loaded
    });
  }

  // Method to toggle the showDeleted 
  toggleShowDeleted() {
    this.showDeleted = !this.showDeleted;
    this.reInitDataTable(); // Reinitialize the DataTable when toggling the view
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
      this.casesService.updateCase(caseItem).subscribe(() => {
        this.reInitDataTable(); // Reinitialize the DataTable after deleting a case
      });

      // Display success message
      this.toastr.success('Case deleted successfully', 'Success');
    } else {
      // User canceled
      this.toastr.info('Delete case canceled', 'Canceled');
    }
  }

  // Method to recover a deleted case
  recoverCase(caseItem: Case) {
    const confirmRecover = window.confirm(`Are you sure you want to RECOVER Case #${caseItem.id}?`);

    if (confirmRecover) {
      // set the case's deleted flag to true
      caseItem.isDeleted = false;

      // Display success message
      this.toastr.success('Case recovered successfully', 'Success');

      // Delay the case update and page reload
      setTimeout(() => {
        this.casesService.updateCase(caseItem).subscribe(() => {
          if (!this.hasDeletedCases()) {
            this.showDeleted = false;
          }
          this.reInitDataTable(); // Reinitialize the DataTable after recovering a case
          window.location.reload();  // Reload the page 
        });
      }, 1000);  // 1-second delay before executing the update
    } else {
      // User canceled
      this.toastr.info('Recover case canceled', 'Canceled');
    }
  }

  // Method to navigate to the edit case component/page
  editCase(caseId: string): void {
    this.router.navigate(['/edit-case', caseId]);
  }

  // Method to navigate to the add case page
  addCase(): void {
    this.router.navigate(['/add-case']);
  }

  // Filter cases based on the deleted flag
  get displayedCases() {
    // Return deleted cases if showDeleted is active or "true"
    // Return regular cases if showDeleted is not active or "false"
    const filteredCases = this.showDeleted ? this.cases.filter(item => item.isDeleted) : this.cases.filter(item => !item.isDeleted);
    return filteredCases;
  }

  // Get the amount/count of deleted cases
  get deletedCasesCount() {
    return this.cases.filter(item => item.isDeleted).length;
  }

}