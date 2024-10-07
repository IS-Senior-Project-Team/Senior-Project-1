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

  fileToUpload: File | null = null;

  constructor(private uploadService: UploadsService) {}

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files.length > 0) {
      this.fileToUpload = input.files.item(0);
    }
  }

  uploadFileToActivity() {
    if (this.fileToUpload) {
      this.uploadService.postFile(this.fileToUpload).subscribe(
        data => {
          console.log("File upload successful:", data);
        },
        error => {
          console.error("File upload error:", error);
        }
      );
    }
  }

  removeFile() {
    this.fileToUpload = null;
  }

  downloadFile() {
    if (this.fileToUpload) {
      // Implement the logic to download or display the file
      console.log('Downloading file:', this.fileToUpload.name);
    }
  }
}