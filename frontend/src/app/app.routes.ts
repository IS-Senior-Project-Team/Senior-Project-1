import { Routes } from '@angular/router';
import { CaseManagementComponent } from './case-management/case-management.component';
import { EditCaseComponent } from './edit-case/edit-case.component';
import { RegisterStaffComponent } from './view/register-staff/register-staff.component';
import { StaffLoginComponent } from './view/staff-login/staff-login.component';
import { ForgotPasswordComponent } from './view/forgot-password/forgot-password.component';
import { UploadingComponent } from './uploading/uploading.component';
import { ReportingComponent } from './reporting/reporting.component';
import { EmailConfirmComponent } from './view/emailConfirm/email-confirm.component';
import { adminGuard, noAuthGuard, redirectIfLoggedIn } from './guards/no-auth.guard';
import { AccountProfileComponent } from './accountProfile/account-profile.component';
import { AdminDashboardComponent } from './admin-dash/admin-dashboard.component';
import { UploadHistoryComponent } from './upload-history/upload-history.component';
import { UserListComponent } from './view/usersList/users-list.component';
import { AdminProfileViewComponent } from './admin-acct-profile/admin-profile-view.component';



export const routes: Routes = [

    {
        path: '',
        component: StaffLoginComponent,
        canActivate: [redirectIfLoggedIn] // Redirect based on role
    },
    {
        path: 'login',
        component: StaffLoginComponent,
        canActivate: [redirectIfLoggedIn]
    },
    {
        canActivate: [adminGuard],
        path: 'add-case',
        component: AddCaseComponent
    },
    {
        path: 'register',
        component: RegisterStaffComponent
    },
    {
        canActivate: [noAuthGuard],
        path: 'case-management',
        component: CaseManagementComponent
    },
    {
        canActivate: [noAuthGuard],
        path: 'edit-case/:id',
        component: EditCaseComponent
    },
    {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
    },
    {
        canActivate: [noAuthGuard],
        path: 'upload',
        component: UploadingComponent
    },
    {
        canActivate: [adminGuard],
        path: 'report',
        component: ReportingComponent,
    },
    {
        path: 'emailConfirm',
        component: EmailConfirmComponent
    },
    {
        canActivate: [noAuthGuard],
        path: 'account',
        component: AccountProfileComponent
    },
    {
        // canActivate: [adminGuard],
        path: 'profile/:uid',
        component: AdminProfileViewComponent
    },
    {
        // canActivate: [adminGuard],
        path: 'admin-dashboard',
        component: AdminDashboardComponent
    },
    {   // TODO: This should be changed to admin/users since its only accessible by admin?
        // canActivate: [adminGuard],
        path: 'admin-dashboard/users',
        component: UserListComponent
    },
    {
        // canActivate: [adminGuard],
        path: 'admin-dashboard/upload-history',
        component: UploadHistoryComponent
    },
    {   // TODO: This should be changed to report since its only accessible by admin
        // canActivate: [adminGuard],
        path: 'admin-dashboard/report',
        component: ReportingComponent
    }
];
