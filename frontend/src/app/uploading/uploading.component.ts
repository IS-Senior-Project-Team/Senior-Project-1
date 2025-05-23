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

  // Here, files to upload are just what are just to temp store the files before they are parsed,
  // files are the CaseFiles (Object that stores the name of the file and the cases that came from it) that will be uploaded
  // species and statuses here are used by the HTML to fill out the dropdowns, and other info is used to keep track of which file is being handled
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
  phoneShape = /[0-9]{10}/;
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
        // Debugging line
        /* console.log(`outcomeColumn: ${outcomeColumn}, Outcome: ${data[row][outcomeColumn]}`) */
        if (data[row][currentColumn] == "Outcome" && outcomeColumnFound == false) { outcomeColumn = currentColumn + 3; outcomeColumnFound = true; }
        if (data[row][currentColumn] == "Animal Type" && speciesColumnFound == false) { speciesColumn = currentColumn + 3; speciesColumnFound = true; }
        if (data[row][currentColumn] == "Notes" && notesColumnFound == false) { notesColumn = currentColumn + 3; notesColumnFound = true; }
        if (data[row][currentColumn] == "# of Pets" && numOfPetsColumnFound == false) { numOfPetsColumn = currentColumn + 3; numOfPetsColumnFound = true; }

        if (outcomeColumnFound && speciesColumnFound && notesColumnFound && numOfPetsColumnFound) { columnsFound = true }
        if (columnsFound) { break }
      }
      if (columnsFound) { break }
    }

    let missingImportantValue: boolean = false

    for(let row = 1; row < returnable.data.length-1; row++){
      // Get the initial value of the phone number, and ignore the first "1"
      let phoneNum: string = data[row][4].trim().substring(1)

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

      // Skip adding a completely empty CASE to the case list (to avoid uploading an empty case)
      if (this.isEmptyCase(c)) { continue }

      // If important missing VALUES are not already found in the case set and there are some found missing, set the variable here...
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
      // as well as the cases in that file to be pushed to the global variable so that it can be seen and edited in the UI
      const thisFile: CaseFile = {name: file.name, cases: []}
      
      // Variable that contains all of the JSON data from the XLSX file
      const parsedJsonData = JSON.parse(JSON.stringify(jsonData))

      // Dictionary to house all of the objects to be converted to Cases.
      // As it is added to, it safely manages the lines from parsedJsonData such that all messages are grouped and keyed by message numbers
      let lineDict: {[messageNumber: number]: Case} = {}

      // Regular Expressions for cleaning data
      let newLines = /[\r\n]+/gm
      let notNumbers = /\D/g
      
      // Loops through all lines in parsedJsonData, collects data from the rows and groups them into lineDict based on message number
      for(let row of parsedJsonData) {

        // Detect if the header of the file is intact (date always* exists correctly formatted). Exits the parseXLSX function gracefully
        if (row["__EMPTY"] != undefined) 
          {this.toast.warning("There was an error reading the file. Please confirm the header is intact."); return }

        // Gets the message number of the current row (Should always exist)
        let messageNum: number = row["Message Number"]

        // Create the instance of the case in the lineDict dictionary so we can start editing the values
        // and setting default values to something clean and readable for users (and system) in the upload 
        // case edit modal, in the case the dropdown supports it, and to avoid errors uploading to Firebase
        if (lineDict[messageNum] == undefined) {
          lineDict[messageNum] = {
            id: uuidv4(),
            firstName: "",
            lastName: "",
            phoneNumber: "",
            notes: "",
            status: "",
            numOfPets: 1,
            species: "Unknown",
            isDeleted: false,
            callDate: new Date().toISOString()
          }
        }

        let phone, notes, species, status: string = ""
        let petNum: number = 1
        let time: Timestamp | string = ""
        
        phone = row["Phone Number"]
        notes = row["Message"]
        petNum = row["# Pets (if PSN/RH)"]
        species = row["Species"]
        status = row["Status"]
        time = row["Date of Message"]

        // Check if the value of the variables are undefined. If it is, try to assign it to the same value of the key in the dict.
        // If the dict is undefined there too, go ahead and assign undefined. If the old value is not undefined, get the old value to avoid overwritting.


        // Get time in the format I want based on content of the line
        // If that line does not exist (or the line is not the one I want) set time to what was gathered last or blank if nothing can be found
        if (phone == undefined) { 
          try {
            time = new Date(row["Date of Message"]).toISOString()
          } catch (error) {
            console.error("Unable to read Date string")
            console.log(error)
            time = lineDict[messageNum].callDate ?? ""
          }
        }
        else { time = lineDict[messageNum].callDate ?? "" }


        // Execute a phone number checker to grab just numbers from the phone number in the case the value in the phone number section is something other than a clean number
        if (phone != undefined) {
          phone = String(phone).replace(notNumbers, "").trim()
          if (this.phoneShape.exec(phone) === null) { 
            this.toast.warning("Some phone numbers were not correct in the file. Please confirm.")
          }
        } else {
          phone = lineDict[messageNum].phoneNumber
        }

        if (notes == undefined) { notes = lineDict[messageNum].notes }
        if (species == undefined) { species = lineDict[messageNum].species }
        if (status == undefined) { status = lineDict[messageNum].status }
        if (petNum == undefined) { petNum = lineDict[messageNum].numOfPets }
        
        
        // Check if there are any new lines in notes column. If so, replace them with a space.
        if (notes != undefined) { notes = String(notes).replaceAll(newLines, " ") }
        
        
        // Debugging lines //
        // Also want to check in this spot similar to above lines for the nicely formatted date to parse and include in the Case info below
        // console.log(`messageNum: ${messageNum}, phone num: ${row["Phone Number"]}, typeof: ${typeof row["Phone Number"]}, notes: ${String(row["Message"]).substring(0, 5)}, typeof: ${typeof row["Message"]}`)
        // console.log(`messageNum: ${messageNum}, ${pn}, ${n}`)
        
        // "Dog", "Cat", "Small Dog", "Small Cat" set to Adult Dog, Adult Cat, Puppy and Kitten respectively based on discussion with Lauren.
        // This is to keep it consistent between both WaitWhile and Excel file inputs
        switch(species){
          case "Dog":
            species = "Adult Dog"
            break
          case "Small Dog":
            species = "Puppy"
            break
          case "Cat":
            species = "Adult Cat"
            break
          case "Small Cat":
            species = "Kitten"
            break
        }

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
          callDate: time // maybe (typeof time === "string") ? "" : ""    or    new Timestamp(Number(time), 0) if just time doesnt work
        }
      }
      // Debugging lines //
      /* 
      console.log(lineDict[21])
      console.log(lineDict)
      */
     for (let c in lineDict){
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
    this.filesToUpload = []

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
   * Checks that all phone numbers in the files are valid (or at least blank)
   * @returns Boolean confirming that all checked fields are valid. 
   */
  allCasesValid(): boolean {
    let allCasesValid: boolean = true

    // If there are any fields that are required to be filled, it would be checked here
    this.files.forEach(caseFile => {
      caseFile.cases.forEach(c => {
        if (!allCasesValid) { return }
        if (c.phoneNumber != "" && this.phoneShape.exec(c.phoneNumber) == null) { allCasesValid = false }
      });
    })
    
    if (allCasesValid) { return true } else { return false }
  }

  /**
   * Uploads the files listed in files array. 
   * @returns Boolean representing if the upload was successful.
   */
  async upload(): Promise<boolean> {
    // Checks that the lists are not empty
    if (this.files.length == 0 || this.filesToUpload.length == 0) { return false }
    
    // Loop through each CaseFile that is being stored in "files" and upload all of the cases and upload them using firebaseConnection
    if (!this.allCasesValid()) { this.toast.error("Please confirm all fields have properly formatted information. (e.g. Phone number is only numbers)"); return false }

    let errorLevel: boolean;
    this.files.forEach(caseFile => { 
      caseFile.cases.forEach(async uploadCase => {
        // Change the format of the phone number right before uploading so that other parts of the project do not break
        if (uploadCase.phoneNumber != undefined && this.phoneShape.exec(uploadCase.phoneNumber) != null) 
          { uploadCase.phoneNumber = uploadCase.phoneNumber.substring(0, 3) + "-" + uploadCase.phoneNumber.substring(3, 6) + "-" + uploadCase.phoneNumber.substring(6) }
        else { uploadCase.phoneNumber = "" }
          
        // True is good here
        errorLevel = await this.caseService.createCase(uploadCase)
        if (!errorLevel) { console.log(uploadCase); return errorLevel }
        return true
      })
    })

    // Clear the upload queue
    this.filesToUpload = []
    this.files = []

    // Alert the user that the upload was succesful
    this.toast.success("File(s) uploaded! Find it in the \"Cases\" tab.")

    // Signify that all Cases were uploaded successfully
    return true
  }

  /**
   * Remove the file or files from the list of files to be uploaded.
   * @param index The location of the file to be removed.
   * @param showPrompt Boolean to determine if the confirmation prompt is shown, or if the file removal is automated.
   */
  removeFile(index: number, showPrompt: boolean = true) {
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
