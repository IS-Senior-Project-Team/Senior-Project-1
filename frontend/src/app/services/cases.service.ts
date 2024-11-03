import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Case } from '../models/case';
import { Observable } from 'rxjs';
import { getCases } from './firebaseConnection';

@Injectable({
  providedIn: 'root'
})
export class CasesService {
  private apiUrl = 'http://localhost:8002/cases';

  constructor(private httpClient: HttpClient) {}

  async getAll(statusFilter?: string): Promise<Case[]> {
   return await getCases(statusFilter);
  }

  getOne(caseId: string): Observable<Case> {
    return this.httpClient.get<Case>(`${this.apiUrl}/${caseId}`);
  }

  updateCase(caseData: Case): Observable<Case> {
    return this.httpClient.put<Case>(`${this.apiUrl}/${caseData.id}`, caseData);
  }
}
