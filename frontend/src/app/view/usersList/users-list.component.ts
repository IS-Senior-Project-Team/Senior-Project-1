import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { fetchAllUsers } from '../../services/firebaseConnection';
import { StaffInfo } from '../../models/staff-info';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import 'datatables.net';
import 'datatables.net-buttons';
import 'datatables.net-buttons-dt';
import DataTable from 'datatables.net-dt';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UserListComponent implements OnInit, AfterViewInit, AfterViewChecked {
  users: StaffInfo[] = [];
  loading = true;

  @ViewChild('dataTable', { static: false }) dataTable!: ElementRef;

  private dtInstance: any | null = null;
  private dtInitialized = false; // Track the DataTable initialization state

  showDeactivated: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
  ) { }

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
        name: 'firstname',
      },
      {
        name: 'lastname',
      },
      {
        name: 'email',
        maxLength: 25
      },
      {
        name: 'isAdmin',
        format: (val: boolean) => val ? 'Admin' : 'Staff'
      }
    ];

    // Create new DataTable instance
    this.dtInstance = new DataTable(this.dataTable.nativeElement, {
      data: this.displayedUsers,
      columns: [
        ...columns.map(col => ({
          data: col.name,
          defaultContent: 'N/A',
          orderable: ['firstname', 'lastname', 'email', 'isAdmin'].includes(col.name),
          searchable: ['firstname', 'lastname', 'email', 'isAdmin'].includes(col.name),
          autowidth: false,
          // scrollX: true,
          render: (data: any, type: string) => {

            if (col.format) {
              return col.format(data);
            }
            
            // All columns other than createdDate
            return this.renderColumn(data, type, col.maxLength);
          }
        })),
        {
          data: () => ' ',
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
      pageLength: 10,
      lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "All"]],
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
            placeholder: 'Search for...',
          }
        }
      }
    });

    this.dtInitialized = true;
    this.bindTableEvents();
  }

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

  private renderActions(user: StaffInfo): string {
    if (!user.isActive) {
      return `
        <button class="btn btn-link p-1" data-action="activate" data-id="${user.uid || ''}">
          <img src="reactivate-icon.png" alt="Activate" style="width: 25px; height: 25px;">
        </button>`;
    } else {
      return `
        <button class="btn btn-link p-1" data-action="viewProfile" data-id="${user.uid || ''}">
          <img src="edit.png" alt="View Profile" style="width: 25px; height: 25px;">
        </button>`;
    }
  }

  private bindTableEvents(): void {
    if (this.dataTable && this.dataTable.nativeElement) {
      this.dataTable.nativeElement.addEventListener('click', this.handleActionClick);
    }
  }

  private handleActionClick = (event: Event) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const actionButton = target.closest('[data-action]');

    if (!actionButton || !this.dtInstance) return;

    const action = actionButton.getAttribute('data-action');
    const userId = actionButton.getAttribute('data-id');

    if (!action) return;

    const row = actionButton.closest('tr');
    if (!row) return;

    const rowData = this.dtInstance.row(row).data();

    switch (action) {
      case 'viewProfile':
        if (userId) {
          this.viewProfile(userId);
        }
        break;
      case 'activate':
        if (userId) {
          this.viewProfile(userId); //Make the page persist if the user reactivation is cancelled
        }
        break;
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      this.users = await fetchAllUsers();
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      this.loading = false;
    }
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
  }

  ngAfterViewChecked() {
    if (this.dataTable && !this.dtInitialized) {
      this.initDataTable();
    }
  }

  viewProfile(uid: string): void {
    this.router.navigate(['/profile', uid]);
  }

  private reInitDataTable(): void {
    if (!this.dtInstance) return;

    this.dtInstance
      .clear()
      .rows.add(this.displayedUsers)
      .draw();
  }

  loadUsers(): void {
    fetchAllUsers().then((data: StaffInfo[]) => {
      this.users = data;
      this.reInitDataTable(); // Reinitialize the DataTable after data is loaded
    });
  }

  toggleShowDeactivated() {
    this.showDeactivated = !this.showDeactivated;
    this.reInitDataTable(); // Reinitialize the DataTable when toggling the view
  }

  hasDeactivatedUsers(): boolean {
    return this.users.some(user => user.isActive == false);
  }

  get deactivatedUsersCount() {
    return this.users.filter(user => user.isActive == false).length;
  }

  get displayedUsers() {
    const filteredUsers = this.showDeactivated ? this.users.filter(user => !user.isActive && !user.isDeleted) : this.users.filter(user => user.isActive && !user.isDeleted);

    return filteredUsers;
  }
}
