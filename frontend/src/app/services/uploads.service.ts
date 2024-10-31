import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UploadResponse } from '../models/UploadResponse';

@Injectable({
  providedIn: 'root'
})
export class UploadsService {
  private apiUrl = 'http://localhost:3000/upload';

  constructor(private httpClient: HttpClient) {}

  postFiles(filesToUpload: File[]): Observable<UploadResponse> {
    const formData: FormData = new FormData();
    filesToUpload.forEach(file => {
      // console.log(file)
      formData.append('files', file, file.name);
    });

    return this.httpClient.post<UploadResponse>(this.apiUrl, formData);
  }
}