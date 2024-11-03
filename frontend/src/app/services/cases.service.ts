import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Case } from '../models/case';
import { Observable } from 'rxjs';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, Firestore, doc, setDoc, addDoc } from 'firebase/firestore';
import firebase from "firebase/compat/app";
import { firebaseConfig } from "../../../../firebase_secrets"
// Required for side-effects
import "firebase/firestore";
// Follow this pattern to import other Firebase services
// import { } from 'firebase/<service>';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
@Injectable({
  providedIn: 'root'
})
export class CasesService {
  private apiUrl = 'http://localhost:3000/cases';

  constructor(private httpClient: HttpClient) {}

  async getAll(statusFilter?: string): Promise<Case[]> {
    const casesCol = collection(db, 'cases');
    const casesSnapshot = await getDocs(casesCol);
    const casesList: Case[] = casesSnapshot.docs.map(doc => doc.data() as Case);
    if (statusFilter) {
      return casesList.filter(caseItem => caseItem.status === statusFilter);
    }
    return casesList;
  }

  updateCase(caseData: Case): Observable<Case> {
    return this.httpClient.put<Case>(`${this.apiUrl}/${caseData.id}`, caseData);
  }
}
