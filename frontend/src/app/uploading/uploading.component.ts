import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Papa } from "ngx-papaparse";
import * as XLSX from "xlsx";
import { Case } from '../models/case';
import { CasesService } from '../services/cases.service';
import { CaseFile } from '../models/caseFile';
import { FormsModule } from '@angular/forms';
import { Timestamp } from 'firebase/firestore';
import { ToastrService } from 'ngx-toastr';
import { STATUSES, SPECIES } from '../constants';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-uploading',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './uploading.component.html',
  styleUrls: ['./uploading.component.css']
})
export class UploadingComponent {

  filesToUpload: File[] = [];
  isEditingData = false;
  checkData = false;
  isLoading = false;
  files: CaseFile[] = [];
  index: number = 0;
  currentFileName: string = "";
  currentFile: Case[] = [];
  XLSXType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  CSVType = 'text/csv';
  phoneShape = /[0-9]{10}$/;
  species = SPECIES;
  statuses = STATUSES;


  constructor(private toast: ToastrService, private papa: Papa, private caseService: CasesService) {}

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
    this.index = index
    this.enableEditData()
  }
  
  cancel() {
    let confirmAlert = confirm("Are you sure you want to cancel?")
    if (confirmAlert) { this.disableEditData() }
  }

  apply() {    
    // console.log(this.currentFile)
    this.toast.info("Changes saved.")
    this.disableEditData()
  }
  
  /**
   * Parses the .csv file that is in the list of files to be uploaded and adds the file to the list of files to upload.
   * @param file The file being parsed.
   */
  async parseCSV(file: File){
    let returnable = this.papa.parse(await file.text())
    let thisFile: CaseFile = {name: file.name, cases: []}
    let data = returnable.data
    //Use this console.log to see what column number data is located at
    // console.log("data:")
    //console.log(data)
    for(let row = 1; row < returnable.data.length-1; row++){
      // debugger;
      let phoneNum: string = data[row][4]
      let phoneExec: RegExpExecArray | null = this.phoneShape.exec(phoneNum)
      // Checks if the regular expression works, and if it does not, sets the phone number to be blank.
      phoneExec != null ? phoneNum = phoneExec[0] : phoneNum = ""

      // This is the Case created with the first sample file sent to us by Lauren. This file has now changed to the new Case
      // let c: Case = {
      //   id: "",
      //   firstName: data[row][2],
      //   lastName: data[row][3],
      //   phoneNumber: phoneNum,
      //   notes: "",
      //   status: data[row][153],
      //   numOfPets: data[row][168],
      //   species: data[row][158],
      //   isDeleted: false,
      //   createdDate: Timestamp.now()
      // }
      let c: Case = {
        id: uuidv4(),
        firstName: data[row][2],
        lastName: data[row][3],
        phoneNumber: phoneNum,
        notes: data[row][228],
        status: data[row][213],
        numOfPets: data[row][233],
        species: data[row][218],
        isDeleted: false,
        createdDate: Timestamp.now() //Change to uuid
      }
      // console.log(c)
      thisFile.cases.push(c)
    }
    this.files.push(thisFile)
    console.log('Got CSV')
  }

  /**
   * Parses the .xlsx file that is in the list of files to be uploaded and adds the file to the list of files to upload.
   * @param file The file being parsed.
   */
  parseXLSX(file: File) {
    let workBook: XLSX.WorkBook;
    let jsonData: JSON[] = [];
    const reader = new FileReader();
    reader.onload = (event) => {
      // debugger
      const data = reader.result;
      workBook = XLSX.read(data, { type: 'binary' });
      jsonData = XLSX.utils.sheet_to_json(workBook.Sheets["VM log"]);

      // In this spot, startingLine would need to be held (more likely held in firebase) to get the current line that is being read. 
      // From there, the xlsx would be parsed and read line by line and the last line that was read would be recorded.
      let startingLine = 0;
      const thisFile: CaseFile = {name: file.name, cases: []} // Create a CaseFile object that holds the name of the file it is based off of and the cases in that file
      /*
      ---------------THIS IS NOW OLD------------------
      for(let i = startingLine; i < jsonData.length; i += 2){
        let line1 = JSON.parse(JSON.stringify(jsonData[i]))
        let line2 = JSON.parse(JSON.stringify(jsonData[i+1]))
        
        //Create the Case that is pushed to the CaseFile object
        let c: Case = {
          id: uuidv4(),
          firstName: "",
          lastName: "",
          phoneNumber: String(line2["Phone Number"]),
          notes: line1["Message"],
          status: line1["Status"],
          numOfPets: line1["# Pets (if PSN/RH)"],
          species: line1["Species"],
          isDeleted: false,
          callDate: Timestamp.fromDate(new Date(line1["Date of Message"]))
          }
          thisFile.cases.push(c) // Push all of the cases to the CaseFile object
          }
          */

      const parsedJsonData = JSON.parse(JSON.stringify(jsonData))

      let lineDict: {[messageNumber: number]: Case} = {}
      // lineDict[Symbol.iterator] = function* () {
      //   return 5
      // }

      let newLines = /[\r\n]+/gm
      for(let row of parsedJsonData){
        let messageNum: number = row["Message Number"]
        let pn: string = row["Phone Number"]
        let n: string = row["Message"]
        let t: string = row["Date of Message"]
        
        // Check if the value of the variables is undefined. If it is, try to assign it to the same value of the key in the dict.
        // If the dict is undefined there too, go ahead and assign undefined. If not undefined, get the old value to avoid overwritting.
        if (pn == undefined && lineDict[messageNum] != undefined) { pn = lineDict[messageNum].phoneNumber } else { pn = row["Phone Number"] }
        if (n == undefined && lineDict[messageNum] != undefined) { n = lineDict[messageNum].notes } else { n = row["Message"] }
        
        // Check if there are any new lines. If so, replace them with a space.
        if (n != undefined) { n = n.replaceAll(newLines, " ") }

        // Check if the date is in the format I want (2024-11-21T19:11:21+00:00) and if it is keep it, else try to assign it to the previous timestamp
        if (lineDict[messageNum] == undefined && t.indexOf("+") == -1) { t = ""; console.log("discarded time") }
        //Also want to check in this spot similar to above lines for the nicely formatted date to parse and include in the Case info below
        // console.log(`messageNum: ${messageNum}, phone num: ${row["Phone Number"]}, typeof: ${typeof row["Phone Number"]}, notes: ${String(row["Message"]).substring(0, 5)}, typeof: ${typeof row["Message"]}`)
        // console.log(`messageNum: ${messageNum}, ${pn}, ${n}`)
        lineDict[messageNum] = {
          id: uuidv4(),
          firstName: "",
          lastName: "",
          phoneNumber: pn,
          notes: n,
          status: "Open",
          numOfPets: 1,
          species: "",
          isDeleted: false,
          callDate: Timestamp.fromDate(new Date(t))
        }
        // console.log(rowNum)
        // console.log(pn)
        // console.log(n)
      }
      // debugger
      // console.log(lineDict[21])
      console.log(lineDict)
      for (let c in lineDict){
        console.log(`${c}, ${lineDict[c].numOfPets}`)
        thisFile.cases.push(lineDict[c] as Case)
      }

      this.files.push(thisFile) // Push the CaseFile object to this.files so that the index can be used for populating the edit data modal
      console.log('Got XLSX')
    }
    reader.readAsBinaryString(file);
  }

  /**
   * Handles the file upload event.
   * @param event Event that is triggered when the user presses the button for uploading files and the files are selected in the file system prompt.
   */
  handleFileInput(event: Event) {
    // Clear the files lists so that the wrong case files are not still listed
    this.files = []

    const input = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = input.files;

    if (fileList) {
      const files = Array.from(fileList);
      this.filesToUpload = files
    }

    let removedIncorrectFile = false
    this.filesToUpload.forEach((file, i) => {
      if (file.type == this.XLSXType) {
        this.parseXLSX(file)
      } else if (file.type == this.CSVType) {
        this.parseCSV(file) 
      } else {
        this.removeFile(i, false)
        removedIncorrectFile = true
      }
    });

    if (removedIncorrectFile) {
      this.toast.info("Discarded files(s) that were not .csv or .xlsx files.")
    }
  }
  
  /**
   * This method may be removed, but if there was a need to check if the fields from an edited file are valid.
   * @returns Boolean confirming that all checked fields are valid. 
   */
  allCasesValid(): boolean {
    // If there are any fields that are required to be filled, it would be checked here

    
    return true
  }

  /**
   * Uploads the files listed in files array. 
   * @returns Boolean representing if the upload was successful.
   */
  async upload(): Promise<boolean> {
    // Loop through each CaseFile that is being stored in "files" and upload all of the cases and upload them using firebaseConnection
    if (this.files[0].cases[0] == undefined) { 
      // TEMP SETUP, gets the first Case of the first CaseFile and checks it
      return false
    } else {
      // if (!allCasesValid()) { halt upload and show required fields }
      let errorLevel: boolean;
      this.files.forEach(caseFile => { 
        caseFile.cases.forEach(async uploadCase => {
          // console.log(uploadCase.id)
          errorLevel = await this.caseService.createCase(uploadCase)
          if (errorLevel == false) { return uploadCase }
          return true
        })
      })
    }

    // Clear the upload queue
    this.filesToUpload = []
    this.files = []

    // Alert the user that the upload was succesful
    this.toast.info("File(s) uploaded! Find it in the \"Cases\" tab.")

    // Signify that all Cases were uploaded successfully
    return true
  }

  /**
   * Remove the file or files from the list of files to be uploaded.
   * @param index The location of the file to be removed.
   * @param showPrompt Boolean to determine if the confirmation prompt is shown, or if the file removal is automated.
   */
  removeFile(index: number, showPrompt: boolean = true) {
    // debugger
    let confirmation = true
    if (showPrompt) {
      // Need to add more to this, removing the file from this.files as well
      confirmation = confirm('Are you sure you want to remove this file?')
    }
    if (confirmation) {
      if ((index ?? -2) > -1) {
        this.filesToUpload?.splice((index ?? 0), 1);
        this.files?.splice((index ?? 0), 1);
      }
    }
  }
}

// ---TEST CASE FOR TESTING---
// {
//     id: "100",
//     firstName: "test",
//     lastName: "lastNameTest",
//     phoneNumber: "1234567890",
//     notes: "test notes",
//     status: "Open",
//     numOfPets: 1,
//     species: "Dog",
//     isExpanded: false,
//     isDeleted: false
// }
