import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Case } from '../models/case';
import { Observable, from } from 'rxjs';
import { getCases } from './firebaseConnection';
import { getCaseById } from './firebaseConnection';
import { updateCase as updateCaseInFirebase } from './firebaseConnection';

@Injectable({
  providedIn: 'root'
})
export class CasesService {
  constructor(private httpClient: HttpClient) {}

  async getAll(statusFilter: string = ""): Promise<Case[]> {
   return await getCases(statusFilter);
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
}
