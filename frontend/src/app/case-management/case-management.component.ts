import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import 'datatables.net';
import 'datatables.net-buttons';
import 'datatables.net-buttons-dt';
import DataTable from 'datatables.net-dt';
import { Router } from '@angular/router';
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

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

  private dtInstance: any | null = null;
  private dtInitialized = false; // Track the DataTable initialization state

  cases: Case[] = [];
  showDeleted: boolean = false; // Toggle to show/hide deleted cases

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

  ngOnDestroy(): void {

    const actionButtons = document.querySelectorAll('[data-action]');

    actionButtons.forEach(button => {
      button.removeEventListener('click', this.handleActionClick);
    });
    
    // Destroy DataTable instance if it exists
    if (this.dtInstance) {
      this.dtInstance.destroy();
      this.dtInstance = null;
    }
  }

  private handleActionClick = (event: Event) => {
    const target = event.currentTarget as HTMLElement;
    const action = target.getAttribute('data-action');
    
    if (!action || !this.dtInstance) return;

    switch (action) {
      case 'edit':
        const caseId = target.getAttribute('data-id');
        if (caseId) {
          this.editCase(caseId);
        } 
        break;

      case 'delete':
      case 'recover':
        const row = target.closest('tr');
        if (row) {
          const rowData = this.dtInstance.row(row).data();
          action === 'delete' ? this.deleteCase(rowData) : this.recoverCase(rowData);
        }
        break;
    }
  };
  
  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
  
  ngAfterViewChecked() {
    if (this.dataTable && !this.dtInitialized) {
      this.initDataTable();
    }
  }

  private bindTableEvents(): void {
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      const actionButton = target.closest('[data-action]');
      
      if (actionButton) {
        this.handleActionClick(new Event('click', { bubbles: true }));
      }
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
    if (!this.dataTable) {
      console.error('DataTable element not found.');
      return;
    }

    // Destroy existing instance if it exists
    if (this.dtInstance) {
      this.dtInstance.destroy();
    }

    // Create new DataTable instance
    this.dtInstance = new DataTable(this.dataTable.nativeElement, {
      data: this.displayedCases,
      columns: [
        { data: 'firstName' },
        { data: 'lastName' },
        { data: 'phoneNumber' },
        {
          data: 'notes',
          render: (data: string, type: string) => {
            // For display type, truncate the text if too long
            if (type === 'display' && data) {
              return data.length > 75
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
          render: (data: any, type: string, row: any) => this.renderActions(row)
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
    this.bindTableEvents();
  }

  private reInitDataTable(): void {
    if (!this.dtInstance) return;

    this.dtInstance
      .clear()
      .rows.add(this.displayedCases)
      .draw();
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