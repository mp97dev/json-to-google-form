import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormsService } from './services/forms.service';
import { I18nService } from './services/i18n.service';
import { environment } from '../environments/environment';

type AppState = 'idle' | 'validating' | 'creating' | 'success' | 'error';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="hero">
      <h1>{{ i18n.t('appTagline') }}</h1>
      <p class="hero-desc">{{ i18n.t('appDesc') }}</p>
    </section>

    <section class="guide">
      <p class="guide-title">{{ i18n.t('guideTitle') }}</p>
      <ol class="guide-steps">
        <li>
          <strong>① {{ i18n.t('step1Title') }}</strong>
          <span>{{ i18n.t('step1Desc') }}</span>
        </li>
        <li>
          <strong>② {{ i18n.t('step2Title') }}</strong>
          <span>{{ i18n.t('step2Desc') }}</span>
          <button type="button" class="btn-secondary" (click)="copyPrompt()">
            {{ promptCopied ? i18n.t('copied') : i18n.t('copyPrompt') }}
          </button>
        </li>
        <li>
          <strong>③ {{ i18n.t('step3Title') }}</strong>
          <span>{{ i18n.t('step3Desc') }}</span>
        </li>
        <li>
          <strong>④ {{ i18n.t('step4Title') }}</strong>
          <span>{{ i18n.t('step4Desc') }}</span>
        </li>
      </ol>
    </section>

    <section class="editor-section">
      <textarea
        [(ngModel)]="dslJson"
        rows="16"
        [placeholder]="i18n.t('placeholder')"
        [disabled]="isWorking"
        (paste)="onPaste()"
      ></textarea>

      <div class="actions">
        <button type="button" (click)="validate()" [disabled]="isWorking">
          {{ state === 'validating' ? i18n.t('validating') : i18n.t('validate') }}
        </button>
        <button type="button" class="btn-primary" (click)="create()" [disabled]="isWorking">
          {{ state === 'creating' ? i18n.t('creating') : i18n.t('createForm') }}
        </button>
      </div>

      <div class="result result-valid" *ngIf="validationOk">
        <strong>✓ {{ i18n.t('validDsl') }}</strong>
      </div>

      <div class="result result-error" *ngIf="errors.length > 0">
        <strong>{{ i18n.t('validationErrors') }}</strong>
        <ul>
          <li *ngFor="let e of errors">{{ e }}</li>
        </ul>
      </div>

      <div class="result result-success" *ngIf="formUrl">
        <strong>{{ i18n.t('formCreated') }}</strong>
        <a [href]="formUrl" target="_blank" rel="noopener noreferrer">{{ i18n.t('openForm') }}</a>
      </div>

      <div class="result result-error" *ngIf="serverError">
        <strong>{{ i18n.t('errorPrefix') }}</strong> {{ serverError }}
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 760px;
      margin: 0 auto;
      padding: 2rem 1rem 4rem;
    }

    .hero {
      text-align: center;
      padding: 2.5rem 0 1.5rem;
    }

    .hero h1 {
      font-size: clamp(1.6rem, 4vw, 2.4rem);
      color: var(--text-primary);
      margin: 0 0 .75rem;
      font-weight: 700;
      letter-spacing: -.02em;
      line-height: 1.15;
    }

    .hero-desc {
      color: var(--text-secondary);
      font-size: 1rem;
      margin: 0;
      line-height: 1.6;
    }

    .guide {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      margin: 2rem 0 1.5rem;
    }

    .guide-title {
      margin: 0 0 1rem;
      font-size: .75rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    .guide-steps {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .guide-steps li strong {
      display: block;
      color: var(--text-primary);
      margin-bottom: .2rem;
      font-size: .9rem;
    }

    .guide-steps li span {
      display: block;
      color: var(--text-secondary);
      font-size: .85rem;
      line-height: 1.55;
    }

    .editor-section {
      margin-top: .5rem;
    }

    textarea {
      width: 100%;
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: .85rem;
      background: var(--surface);
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: .9rem 1rem;
      resize: vertical;
      outline: none;
      line-height: 1.6;
    }

    textarea:focus {
      border-color: var(--accent);
    }

    textarea:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    .actions {
      display: flex;
      gap: .75rem;
      margin: .9rem 0;
    }

    button {
      padding: .55rem 1.35rem;
      border-radius: 6px;
      font-size: .9rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-primary);
      transition: border-color 100ms, color 100ms;
    }

    button:hover:not([disabled]) {
      border-color: var(--accent);
      color: var(--accent);
    }

    button:disabled {
      opacity: .4;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--accent);
      color: #0d1117;
      border-color: var(--accent);
      font-weight: 700;
    }

    .btn-primary:hover:not([disabled]) {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
      color: #0d1117;
    }

    .btn-secondary {
      margin-top: .45rem;
      padding: .28rem .85rem;
      font-size: .8rem;
      border-color: var(--accent);
      color: var(--accent);
    }

    .btn-secondary:hover:not([disabled]) {
      background: rgba(88, 166, 255, .1);
      border-color: var(--accent-hover);
      color: var(--accent-hover);
    }

    .result {
      margin-top: .75rem;
      padding: .7rem 1rem;
      border-radius: 6px;
      font-size: .88rem;
    }

    .result-valid {
      border: 1px solid var(--success);
      color: var(--success);
    }

    .result-success {
      border: 1px solid var(--accent);
      color: var(--text-primary);
    }

    .result-success a {
      color: var(--accent);
      font-weight: 600;
    }

    .result-error {
      border: 1px solid var(--error);
      color: var(--error);
    }

    ul {
      margin: .4rem 0 0;
      padding-left: 1.2rem;
    }

    li {
      font-size: .85rem;
      margin-top: .2rem;
    }
  `],
})
export class AppComponent implements OnInit {
  dslJson = '';
  state: AppState = 'idle';
  errors: string[] = [];
  validationOk = false;
  formUrl = '';
  serverError = '';
  promptCopied = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly LLM_PROMPT = `Output ONLY raw JSON — no markdown, no explanation. Schema (? = optional):

