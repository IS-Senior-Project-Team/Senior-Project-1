import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Case } from '../models/case';
import { Observable } from 'rxjs';
import { UploadResponse } from '../models/UploadResponse';

@Injectable({
  providedIn: 'root'
})
export class UploadsService {
  private apiUrl = 'http://localhost:3000/upload';

  constructor(private httpClient: HttpClient) {}

  postFile(fileToUpload: File): Observable<UploadResponse> {
    const formData: FormData = new FormData();
    formData.append('fileKey', fileToUpload, fileToUpload.name);
    return this.httpClient
      .post<UploadResponse>(this.apiUrl, formData, { headers: {} })
}
    handleError(e: any) {
        throw new Error('Method not implemented.');
    }
}
