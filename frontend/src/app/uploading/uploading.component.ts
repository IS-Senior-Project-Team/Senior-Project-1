import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadsService } from '../services/uploads.service';
import { Papa, ParseResult } from "ngx-papaparse";
import * as XLSX from "xlsx";
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

  filesToUpload: File[] = [];
  parsedCSVs: ParseResult[] | null = [];
  cases: Case[] = [];
  isWaitwhileVisible = false;
  isVoiceCall = false;
  isEditingData = false;
  checkData = false;
  currentFile: File | null = null;
  XLSXType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  CSVType = 'text/csv';

  constructor(private uploadService: UploadsService, private papa: Papa, private caseService: CasesService) {}

  enableEditData() {
    this.isEditingData = true
  }

  disableEditData() {
    this.isEditingData = false
  }

  editData(index: number) {
    let file: File = this.filesToUpload[index]
    this.enableEditData()



    // file.text().then(result => this.infoTest?.push(this.parseCSV(result)))


    // <td>{{ item.data[1][2] }}</td>
    // <td>{{ item.data[1][3] }}</td>
    // <td>{{ item.data[1][4] }}</td>
    // <td>{{ item.data[1][153] }}</td>
    // <td>{{ item.data[1][158] }}</td>
    // <td>{{ item.data[1][168] }}</td>
    // <td>{{ item.data[1][188] }}</td>
  }

  cancel(){
    let confirmAlert = confirm("Are you sure you want to cancel?")
    if (confirmAlert) { this.disableEditData() }
  }

  parseCSV(file: Blob){
    let returnable = this.papa.parse(file)
    return returnable
  }

  parseXLSX(file: File) {
    const fileBuffer = file.arrayBuffer().then(undefined) //broken
    let excel = XLSX.read(file.arrayBuffer)
    file.arrayBuffer()
    // console.log('State: ')
    // console.log(fileBuffer)
  }

  handleFileInput(event: Event) {
    debugger;
    const input = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = input.files;

    if (fileList) {
      const files = Array.from(fileList);
      this.filesToUpload = files
      // for(let file of Array.from(input?.files)) {
      //   this.filesToUpload.push(file);
      // }
    }

    this.filesToUpload.forEach(file => {
      if (file.type == this.XLSXType) {
        this.parseXLSX(file)
        console.log('Got XLSX')
      } else if (file.type == this.CSVType) {
        this.parseCSV(file)
        console.log('Got CSV')
      }
    });

  }


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
  // Old method
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

  removeFile(index: number) {
    let confirmation = confirm('Are you sure you want to remove this file?')
    if (confirmation) {
      // console.log(index);
      if ((index ?? -2) > -1) {
        this.filesToUpload?.splice((index ?? 0), 1);
      }
    }

  }

  // Old method
  // removeFile(file: File) {
  //   const index = this.filesToUpload?.indexOf(file);
  //    // Check if the file is found in the array
  //   if ((index ?? -2) > -1) {
  //     this.filesToUpload?.splice((index ?? 0), 1);
  //   }
  // }
}
