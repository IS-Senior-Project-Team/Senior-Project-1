import { Routes } from '@angular/router';
import { CaseManagementComponent } from './case-management/case-management.component';
import { EditCaseComponent } from './edit-case/edit-case.component';
import { RegisterStaffComponent } from './view/register-staff/register-staff.component';
import { StaffLoginComponent } from './view/staff-login/staff-login.component';
import { ForgotPasswordComponent } from './view/forgot-password/forgot-password.component';
import { UploadingComponent } from './uploading/uploading.component';
import { ReportingComponent } from './reporting/reporting.component';
import { EmailConfirmComponent } from './view/emailConfirm/email-confirm.component';
import { noAuthGuard } from './guards/no-auth.guard';
import { AccountProfileComponent } from './accountProfile/account-profile.component';
import { AdminDashboardComponent } from './admin-dash/admin-dashboard.component';
import { UploadHistoryComponent } from './upload-history/upload-history.component';


export const routes: Routes = [
    {
        canActivate:[noAuthGuard],
        path: 'case-management',
        component: CaseManagementComponent
    },
    {
        canActivate:[noAuthGuard],
        path: 'edit-case/:id',
        component: EditCaseComponent
    },
    {
        path: 'register',
        component: RegisterStaffComponent
    },
    {
        path: 'login',
        component: StaffLoginComponent
    },
    {
        path: '',
        component: StaffLoginComponent
    },
    {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
    },
    {
        canActivate:[noAuthGuard],
        path: 'upload',
        component: UploadingComponent
    },
    {
        canActivate:[noAuthGuard],
        path: 'report',
        component: ReportingComponent, 
    },
    {
        path: 'emailConfirm',
        component: EmailConfirmComponent
    },
    {
        path: 'account', //TODO: Change this to reflect specific user account? or say account profile?
        component: AccountProfileComponent
    },
    {
        path: 'admin-dashboard',
        component: AdminDashboardComponent
    },
    {
        path: 'admin-dashboard/upload-history',
        component: UploadHistoryComponent
    },
    {   // TODO: This should be changed to report since its only accessible by admin
        path: 'admin-dashboard/report',
        component: ReportingComponent
    }
];
