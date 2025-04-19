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

  isEmptyCase(thisCase: Case): boolean {
    if (
      thisCase.firstName == "" && 
      thisCase.lastName == "" &&
      thisCase.species == "" &&
      String(thisCase.numOfPets) == "" &&
      thisCase.phoneNumber == "" &&
      thisCase.status == "" &&
      thisCase.notes == ""
    ) { return true }
    else { return false }
  }

  isEmptyValues(thisCase: Case): boolean {
    if (
      thisCase.firstName == "" || 
      thisCase.lastName == "" ||
      thisCase.species == "" ||
      String(thisCase.numOfPets) == "" ||
      thisCase.phoneNumber == "" ||
      thisCase.notes == ""
    ) { return true }
    else { return false }
  }
  
  /**
   * Parses the .csv file that is in the list of files to be uploaded and adds the file to the list of files to upload.
   * @param file The file being parsed.
   */
  async parseCSV(file: File){
    let returnable = this.papa.parse(await file.text())
    let thisFile: CaseFile = {name: file.name, cases: []}
    let data = returnable.data
    //Use this console.log to see what column numbers data values are located at (manually through the browser console)
    // console.log("data:")
    // console.log(data[1][5])

    // Create variables to hold the column numbers that are being searched for in the nested for loops below and 
    // booleans to represent which values have been found
    let outcomeColumn: number = 1;
    let speciesColumn: number = 1;
    let notesColumn: number = 1;
    let numOfPetsColumn: number = 1;
    let outcomeColumnFound: boolean = false;
    let speciesColumnFound: boolean = false;
    let notesColumnFound: boolean = false;
    let numOfPetsColumnFound: boolean = false;
    let columnsFound: boolean = false;

    // Loop through the columns (first) and rows (second) to find where data is located at 
    // (not every row contains data for that piece of data, and the columns can change locations between WaitWhile exports)
    for(let row = 1; row < returnable.data.length-1; row++){
      for(let currentColumn = 1; data[0][currentColumn] != undefined; currentColumn++){
        // if (currentColumn == 155) { debugger }
        if (data[row][currentColumn] == "Outcome" && outcomeColumnFound == false) { outcomeColumn = currentColumn + 3; outcomeColumnFound = true; /* console.log(`outcomeColumn: ${outcomeColumn}, Outcome: ${data[row][outcomeColumn]}`) */ }
        if (data[row][currentColumn] == "Animal Type" && speciesColumnFound == false) { speciesColumn = currentColumn + 3; speciesColumnFound = true; /* console.log(`speciesColumn: ${speciesColumn}, Species: ${data[row][speciesColumn]}`) */ }
        if (data[row][currentColumn] == "Notes" && notesColumnFound == false) { notesColumn = currentColumn + 3; notesColumnFound = true; /* console.log(`notesColumn: ${notesColumn}, Notes: ${data[row][notesColumn]}`) */ }
        if (data[row][currentColumn] == "# of Pets" && numOfPetsColumnFound == false) { numOfPetsColumn = currentColumn + 3; numOfPetsColumnFound = true; /* console.log(`numOfPetsColumn: ${numOfPetsColumn}, # of Pets: ${data[row][numOfPetsColumn]}`) */ }

        if (outcomeColumnFound && speciesColumnFound && notesColumnFound && numOfPetsColumnFound) { columnsFound = true }
        if (columnsFound) { break }
      }
      if (columnsFound) { break }
    }

    let missingImportantValue: boolean = false

    for(let row = 1; row < returnable.data.length-1; row++){
      // debugger;
      let phoneNum: string = data[row][4]
      let phoneExec: RegExpExecArray | null = this.phoneShape.exec(phoneNum)
      // Checks if the regular expression works, and if it does not, sets the phone number to be blank.
      phoneExec != null ? phoneNum = phoneExec[0] : phoneNum = ""

      let c: Case = {
        id: uuidv4(),
        firstName: data[row][2],
        lastName: data[row][3],
        phoneNumber: phoneNum,
        notes: data[row][notesColumn],
        status: data[row][outcomeColumn],
        numOfPets: data[row][numOfPetsColumn],
        species: data[row][speciesColumn],
        isDeleted: false,
        createdDate: Timestamp.now()
      }

      // Skip adding a completely empty case to the case list (to avoid uploading an empty case)
      if (this.isEmptyCase(c)) { continue }

      // If important missing values are not already found in the case set and there are some found missing, set the variable here...
      if (missingImportantValue != true && this.isEmptyValues(c)) { missingImportantValue = true }

      thisFile.cases.push(c)
    }
    this.files.push(thisFile)
    console.log('Successfully got CSV')

    // ...To alert the user here
    if (missingImportantValue) { this.toast.warning("Important values are missing in the csv file(s), please be sure all values are filled to the best of your ability.") }
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
      const data = reader.result;
      workBook = XLSX.read(data, { type: 'binary' });
      jsonData = XLSX.utils.sheet_to_json(workBook.Sheets["VM log"]);

      // Create the CaseFile that holds the name of the file it is based off of (being processed in this function call),
      // and the cases in that file to be pushed to the global variable so that it can be seen and edited in the UI
      const thisFile: CaseFile = {name: file.name, cases: []}
      
      // Variable that contains all of the JSON data from the XLSX file
      const parsedJsonData = JSON.parse(JSON.stringify(jsonData))

      // Dictionary to house all of the objects to be converted to Cases.
      // As it is added to, it safely manages the lines from parsedJsonData such that all messages are grouped and keyed by message numbers
      let lineDict: {[messageNumber: number]: Case} = {}

      // Loops through all lines in parsedJsonData, collects data from the rows and groups them into lineDict
      let newLines = /[\r\n]+/gm
      for(let row of parsedJsonData) {
        let messageNum: number = row["Message Number"]
        let phone: string = row["Phone Number"]
        let notes: string = row["Message"]
        let time: string = row["Date of Message"]
        let petNum: number = row["# Pets (if PSN/RH)"]
        let species: string = row["Species"]
        let status: string = row["Status"]
        
        // Check if the value of the variables is undefined. If it is, try to assign it to the same value of the key in the dict.
        // If the dict is undefined there too, go ahead and assign undefined. If the old value is not undefined, get the old value to avoid overwritting.
        if (phone == undefined && lineDict[messageNum] != undefined) { phone = lineDict[messageNum].phoneNumber } else { phone = row["Phone Number"] }
        if (notes == undefined && lineDict[messageNum] != undefined) { notes = lineDict[messageNum].notes } else { notes = row["Message"] }
        if (petNum == undefined && lineDict[messageNum] != undefined) { petNum = lineDict[messageNum].numOfPets } else { petNum = row["# Pets (if PSN/RH)"] }
        if (species == undefined && lineDict[messageNum] != undefined) { species = lineDict[messageNum].species } else { species = row["Species"] }
        if (status == undefined && lineDict[messageNum] != undefined) { status = lineDict[messageNum].status } else { status = row["Status"] }
        
        // Check if there are any new lines in notes column. If so, replace them with a space.
        if (notes != undefined) { notes= notes.replaceAll(newLines, " ") }

        // Check if the date is in the format I want (2024-11-21T19:11:21+00:00) and if it is keep it, else try to assign it to the previous timestamp
        if (lineDict[messageNum] == undefined && time.indexOf("+") == -1) { time = ""; console.log("discarded time") }

        // Debugging lines //
        // Also want to check in this spot similar to above lines for the nicely formatted date to parse and include in the Case info below
        // console.log(`messageNum: ${messageNum}, phone num: ${row["Phone Number"]}, typeof: ${typeof row["Phone Number"]}, notes: ${String(row["Message"]).substring(0, 5)}, typeof: ${typeof row["Message"]}`)
        // console.log(`messageNum: ${messageNum}, ${pn}, ${n}`)
        
        lineDict[messageNum] = {
          id: uuidv4(),
          firstName: "",
          lastName: "",
          phoneNumber: phone,
          notes: notes,
          status: status,
          numOfPets: petNum,
          species: species,
          isDeleted: false,
          callDate: Timestamp.fromDate(new Date(time))
        }
      }
      // Debugging lines //
      /* 
      console.log(lineDict[21])
      console.log(lineDict)
      */
      for (let c in lineDict){
        // console.log(`${c}, ${lineDict[c].numOfPets}`)
        thisFile.cases.push(lineDict[c] as Case)
      }

      this.files.push(thisFile) // Push the CaseFile object to this.files so that the index can be used for populating the edit data modal
      console.log('Successfully got XLSX')
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
