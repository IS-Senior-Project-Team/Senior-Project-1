import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import 'datatables.net';
import 'datatables.net-buttons';
import 'datatables.net-buttons-dt';
import DataTable from 'datatables.net-dt';
import { Router } from '@angular/router';
import { Case } from '../models/case';
import { StaffInfo } from '../models/staff-info';
import { CasesService } from '../services/cases.service';
import { permDeleteCase } from '../services/firebaseConnection';
import { Timestamp } from 'firebase/firestore';
import { ToastrService } from 'ngx-toastr';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-case-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],  
  templateUrl: './case-management.component.html',
  styleUrl: './case-management.component.css',
  providers: [CasesService]
})
export class CaseManagementComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('dataTable', { static: false }) dataTable!: ElementRef;
  @ViewChild('customSearch') searchInput!: ElementRef;

  private dtInstance: any | null = null;
  private dtInitialized = false; // Track the DataTable initialization state

  staffInfo: StaffInfo | null = null
  cases: Case[] = [];
  showDeleted: boolean = false; // Toggle to show/hide deleted cases
  loading = true;

  // Default values for Created Date Range (last 7 days)
  startDate: Date | undefined = new Date(new Date().setDate(new Date().getDate() - 7)); // 7 days ago
  endDate: Date | undefined = new Date(); // Today

  // Updated Date Range (no default values)
  updatedStartDate: Date | undefined = undefined;
  updatedEndDate: Date | undefined = undefined;

  searchInputValue: string = '';

  constructor (
    private router: Router, 
    private casesService: CasesService, 
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    try {
      // Load initial case data
      this.loadInitialData();
      this.bindTableEvents();

      // Check for user
      const userProfile = sessionStorage.getItem('loggedInUser');
      if (userProfile) {
        this.staffInfo = JSON.parse(userProfile);
      }
      else {
        console.error("No profile found for user.")
      }
    }
    catch (error) {
      console.error("Error fetching user profile.", error);
    }
    finally {
      this.loading = false;
    }
  }
  
  // Fetch and load case data from the past week
  // startDate and endDate are initialized already
  private loadInitialData() {
    this.getFilteredCases(false);
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

  ngAfterViewInit() {
    this.cdr.detectChanges();
    if (this.dataTable && !this.dtInitialized) {
      this.initDataTable();
    }
  }
  
  ngAfterViewChecked() {
    if (this.dataTable && !this.dtInitialized) {
      this.initDataTable();
    }
  }

  private handleActionClick = (event: Event) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const actionButton = target.closest('[data-action]');

    if (!actionButton || !this.dtInstance) return;

    const action = actionButton.getAttribute('data-action');
    const caseId = actionButton.getAttribute('data-id');

    if (!action) return;

    const row = actionButton.closest('tr');
    if (!row) return;

    const rowData = this.dtInstance.row(row).data();

    switch (action) {
      case 'edit':
        if (caseId) {
          this.editCase(caseId);
        }
        break;
      case 'delete':
        this.deleteCase(rowData);
        break;
      case 'permanentdelete':
        this.permDeleteWithPrompt(rowData);
        break;
      case 'recover':
        this.recoverCase(rowData);
        break;
    }
  }

  private bindTableEvents(): void {
    if (this.dataTable && this.dataTable.nativeElement) {
      this.dataTable.nativeElement.addEventListener('click', this.handleActionClick);
    }
  }

  // Used to render the 'Actions' column in the DataTable
  private renderActions(caseItem: Case): string {
    // If case is deleted, display recover and perm delete buttons for admin
    // display only recover button for non admins
    if (caseItem.isDeleted) {
      if (this.staffInfo?.isAdmin == true) {
        return (
          `
          <button class="btn btn-link p-1" data-action="recover" data-id="${caseItem.id}">
            <img src="undo.png" alt="Recover" title="Recover" style="width: 25px; height: 25px;">
          </button>
          <button class="btn btn-link p-1" data-action="permanentdelete" data-id="${caseItem.id}">
            <img src="red-trashcan-icon.png" alt="Delete" title="Delete" style="width: 25px; height: 25px;">
          </button>
          `
        );
      }
      else if (this.staffInfo?.isAdmin == false) {
        return (
          `
          <button class="btn btn-link p-1" data-action="recover" data-id="${caseItem.id}">
            <img src="undo.png" alt="Recover" title="Recover" style="width: 25px; height: 25px;">
          </button>
          `
        );
      }
    }
    // If case is not deleted, display edit and delete buttons
    else {
      return (
        `
        <button class="btn btn-link p-1" data-action="edit" data-id="${caseItem.id}">
          <img src="edit-icon.png" alt="Edit" title="Edit" style="width: 25px; height: 25px;">
        </button>
        <button class="btn btn-link p-1" data-action="delete" data-id="${caseItem.id}">
          <img src="red-trashcan-icon.png" alt="Delete" title="Delete" style="width: 25px; height: 25px;">
        </button>
        `
      );
    }

    return "";
  }

  // Method to render column data in the DataTable
    // Displays N/A for each column data that is missing
    // Prevents "no column data" error
  private renderColumn(data: any, type: string, maxLength?: number): string {
    if (type === 'display') {
      // Handle null/undefined/empty values
      if (data == null || data === '') {
        return 'N/A';
      }
      
      // Handle text truncation if maxLength is specified
      if (maxLength && typeof data === 'string' && data.length > maxLength) {
        return `<span title="${data}">${data.substring(0, maxLength)}...</span>`;
      }
      
      return data.toString();
    }
    // For sorting/filtering, return empty string if null/undefined
    return data == null ? '' : data.toString();
  }

  // Method to initialize the DataTable
  private initDataTable(): void {
    if (!this.dataTable) {
      console.error('DataTable element not found.');
      return;
    }

    // Destroy existing instance if it exists
    if (this.dtInstance) {
      this.dtInstance.destroy();
    }

    const idColumn = {
      name: 'id'
    };

    const columns = [
      {
        name: 'firstName',
      },
      {
        name: 'lastName',
      },
      {
        name: 'phoneNumber',
      },
      {
        name: 'createdDate',
      },
      {
        name: 'notes',
        maxLength: 25,
      },
      {
        name: 'status',
      },
      {
        name: 'numOfPets',
      },
      {
        name: 'species',
      }
    ];

    // Create new DataTable instance
    this.dtInstance = new DataTable(this.dataTable.nativeElement, {
      data: this.displayedCases,
      columns: [
        ...columns.map(col => ({
          data: col.name,
          defaultContent: 'N/A',
          orderable: ['firstName', 'lastName', 'phoneNumber', 'createdDate', 'status', 'numOfPets', 'species'].includes(col.name),
          searchable: ['firstName', 'lastName', 'phoneNumber', 'createdDate', 'status', 'species'].includes(col.name),
          render: (data: any, type: string) => {
            // If column is createdDate
            if (col.name === 'createdDate') {
              let formattedDate = '';

              // Handle null/undefined/empty values
              if (data == null || data === '') {
                return 'N/A';
              }
              
              // Convert Firebase Timestamp to milliseconds
              if (data?.seconds !== undefined) {
                const timestamp = data.seconds * 1000 + data.nanoseconds / 1e6;
                formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric'
                });
              }
          
              if (type === 'display' || type === 'filter') {
                // Return formatted date for display and filtering/searching
                return formattedDate;
              }
              
              // Return timestamp for sorting
              return data?.seconds ?? data; 
            }

            // All columns other than createdDate
            return this.renderColumn(data, type, col.maxLength);
          }
        })),
        { // actions column
          data: null,
          orderable: false,
          searchable: false,
          render: (data: any, type: string, row: any) => this.renderActions(row)
        },
        { // id column only used to search and is not visible
          data: idColumn.name,
          orderable: false,
          searchable: true,
          visible: false,
          render: (data: any, type: string) => this.renderColumn(data, type)
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
            placeholder: 'Search',
          }
        }
      },
      order: [[3, 'desc']], // Default sort by 'createdDate' in descending order
      searching: false, // Disable searching for custom search bar
      // Column Definitions
      columnDefs: [
        {
          targets: 2, // phoneNumber column
          width: '150px', // Add width
          className: 'phone-column' 
        },
        {
          targets: 3, // createdDate column
          width: '120px', // Reduce width
          className: 'dt-left' // align left
        },
        {
          targets: 4, // notes column
          width: '150px' // Add width
        },
        {
          targets: 5, // status column
          width: '150px' // Add width
        },
        {
          targets: 6, // numOfPets column
          width: '80px', // Reduce width
          className: 'dt-center' // align center
        }
      ]
    });

    this.dtInitialized = true;
    this.bindTableEvents();
  }

  private reInitDataTable(): void {
    if (!this.dtInstance) {
      this.initDataTable();
      return;
    }

    this.dtInstance
      .clear()
      .rows.add(this.displayedCases)
      .draw();
  }

  async getFilteredCases(getDefaultCases: boolean) {
    await this.casesService
      .getAll(
        undefined, // status
        "", // specie
        "", // timeframe
        0, // offset
        this.startDate, // created date start date
        this.endDate, // created date end date
        this.updatedStartDate, // updated date start date
        this.updatedEndDate, // updated date end date
        this.searchInputValue, // search bar input 
        getDefaultCases, // gets "default" cases if true, active cases: limit of 10 | deleted cases: limit of 50
        this.showDeleted // deleted cases (true or false)
      )
      .then((data: Case[]) => {
        this.cases = data;
        this.reInitDataTable();
      })
      .catch((error) => {
        console.error('Error searching cases:', error);
      });
  }

  performSearch() {
    if (!this.searchInput || !this.searchInput.nativeElement) {
      console.error('Search input not available yet');
      return;
    }

    this.searchInputValue = this.searchInput.nativeElement.value;

    // Split into words and capitalize each if it contains only letters
    if (/^[a-zA-Z\s]+$/.test(this.searchInputValue)) { // Check for letters and spaces only
      this.searchInputValue = this.searchInputValue
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      this.searchInput.nativeElement.value = this.searchInputValue;
    }

    if (this.searchInputValue === '') {
      this.getFilteredCases(true);
    }
    else {
      this.getFilteredCases(false);
    }
  }

  clearSearch(inputElement: HTMLInputElement) {
    inputElement.value = '';
    this.searchInputValue = '';

    if (this.startDate && this.endDate || this.updatedStartDate && this.updatedEndDate) {
      this.getFilteredCases(false);
    }
    else {
      //Get most recently created cases (limited - 10 for active, 50 for deleted)
      this.getFilteredCases(true);
    }
  }

  // Trigger search on Enter key
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.searchInput.nativeElement === document.activeElement) {
      this.performSearch();
    }
  }

  // Handle input: decide if it's a phone number or something else
  handleInput(input: HTMLInputElement): void {
    const value = input.value.trim();
    const cleanedValue = value.replace(/\D/g, ''); // Remove non-digits

    // Treat as phone number if cleaned value is at least 3 digits and original value is mostly numeric
    if (cleanedValue.length >= 3 && this.isMostlyNumeric(value)) {
      this.formatPhoneNumber(input);
    } else {
      this.searchInputValue = value;
    }
  }

  // Check if the value is mostly numeric (allows dashes for phone numbers)
  isMostlyNumeric(value: string): boolean {
    const cleanedValue = value.replace(/-/g, ''); // Remove dashes only
    return /^\d*$/.test(cleanedValue); // Check if remaining characters are all digits (or empty)
  }

  // Format phone number with dashes when searching
  formatPhoneNumber(input: HTMLInputElement): void {
    let value = input.value.replace(/\D/g, ''); // Remove all non-digits

    // Limit to 10 digits (standard US phone number)
    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    // Apply formatting based on length
    let formattedValue = value;
    if (value.length > 6) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6)}`;
    } else if (value.length > 3) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else {
      formattedValue = value;
    }

    input.value = formattedValue;
    this.searchInputValue = formattedValue;
  }

  onDateChange() {
    if (this.startDate && this.endDate) {
      //Filter cases by date range
      this.getFilteredCases(false);
    }
    else if (!this.startDate && !this.endDate && this.updatedStartDate && this.updatedEndDate) {
      //Filter cases by updated date range
      this.getFilteredCases(false);
    }
    // Get default cases
    else {
      //Get up to 10 most recently created cases
      this.getFilteredCases(true);
    }
  }

  clearDateRange() {
    this.startDate = undefined;
    this.endDate = undefined;
    this.onDateChange();
  }

  clearUpdatedDateRange() {
    this.updatedStartDate = undefined;
    this.updatedEndDate = undefined;
    this.onDateChange();
  }

  // Method to toggle the showDeleted filter
  async toggleShowDeleted(): Promise<void> {
    this.showDeleted = !this.showDeleted;

    if (this.showDeleted === true) {
      // Clear date range and search value filters
      this.startDate = undefined;
      this.endDate = undefined;
      this.updatedStartDate = undefined;
      this.updatedEndDate = undefined;
      this.searchInput.nativeElement.value = '';
      this.searchInputValue = '';

      //Get most recently created  "deleted" cases (limited - 50 for deleted)
      await this.getFilteredCases(true);

      // Check for deleted cases that have passed the 30 day expiration
      await this.checkDeletedCaseExpiration();
    }

    if (this.showDeleted === false) {
      // Set default created date range filter, clear updated date range and search value
      this.startDate = new Date(new Date().setDate(new Date().getDate() - 7)); // 7 days ago
      this.endDate = new Date(); // current date
      this.updatedStartDate = undefined;
      this.updatedEndDate = undefined;
      this.searchInput.nativeElement.value = '';
      this.searchInputValue = '';

      //Get cases that have been created in the past week
      await this.getFilteredCases(false);
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
    const confirmDelete = window.confirm(`Are you sure you want to mark this case for deletion?\nCase ID: ${caseItem.id}`);

    if (confirmDelete) {
      // set the case's deleted flag to true
      caseItem.isDeleted = true;
      // set the case's deletedDate to a timestamp of the current date
      caseItem.deletedDate = Timestamp.fromDate(new Date());

      this.casesService.updateCase(caseItem).subscribe(() => {
        this.reInitDataTable(); // Reinitialize the DataTable after deleting a case
      });

      // Display success message
      this.toastr.success('Case is marked for deletion', 'Success');
    } else {
      // User canceled
      this.toastr.info('Mark for deletion was canceled', 'Canceled');
    }
  }

  // Check expiration and permanently delete cases
  async checkDeletedCaseExpiration(): Promise<void> {
    if (!this.cases || !Array.isArray(this.cases)) {
      console.error("this.cases is not defined or not an array");
      return;
    }

    const deletionPromises: Promise<void>[] = [];

    this.cases.forEach((caseItem: Case) => {
      if (caseItem.deletedDate) {
        const deletedJsDate: Date = caseItem.deletedDate.toDate();
        const currentDate: Date = new Date();
        const timeDifference: number = currentDate.getTime() - deletedJsDate.getTime();
        // Use lower threshold to take into account variation when measuring time between dates
        const twentyNineAndHalfDaysInMs: number = 29.5 * 24 * 60 * 60 * 1000;

        if (timeDifference >= twentyNineAndHalfDaysInMs) {
          deletionPromises.push(
            this.permDeleteNoPrompt(caseItem).catch((error) => {
              console.error(`Error when permanently deleting case: ${caseItem.id}:`, error);
            })
          );
        }
      }
    });
  
    // Wait for all deletions to complete
    await Promise.all(deletionPromises);

    this.getFilteredCases(true);
  }

  // Permanently delete a case with a prompt
  async permDeleteWithPrompt(caseItem: Case) {
    const confirmDelete = window.confirm(`Are you sure you want to PERMANENTLY DELETE this case?\nCase ID: ${caseItem.id}`);

    if (confirmDelete) {
      await permDeleteCase(caseItem);

      this.getFilteredCases(true);
      this.reInitDataTable();

      // Display success message
      this.toastr.success('Case deleted successfully', 'Success');
    } 
    else {
      // User canceled
      this.toastr.info('Delete case was canceled', 'Canceled');
    }
  }

  // Permanently delete a case without a prompt - used for 30 day expiration
  async permDeleteNoPrompt(caseItem: Case): Promise<void> {
    await permDeleteCase(caseItem);
  }

  // Method to recover a deleted case
  recoverCase(caseItem: Case) {

    // set the case's deleted flag to false
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
    // Return deleted cases if showDeleted is true
    // Return active cases if showDeleted is false
    const filteredCases = this.showDeleted 
      ? this.cases.filter(item => item.isDeleted) 
      : this.cases.filter(item => !item.isDeleted);
    return filteredCases;
  }
}