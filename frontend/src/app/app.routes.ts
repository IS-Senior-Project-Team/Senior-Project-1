import { Routes } from '@angular/router';
import { CaseManagementComponent } from './case-management/case-management.component';
import { RegisterStaffComponent } from './view/register-staff/register-staff.component';
import { StaffLoginComponent } from './view/staff-login/staff-login.component';
import { ForgotPasswordComponent } from './view/forgot-password/forgot-password.component';
import { UploadingComponent } from './uploading/uploading.component';
import { ReportingComponent } from './reporting/reporting.component';


export const routes: Routes = [
    {
        path: 'case-management',
        component: CaseManagementComponent
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
        path: 'upload',
        component: UploadingComponent
    },
    {
        path: 'report',
        component: ReportingComponent
    }
];
