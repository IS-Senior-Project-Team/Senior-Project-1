import { Component } from '@angular/core';
import { UploadsService } from '../services/uploads.service';

@Component({
  selector: 'app-uploading',
  standalone: true,
  imports: [],
  templateUrl: './uploading.component.html',
  styleUrl: './uploading.component.css'
})
export class UploadingComponent {

  constructor(private uploadService: UploadsService) {}

  fileToUpload: File | null = null;

handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input?.files) {
    const files = input.files;
    // Handle the files here
    this.fileToUpload = files.item(0);
  }
}

uploadFileToActivity() {
  if (this.fileToUpload != null) {
  this.uploadService.postFile(this.fileToUpload).subscribe(data => {
    console.log("Success");
  }, (error: any) => {
      console.log(error);
    });
  }
}

}
