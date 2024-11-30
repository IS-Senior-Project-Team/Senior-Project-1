import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadsService } from '../services/uploads.service';
import { Papa, ParseResult } from "ngx-papaparse";
import * as XLSX from "xlsx";
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CaseFile } from '../models/caseFile';

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
  // parsedFiles: JSON | null = null;
  // isWaitwhileVisible = false;
  // isVoiceCall = false;
  isEditingData = false;
  checkData = false;
  files: CaseFile[] = [];
  currentFileName: string = "";
  currentFile: Case[] = [];
  XLSXType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  CSVType = 'text/csv';
  phoneShape = /[0-9]{10}$/;
  species = ["Cat", "Dog", "Kitten", "Puppy"];
  statuses = ["Already Rehomed", "Asked for more info", "Bad # or No VM", 
    "Duplicate", "Found Pet", "Keeping-Behavior", "Keeping- Medical", 
    "Keeping- Other", "Kitten Pack & S/N", "LM with Info", "Lost Pet", 
    "No Show Appt", "Not PSN", "Open", "Owner Surrender Intake", "PSN Boarding", 
    "Rehome Attempt", "Rehome Confirmed", "Reunited", "Surrender Appt", 
    "Surrender Denied", "Walk-in Surrender Attempt", "Walk-in- Stray Attempt", 
    "Walk-In- OS Intake", "Walk-in- Stray Intake", "Walk-in- Other", 
    "Call elevated to management", "ACPS"];


  constructor(private uploadService: UploadsService, private papa: Papa, private caseService: CasesService) {}

  enableEditData() {
    this.isEditingData = true
  }

  disableEditData() {
    this.isEditingData = false
  }

  editData(index: number) {
    let file: File = this.filesToUpload[index]
    
    this.currentFileName = file.name
    this.currentFile = this.files[index].cases
    this.enableEditData()
    // file.text().then(result => this.infoTest?.push(this.parseCSV(result)))
  }
  
  cancel(){
    let confirmAlert = confirm("Are you sure you want to cancel?")
    if (confirmAlert) { this.disableEditData() }
  }

  apply() {
    let confirmAlert = confirm("Are you sure you want to apply the changes?")
    if (confirmAlert) { this.disableEditData() }
  }
  
  async parseCSV(file: File){
    let returnable = this.papa.parse(await file.text())
    let thisFile: CaseFile = {name: file.name, cases: []}
    let data = returnable.data
    // console.log(data)
    for(let row = 1; row < returnable.data.length-1; row++){
      // debugger;
      let phoneNum: string = data[row][4]
      let phoneExec: RegExpExecArray | null = this.phoneShape.exec(phoneNum)
      if (phoneExec != null) { phoneNum = phoneExec[0] } 
      else { phoneNum = "" }
      // console.log("phoneNum: " + phoneExec?.[0])

      // (phoneExec == null) ? "" : this.phoneShape.exec(phoneNum)?.[1]

      let c: Case = {
        id: "",
        firstName: data[row][2],
        lastName: data[row][3],
        phoneNumber: phoneNum,
        notes: "",
        status: data[row][153],
        numOfPets: data[row][168],
        species: data[row][158],
        isExpanded: false,
        isDeleted: false
      }
      // console.log(c)
      thisFile.cases.push(c)
    }
    this.files.push(thisFile)
    console.log('Got CSV')
  }

  parseXLSX(file: File) {
    let workBook: XLSX.WorkBook;
    let jsonData: JSON[] = [];
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = reader.result;
      workBook = XLSX.read(data, { type: 'binary' });
      jsonData = XLSX.utils.sheet_to_json(workBook.Sheets["VM log"]);

      // In this spot, startingLine would need to be held (more likely held in firebase) to get the current line that is being read. 
      // From there, the xlsx would be parsed and read line by line and the last line that was read would be recorded.
      let startingLine = 0;
      const thisFile: CaseFile = {name: file.name, cases: []} // Create a CaseFile object that holds the name of the file it is based off of and the cases in that file
      for(let i = startingLine; i < jsonData.length; i += 2){
        let line1 = JSON.parse(JSON.stringify(jsonData[i]))
        let line2 = JSON.parse(JSON.stringify(jsonData[i+1]))
          // console.log("jsonData:")
          // console.log(line1);
          // console.log(line2);
  
        //Create the Case that is pushed to the CaseFile object
        let c: Case = {
          id: "",
          firstName: "",
          lastName: "",
          phoneNumber: String(line2["Phone Number"]),
          notes: line1["Message"],
          status: line1["Status"],
          numOfPets: line1["# Pets (if PSN/RH)"],
          species: line1["Species"],
          isExpanded: false,
          isDeleted: false
        }
        thisFile.cases.push(c) // Push all of the cases to the CaseFile object
      }
      this.files.push(thisFile) // Push the CaseFile object to this.files so that the index can be used for populating the edit data modal
      console.log('Got XLSX')
    }
    reader.readAsBinaryString(file);
  }

  handleFileInput(event: Event) {
    // console.log('CaseFiles:')
    // console.log(this.files)
    
    // Clear the files lists so that the wrong case files are not still listed
    this.files = []


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
        
      } else if (file.type == this.CSVType) {
        this.parseCSV(file)
        
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
    // Need to add more to this, removing the file from this.files as well
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
