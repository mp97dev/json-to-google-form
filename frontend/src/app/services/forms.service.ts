import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface CreateFormResult {
  formId: string;
  formUrl: string;
}

@Injectable({ providedIn: 'root' })
export class FormsService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  validate(payload: unknown): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(`${this.base}/forms/validate`, payload);
  }

  createForm(payload: unknown, accessToken: string): Observable<CreateFormResult> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${accessToken}` });
    return this.http.post<CreateFormResult>(`${this.base}/forms/create`, payload, { headers });
  }
}
