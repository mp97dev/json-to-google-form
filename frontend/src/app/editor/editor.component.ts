import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsService } from '../services/forms.service';

type AppState = 'idle' | 'validating' | 'creating' | 'success' | 'error';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="editor-shell">
      <section class="editor-card">
        <h1>Form Editor</h1>
        <p class="hint">Paste your JSON DSL below, then validate or create your Google Form.</p>

        <textarea
          [(ngModel)]="dslJson"
          rows="18"
          placeholder='{ "id": "form-1", "title": "...", ... }'
          [disabled]="state === 'validating' || state === 'creating'"
        ></textarea>

        <div class="actions">
          <button type="button" (click)="validate()" [disabled]="isWorking">
            {{ state === 'validating' ? 'Validating…' : 'Validate' }}
          </button>
          <button type="button" class="primary" (click)="create()" [disabled]="isWorking">
            {{ state === 'creating' ? 'Creating…' : 'Create Form' }}
          </button>
        </div>

        <div class="result valid" *ngIf="validationOk">
          <strong>✓ Valid DSL</strong>
        </div>

        <div class="result error" *ngIf="errors.length > 0">
          <strong>Validation errors:</strong>
          <ul>
            <li *ngFor="let e of errors">{{ e }}</li>
          </ul>
        </div>

        <div class="result success" *ngIf="formUrl">
          <strong>Form created!</strong>
          <a [href]="formUrl" target="_blank" rel="noopener noreferrer">Open Google Form ↗</a>
        </div>

        <div class="result error" *ngIf="serverError">
          <strong>Error:</strong> {{ serverError }}
        </div>
      </section>
    </main>
  `,
  styles: [`
    .editor-shell {
      min-height: 100vh;
      display: grid;
      place-items: start center;
      padding: 2rem 1rem;
      background: linear-gradient(180deg, #f8fbff 0%, #eef5f3 100%);
    }
    .editor-card {
      width: min(720px, 100%);
      background: #fff;
      border-radius: 16px;
      border: 1px solid #dbe6e2;
      padding: 2rem;
      box-shadow: 0 8px 32px rgba(16,24,40,.07);
    }
    h1 { margin: 0 0 .5rem; font-size: 1.5rem; }
    .hint { color: #666; margin: 0 0 1.25rem; font-size: .9rem; }
    textarea {
      width: 100%;
      font-family: monospace;
      font-size: .85rem;
      border: 1px solid #ccd8d4;
      border-radius: 8px;
      padding: .75rem;
      resize: vertical;
      box-sizing: border-box;
    }
    .actions { display: flex; gap: .75rem; margin-top: 1rem; }
    button {
      padding: .6rem 1.4rem;
      border-radius: 8px;
      border: 1px solid #ccd8d4;
      background: #f4f7f6;
      cursor: pointer;
      font-size: .9rem;
    }
    button.primary { background: #0f62fe; color: #fff; border-color: #0f62fe; }
    button[disabled] { opacity: .5; cursor: not-allowed; }
    .result { margin-top: 1rem; padding: .75rem 1rem; border-radius: 8px; }
    .result.valid { background: #e6f4ea; border: 1px solid #a8d5b5; color: #1e6b3a; }
    .result.success { background: #e8f0fe; border: 1px solid #a8bbf5; color: #1a3a7a; }
    .result.success a { color: #1a3a7a; font-weight: 600; }
    .result.error { background: #fdecea; border: 1px solid #f5b8b4; color: #7a1a1a; }
    ul { margin: .5rem 0 0; padding-left: 1.2rem; }
    li { font-size: .85rem; }
  `],
})
export class EditorComponent {
  dslJson = '';
  state: AppState = 'idle';
  errors: string[] = [];
  validationOk = false;
  formUrl = '';
  serverError = '';

  get isWorking(): boolean {
    return this.state === 'validating' || this.state === 'creating';
  }

  constructor(private readonly formsService: FormsService) {}

  private parseDsl(): unknown | null {
    try {
      return JSON.parse(this.dslJson);
    } catch {
      this.errors = ['Invalid JSON syntax'];
      this.state = 'error';
      return null;
    }
  }

  validate(): void {
    this.reset();
    const payload = this.parseDsl();
    if (!payload) return;

    this.state = 'validating';
    this.formsService.validate(payload).subscribe({
      next: (res) => {
        this.state = 'idle';
        if (res.valid) {
          this.validationOk = true;
        } else {
          this.errors = res.errors;
        }
      },
      error: (err) => {
        this.state = 'error';
        this.serverError = err?.message ?? 'Validation request failed';
      },
    });
  }

  create(): void {
    this.reset();
    const payload = this.parseDsl();
    if (!payload) return;

    const token = sessionStorage.getItem('access_token');
    if (!token) {
      this.state = 'error';
      this.serverError = 'Not authenticated. Please login first.';
      return;
    }

    this.state = 'creating';
    this.formsService.createForm(payload, token).subscribe({
      next: (res) => {
        this.state = 'success';
        this.formUrl = res.formUrl;
      },
      error: (err) => {
        this.state = 'error';
        this.serverError = err?.error?.message ?? err?.message ?? 'Form creation failed';
      },
    });
  }

  private reset(): void {
    this.errors = [];
    this.validationOk = false;
    this.formUrl = '';
    this.serverError = '';
    this.state = 'idle';
  }
}