{
  "id":"str","title":"str","description":"str",
  "mode":"form"|"quiz",
  "settings":{"collectEmails":bool,"limitOneResponse":bool,"shuffleQuestions":bool},
  "pages":[{
    "id":"str","title":"str",
    "questions":[{
      "id":"str",
      "type":"text"|"multiple_choice"|"checkbox"|"dropdown"|"true_false"|"short_answer",
      "title":"str","required":bool,
      "options?":["str"],
      "correctAnswer?":"str","score?":1,
      "media?":{"type":"image"|"video"|"audio","url":"str"},
      "metadata?":{"topic?":"str","difficulty?":"easy"|"medium"|"hard"}
    }]
  }]
}

Rules: pages sequential only; options required for multiple_choice/checkbox/dropdown; correctAnswer+score quiz-only; all ids unique. Output complete JSON now.`;

  get isWorking(): boolean {
    return this.state === 'validating' || this.state === 'creating';
  }

  constructor(
    private readonly formsService: FormsService,
    readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    const pending = sessionStorage.getItem('pending_dsl');
    if (pending) {
      this.dslJson = pending;
      sessionStorage.removeItem('pending_dsl');
      this.validate();
    }
  }

  private parseDsl(): unknown | null {
    try {
      return JSON.parse(this.dslJson);
    } catch {
      this.errors = [this.i18n.t('invalidJson')];
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
      sessionStorage.setItem('pending_dsl', this.dslJson);
      window.location.href = `${environment.apiBaseUrl}/auth/google/login`;
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

  copyPrompt(): void {
    navigator.clipboard.writeText(this.LLM_PROMPT).then(() => {
      this.promptCopied = true;
      setTimeout(() => { this.promptCopied = false; }, 2000);
    });
  }

  onPaste(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.validate(), 500);
  }

  private reset(): void {
    this.errors = [];
    this.validationOk = false;
    this.formUrl = '';
    this.serverError = '';
    this.state = 'idle';
  }
}
