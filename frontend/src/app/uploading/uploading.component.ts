import { Component } from '@angular/core';
import { CommonModule, NgFor, NgForOf } from '@angular/common';
import { UploadsService } from '../services/uploads.service';
import { getCases } from '../../../../backend/src/firebase/firebaseConnection';
import { DocumentData } from 'firebase/firestore';


@Component({
  selector: 'app-uploading',
  standalone: true,
  imports: [CommonModule, NgFor],
  templateUrl: './uploading.component.html',
  styleUrls: ['./uploading.component.css']
})
export class UploadingComponent {

  filesToUpload: File[] | null = null;
  testDB: Promise<DocumentData[]> | null = null;
  testDBData: DocumentData[] = [];

  constructor(private uploadService: UploadsService) {
    // this.testDB = getCases()
    this.testfunc()
  }

  async testfunc() {
    await getCases().then(result => this.testDBData?.push(result))
    this.testDBData.forEach(item => {
      console.log(item)
    })
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files) {
      this.filesToUpload = Array.from(input.files);
    }
  }

  uploadFileToActivity() {
    if (this.filesToUpload) {
      this.uploadService.postFiles(this.filesToUpload).subscribe(
        data => {
          console.log("File upload successful:", data);
        },
        error => {
          console.error("File upload error:", error);
        }
      );
    }
  }

  removeFile(file: File) {
    const index = this.filesToUpload?.indexOf(file);
     // Check if the file is found in the array
    if ((index ?? -2) > -1) {
      this.filesToUpload?.splice((index ?? 0), 1); 
    }
  }
}