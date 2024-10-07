import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadsService } from '../services/uploads.service';

@Component({
  selector: 'app-uploading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './uploading.component.html',
  styleUrls: ['./uploading.component.css']
})
export class UploadingComponent {

  filesToUpload: File[] | null = null;

  constructor(private uploadService: UploadsService) {}

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