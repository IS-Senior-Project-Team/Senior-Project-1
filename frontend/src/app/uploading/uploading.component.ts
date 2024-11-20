import { Component } from '@angular/core';
import { CommonModule, NgFor, NgForOf } from '@angular/common';
import { UploadsService } from '../services/uploads.service';
import { Papa, ParseResult } from "ngx-papaparse";
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';

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
  isWaitwhileVisible = false;
  isVoiceCall = false;
  editData = false;
  checkData = false;

  constructor(private uploadService: UploadsService, private papa: Papa, private caseService: CasesService) {}

  enableEditData() {
    this.editData = true
  }

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
      if (file.name == "waitwhile example.csv") {
        this.isWaitwhileVisible = true
      }
      if (file.name == "VM Log Example.xlsx") {
        this.isVoiceCall = true
      }
    })
  }


  //Will not need for current, need to overwrite button
  async upload() {
    let uploadCase: Case;
    let successfulUpload = await this.caseService.createCase( //Need to make this grab information (with the use of regex) from the page; id is expected to be overwritten
      {
          id: "100",
          firstName: "test",
          lastName: "lastNameTest",
          phoneNumber: "1234567890",
          notes: "test notes",
          status: "Open",
          numOfPets: 1,
          species: "Dog",
          isExpanded: false,
          isDeleted: false
      }
    );
  }
  // uploadFileToActivity() {
  //   if (this.filesToUpload) {
  //     this.uploadService.postFiles(this.filesToUpload).subscribe(
  //       // console.log(data)
  //       data => {
  //         console.log("File upload successful:", data);
  //       },
  //       error => {
  //         console.error("File upload error:", error);
  //       }
  //     );
  //   }
  // }

  removeFile(file: File) {
    const index = this.filesToUpload?.indexOf(file);
     // Check if the file is found in the array
    if ((index ?? -2) > -1) {
      this.filesToUpload?.splice((index ?? 0), 1); 
    }
  }
}