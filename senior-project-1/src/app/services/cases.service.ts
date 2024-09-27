import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Case } from '../models/case';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CasesService {
  private apiUrl = 'http://localhost:3000/cases';

  constructor(private httpClient: HttpClient) {}

  getAll(): Observable<Case[]> {
    return this.httpClient.get<Case[]>(this.apiUrl);
  }

  updateCase(caseData: Case): Observable<Case> {
    return this.httpClient.put<Case>(`${this.apiUrl}/${caseData.id}`, caseData);
  }
}
