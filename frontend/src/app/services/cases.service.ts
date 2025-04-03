import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Case } from '../models/case';
import { Observable, from } from 'rxjs';
import { getCases, getCaseById } from './firebaseConnection';
import { createDoc } from './firebaseConnection';
import { updateCase as updateCaseInFirebase } from './firebaseConnection';

@Injectable({
  providedIn: 'root'
})
export class CasesService {
  constructor(private httpClient: HttpClient) {}
  
  async getAll(
    status: string | undefined = undefined,
    specie: string = "",
    timeFrame: string = "",
    offset: number = 0,
    createdStartDate: Date | undefined = undefined,
    createdEndDate: Date | undefined = undefined,
    updatedStartDate: Date | undefined = undefined,
    updatedEndDate: Date | undefined = undefined,
    searchValue: string | undefined = undefined,
    casesDefault: boolean | undefined = undefined,
    deletedCases: boolean | undefined = undefined
  ): Promise<Case[]> {
    return await getCases(
      status, 
      specie, 
      timeFrame, 
      offset, 
      createdStartDate, 
      createdEndDate, 
      updatedStartDate, 
      updatedEndDate,
      searchValue,
      casesDefault, 
      deletedCases
    );
  }

  getOne(caseId: string): Observable<Case | null> {
    // Convert the promise to an Observable
    return from(getCaseById(caseId));
  }

  // Update case method using Firestore
  updateCase(caseData: Case): Observable<void> {
    // Convert the promise to an Observable
    return from(updateCaseInFirebase(caseData));
  }

  //Create a case based off Case data
  async createCase(caseData: Case): Promise<boolean> {
    return await createDoc(caseData);
  }
}
