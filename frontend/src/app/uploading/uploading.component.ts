import { Component } from '@angular/core';
import { CommonModule, NgFor, NgForOf } from '@angular/common';
import { UploadsService } from '../services/uploads.service';
import { Papa, ParseResult } from "ngx-papaparse";

@Component({
  selector: 'app-uploading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './uploading.component.html',
  styleUrls: ['./uploading.component.css']
})
export class UploadingComponent {

  filesToUpload: File[] | null = null;
  infoTest: ParseResult[] | null = [];

  constructor(private uploadService: UploadsService, private papa: Papa) {}

  parseCSV(csvData: string | Blob){
    let returnable = this.papa.parse(csvData)
    return returnable
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files) {
      this.filesToUpload = Array.from(input.files);
    }

    this.filesToUpload?.forEach(file => {
      file.text().then(result => this.infoTest?.push(this.parseCSV(result)))
      console.log(this.infoTest)
    })
  }

  uploadFileToActivity() {
    if (this.filesToUpload) {
      this.uploadService.postFiles(this.filesToUpload).subscribe(
        // console.log(data)
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