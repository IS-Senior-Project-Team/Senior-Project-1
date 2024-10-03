import { Routes } from '@angular/router';
import { CaseManagementComponent } from './case-management/case-management.component';
import { UploadingComponent } from './uploading/uploading.component';

export const routes: Routes = [
    {
        path: 'case-management',
        component: CaseManagementComponent
    },
    {
        path: 'upload',
        component: UploadingComponent
    }
];
