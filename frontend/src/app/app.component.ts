import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { FormsService } from './services/forms.service';
import { I18nService } from './services/i18n.service';
import { environment } from '../environments/environment';

type AppState = 'idle' | 'validating' | 'creating' | 'success' | 'error';
type WizardStep = 'step1' | 'step2' | 'step3' | 'step4' | 'done';

const STEP_ORDER: WizardStep[] = ['step1', 'step2', 'step3', 'step4', 'done'];

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="hero">
      <h1>{{ i18n.t('appTagline') }}</h1>
      <p class="hero-desc">{{ i18n.t('appDesc') }}</p>
    </section>

    <!-- Progress bar -->
    <nav class="wizard-progress" aria-label="Progresso" *ngIf="currentStep !== 'done'">
      <div class="wp-step" [class.active]="currentStep === 'step1'" [class.done]="isStepDone('step1')">
        <div class="wp-dot">{{ isStepDone('step1') ? '✓' : '1' }}</div>
        <div class="wp-label">{{ i18n.t('wpLabel1') }}</div>
      </div>
      <div class="wp-line" [class.done]="isStepDone('step1')"></div>
      <div class="wp-step" [class.active]="currentStep === 'step2'" [class.done]="isStepDone('step2')">
        <div class="wp-dot">{{ isStepDone('step2') ? '✓' : '2' }}</div>
        <div class="wp-label">{{ i18n.t('wpLabel2') }}</div>
      </div>
      <div class="wp-line" [class.done]="isStepDone('step2')"></div>
      <div class="wp-step" [class.active]="currentStep === 'step3'" [class.done]="isStepDone('step3')">
        <div class="wp-dot">{{ isStepDone('step3') ? '✓' : '3' }}</div>
        <div class="wp-label">{{ i18n.t('wpLabel3') }}</div>
      </div>
      <div class="wp-line" [class.done]="isStepDone('step3')"></div>
      <div class="wp-step" [class.active]="currentStep === 'step4'" [class.done]="isStepDone('step4')">
        <div class="wp-dot">{{ isStepDone('step4') ? '✓' : '4' }}</div>
        <div class="wp-label">{{ i18n.t('wpLabel4') }}</div>
      </div>
    </nav>

    <!-- ═══════════════ STEP 1 ═══════════════ -->
    <div class="step-card" *ngIf="currentStep === 'step1'">
      <p class="step-badge">{{ i18n.t('wizardBadge1') }}</p>
      <h2>{{ i18n.t('wizardStep1Title') }}</h2>
      <p class="step-desc">{{ i18n.t('wizardStep1Desc') }}</p>

      <div class="ai-chat-mockup" aria-hidden="true">
        <div class="chat-titlebar">
          <span class="chat-dot red"></span>
          <span class="chat-dot yellow"></span>
          <span class="chat-dot green"></span>
          <span class="chat-app-name">ChatGPT · Gemini · Claude</span>
        </div>
        <div class="chat-messages">
          <div class="chat-bubble user">{{ i18n.t('chatExUser') }}</div>
          <div class="chat-bubble ai">{{ i18n.t('chatExAi') }}</div>
        </div>
      </div>

      <button type="button" class="help-toggle" (click)="helpExpanded = !helpExpanded">
        {{ helpExpanded ? '▲' : '▼' }} {{ i18n.t('wizardStep1Help') }}
      </button>
      <div class="help-content" *ngIf="helpExpanded">
        <p>{{ i18n.t('wizardStep1HelpPrompt') }}</p>
        <div class="help-example">"{{ i18n.t('wizardStep1HelpExample') }}"</div>
      </div>

      <button type="button" class="btn-primary step-cta" (click)="goNext()">
        {{ i18n.t('wizardStep1Cta') }}
      </button>
    </div>

    <!-- ═══════════════ STEP 2 ═══════════════ -->
    <div class="step-card" *ngIf="currentStep === 'step2'">
      <p class="step-badge">{{ i18n.t('wizardBadge2') }}</p>
      <h2>{{ i18n.t('wizardStep2Title') }}</h2>
      <p class="step-desc">{{ i18n.t('wizardStep2Desc') }}</p>

      <div class="micro-steps" aria-hidden="true">
        <div class="micro-step"><span class="micro-num">1</span>{{ i18n.t('wizardStep2Sub1') }}</div>
        <div class="micro-arrow">→</div>
        <div class="micro-step"><span class="micro-num">2</span>{{ i18n.t('wizardStep2Sub2') }}</div>
        <div class="micro-arrow">→</div>
        <div class="micro-step"><span class="micro-num">3</span>{{ i18n.t('wizardStep2Sub3') }}</div>
        <div class="micro-arrow">→</div>
        <div class="micro-step"><span class="micro-num">4</span>{{ i18n.t('wizardStep2Sub4') }}</div>
      </div>

      <button type="button" class="copy-prompt-btn" (click)="copyPrompt()">
        {{ promptCopied ? i18n.t('copied') : i18n.t('copyPrompt') }}
      </button>

      <div class="actions-row">
        <button type="button" class="btn-ghost" (click)="goBack()">{{ i18n.t('wizardBack') }}</button>
        <button type="button" class="btn-primary step-cta-inline" (click)="goNext()">
          {{ i18n.t('wizardStep2Cta') }}
        </button>
      </div>
    </div>

    <!-- ═══════════════ STEP 3 ═══════════════ -->
    <div class="step-card" *ngIf="currentStep === 'step3'">
      <p class="step-badge">{{ i18n.t('wizardBadge3') }}</p>
      <h2>{{ i18n.t('wizardStep3Title') }}</h2>
      <p class="step-desc">{{ i18n.t('wizardStep3Desc') }}</p>

      <textarea
        [(ngModel)]="dslJson"
        rows="7"
        [placeholder]="i18n.t('wizardStep3Placeholder')"
        [disabled]="isWorking"
        (paste)="onPaste()"
      ></textarea>

      <div class="result result-valid" *ngIf="validationOk">
        <strong>✓ {{ i18n.t('wizardStep3Ok') }}</strong>
      </div>
      <div class="result result-error" *ngIf="errors.length > 0">
        <strong>{{ i18n.t('wizardStep3ErrHint') }}</strong>
        <ul>
          <li *ngFor="let e of errors">{{ e }}</li>
        </ul>
      </div>
      <div class="result result-error" *ngIf="serverError && !errors.length">
        <strong>{{ i18n.t('errorPrefix') }}</strong> {{ serverError }}
      </div>

      <div class="actions-row">
        <button type="button" class="btn-ghost" (click)="goBack()">{{ i18n.t('wizardBack') }}</button>
        <button type="button" (click)="validate()" [disabled]="isWorking || !dslJson.trim()">
          {{ state === 'validating' ? i18n.t('validating') : i18n.t('validate') }}
        </button>
        <button type="button" class="btn-primary step-cta-inline" (click)="goNext()" [disabled]="!validationOk">
          {{ i18n.t('wizardStep3Cta') }}
        </button>
      </div>
    </div>

    <!-- ═══════════════ STEP 4 ═══════════════ -->
    <div class="step-card" *ngIf="currentStep === 'step4'">
      <p class="step-badge">{{ i18n.t('wizardBadge4') }}</p>
      <h2>{{ i18n.t('wizardStep4Title') }}</h2>
      <p class="step-desc">{{ i18n.t('wizardStep4Desc') }}</p>

      <div class="permissions-list">
        <div class="perm-item">
          <span class="perm-icon">📝</span>
          <div>
            <strong>{{ i18n.t('perm1Title') }}</strong>
            <p>{{ i18n.t('perm1Desc') }}</p>
          </div>
        </div>
        <div class="perm-item">
          <span class="perm-icon">👁️</span>
          <div>
            <strong>{{ i18n.t('perm2Title') }}</strong>
            <p>{{ i18n.t('perm2Desc') }}</p>
          </div>
        </div>
      </div>

      <details class="consent-details">
        <summary>⚠️ {{ i18n.t('wizardStep4WarnTitle') }}</summary>
        <div class="google-consent-mockup">
          <div class="consent-header">
            <span class="consent-g">G</span>
            <span class="consent-domain">accounts.google.com</span>
          </div>
          <div class="consent-warning-box">
            <span>⚠️</span>
            <p>{{ i18n.t('consentWarningText') }}</p>
          </div>
          <div class="consent-instruction">
            <p>{{ i18n.t('consentInstructionIntro') }}</p>
            <ol>
              <li>{{ i18n.t('consentStep1') }} <kbd>{{ i18n.t('consentBtn1') }}</kbd></li>
              <li>{{ i18n.t('consentStep2') }} <kbd>{{ i18n.t('consentBtn2') }}</kbd></li>
            </ol>
            <p class="consent-why">{{ i18n.t('consentWhy') }}</p>
          </div>
        </div>
      </details>

      <div class="result result-error" *ngIf="serverError">
        <strong>{{ i18n.t('errorPrefix') }}</strong> {{ serverError }}
      </div>

      <div class="actions-row">
        <button type="button" class="btn-ghost" (click)="goBack()">{{ i18n.t('wizardBack') }}</button>
        <button type="button" class="btn-primary step-cta-inline" (click)="create()" [disabled]="isWorking">
          {{ state === 'creating' ? i18n.t('creating') : i18n.t('wizardStep4Cta') }}
        </button>
      </div>
    </div>

    <!-- ═══════════════ DONE ═══════════════ -->
    <div class="step-card done-card" *ngIf="currentStep === 'done'">
      <span class="done-icon" aria-hidden="true">🎉</span>
      <h2>{{ i18n.t('wizardDone') }}</h2>
      <a [href]="formUrl" target="_blank" rel="noopener noreferrer" class="open-form-btn btn-primary">
        {{ i18n.t('openForm') }}
      </a>
      <button type="button" class="btn-ghost reset-btn" (click)="resetWizard()">
        {{ i18n.t('wizardReset') }}
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 680px;
      margin: 0 auto;
      padding: 1rem 1rem 3rem;
    }

    /* ── Hero ── */
    .hero {
      text-align: center;
      padding: .6rem 0 0;
    }

    .hero h1 {
      font-size: clamp(.95rem, 2.2vw, 1.2rem);
      color: var(--text-secondary);
      margin: 0;
      font-weight: 600;
      letter-spacing: -.01em;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hero-desc {
      display: none;
    }

    /* ── Step card ── */
    .step-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.1rem 1.25rem 1.1rem;
      margin-top: .85rem;
      animation: stepIn 200ms ease;
    }

    @keyframes stepIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .step-badge {
      margin: 0 0 .25rem;
      font-size: .68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .1em;
      color: var(--accent);
    }

    .step-card h2 {
      font-size: clamp(1rem, 2.5vw, 1.2rem);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 .4rem;
      line-height: 1.25;
    }

    .step-desc {
      color: var(--text-secondary);
      font-size: .87rem;
      line-height: 1.55;
      margin: 0 0 .6rem;
    }

    /* ── Buttons ── */
    button {
      padding: .55rem 1.25rem;
      border-radius: 8px;
      font-size: .9rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-primary);
      transition: border-color 120ms, color 120ms, background 120ms;
    }

    button:hover:not([disabled]) {
      border-color: var(--accent);
      color: var(--accent);
    }

    button:disabled {
      opacity: .35;
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

    .btn-ghost {
      border-color: transparent;
      background: transparent;
      color: var(--text-secondary);
      font-size: .85rem;
    }

    .btn-ghost:hover:not([disabled]) {
      border-color: var(--border);
      color: var(--text-primary);
    }

    .step-cta {
      width: 100%;
      padding: .7rem;
      font-size: .95rem;
      margin-top: .85rem;
      border-radius: 10px;
    }

    .actions-row {
      display: flex;
      align-items: center;
      gap: .5rem;
      margin-top: .85rem;
      flex-wrap: wrap;
    }

    .step-cta-inline {
      margin-left: auto;
      padding: .55rem 1.25rem;
    }

    .copy-prompt-btn {
      display: block;
      width: 100%;
      padding: .7rem;
      font-size: .9rem;
      margin: .6rem 0 0;
      border-radius: 10px;
      border-color: var(--accent);
      color: var(--accent);
      text-align: center;
    }

    .copy-prompt-btn:hover:not([disabled]) {
      background: rgba(88, 166, 255, .1);
    }

    /* ── AI chat mockup ── */
    .ai-chat-mockup {
      background: #12171f;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      margin: .6rem 0;
    }

    .chat-titlebar {
      background: #1c2230;
      padding: .35rem .65rem;
      display: flex;
      align-items: center;
      gap: .35rem;
    }

    .chat-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .chat-dot.red    { background: #ff5f57; }
    .chat-dot.yellow { background: #ffbd2e; }
    .chat-dot.green  { background: #28c840; }

    .chat-app-name {
      margin-left: .4rem;
      font-size: .7rem;
      color: var(--text-secondary);
    }

    .chat-messages {
      padding: .6rem;
      display: flex;
      flex-direction: column;
      gap: .4rem;
    }

    .chat-bubble {
      padding: .4rem .75rem;
      border-radius: 12px;
      font-size: .78rem;
      line-height: 1.45;
      max-width: 88%;
      white-space: pre-line;
    }

    .chat-bubble.user {
      background: var(--accent);
      color: #0d1117;
      align-self: flex-end;
      border-bottom-right-radius: 3px;
    }

    .chat-bubble.ai {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text-primary);
      align-self: flex-start;
      border-bottom-left-radius: 3px;
    }

    /* ── Help toggle ── */
    .help-toggle {
      width: 100%;
      text-align: left;
      padding: .38rem .65rem;
      font-size: .78rem;
      font-weight: 500;
      color: var(--text-secondary);
      border: 1px dashed var(--border);
      border-radius: 8px;
      cursor: pointer;
      margin-top: .15rem;
    }

    .help-toggle:hover:not([disabled]) {
      border-color: var(--accent);
      color: var(--text-primary);
    }

    .help-content {
      background: rgba(88, 166, 255, .06);
      border: 1px solid rgba(88, 166, 255, .2);
      border-radius: 8px;
      padding: .75rem 1rem;
      margin-top: .5rem;
      font-size: .85rem;
    }

    .help-content p {
      margin: 0 0 .5rem;
      color: var(--text-secondary);
    }

    .help-example {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: .5rem .75rem;
      font-style: italic;
      color: var(--text-primary);
    }

    /* ── Micro-steps timeline ── */
    .micro-steps {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: .35rem;
      margin: .6rem 0 .25rem;
    }

    .micro-step {
      display: flex;
      align-items: center;
      gap: .4rem;
      background: rgba(88, 166, 255, .07);
      border: 1px solid rgba(88, 166, 255, .2);
      border-radius: 8px;
      padding: .45rem .7rem;
      font-size: .8rem;
      color: var(--text-primary);
    }

    .micro-num {
      width: 20px;
      height: 20px;
      background: var(--accent);
      color: #0d1117;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: .72rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .micro-arrow {
      color: var(--text-secondary);
      font-size: 1rem;
    }

    /* ── Textarea ── */
    textarea {
      width: 100%;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: .82rem;
      background: #0d1117;
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: .85rem 1rem;
      resize: vertical;
      outline: none;
      line-height: 1.6;
    }

    textarea:focus { border-color: var(--accent); }

    textarea:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    /* ── Results ── */
    .result {
      margin-top: .75rem;
      padding: .75rem 1rem;
      border-radius: 8px;
      font-size: .88rem;
    }

    .result-valid {
      border: 1px solid var(--success);
      color: var(--success);
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
      font-size: .84rem;
      margin-top: .2rem;
    }

    /* ── Permissions list ── */
    .permissions-list {
      display: flex;
      flex-direction: column;
      gap: .45rem;
      margin: .6rem 0;
    }

    .perm-item {
      display: flex;
      align-items: flex-start;
      gap: .65rem;
      background: rgba(88, 166, 255, .05);
      border: 1px solid rgba(88, 166, 255, .15);
      border-radius: 10px;
      padding: .6rem .85rem;
    }

    .perm-icon {
      font-size: 1.3rem;
      flex-shrink: 0;
      margin-top: .05rem;
    }

    .perm-item strong {
      display: block;
      font-size: .88rem;
      color: var(--text-primary);
      margin-bottom: .15rem;
    }

    .perm-item p {
      margin: 0;
      font-size: .8rem;
      color: var(--text-secondary);
    }

    /* ── Google consent details ── */
    .consent-details {
      margin: .5rem 0;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }

    .consent-details summary {
      cursor: pointer;
      padding: .7rem 1rem;
      font-size: .85rem;
      color: var(--accent);
      user-select: none;
      list-style: none;
    }

    .consent-details summary::-webkit-details-marker { display: none; }

    .consent-details summary:hover {
      background: rgba(88, 166, 255, .05);
    }

    .consent-details[open] summary {
      border-bottom: 1px solid var(--border);
    }

    .google-consent-mockup {
      background: #ffffff;
      color: #202124;
      padding: 1.1rem 1.25rem;
      font-size: .85rem;
    }

    .consent-header {
      display: flex;
      align-items: center;
      gap: .5rem;
      margin-bottom: .9rem;
      font-size: .75rem;
      color: #5f6368;
    }

    .consent-g {
      width: 22px;
      height: 22px;
      background: #4285f4;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: .8rem;
      flex-shrink: 0;
    }

    .consent-domain { color: #1a73e8; }

    .consent-warning-box {
      background: #fef7e0;
      border: 1px solid #f0ad4e;
      border-radius: 6px;
      padding: .65rem .85rem;
      display: flex;
      align-items: flex-start;
      gap: .5rem;
      margin-bottom: .85rem;
      color: #333;
    }

    .consent-warning-box p { margin: 0; font-weight: 600; }

    .consent-instruction ol {
      margin: .4rem 0 .5rem;
      padding-left: 1.3rem;
    }

    .consent-instruction li { margin: .3rem 0; }

    kbd {
      background: #f1f3f4;
      border: 1px solid #dadce0;
      border-radius: 4px;
      padding: .1rem .4rem;
      font-family: monospace;
      font-size: .8rem;
    }

    .consent-why {
      font-size: .75rem;
      color: #5f6368;
      margin: .6rem 0 0;
      padding-top: .6rem;
      border-top: 1px solid #e8eaed;
    }

    /* ── Done state ── */
    .done-card {
      text-align: center;
      padding: 3rem 2rem 2.5rem;
    }

    .done-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      display: block;
    }

    .done-card h2 {
      font-size: 1.6rem;
      margin-bottom: 1.5rem;
    }

    .open-form-btn {
      display: inline-block;
      text-decoration: none;
      padding: .85rem 2rem;
      font-size: 1rem;
      border-radius: 10px;
      margin-bottom: .75rem;
    }

    .reset-btn {
      display: block;
      margin: .25rem auto 0;
    }

    /* ── Responsive ── */
    @media (max-width: 480px) {
      .step-card { padding: 1.25rem; }
      .micro-steps { gap: .3rem; }
      .micro-arrow { display: none; }
      .micro-step { font-size: .75rem; }
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
  currentStep: WizardStep = 'step1';
  helpExpanded = false;

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
      "media?":{"type":"image"|"video","url":"str"},
      "metadata?":{"topic?":"str","difficulty?":"easy"|"medium"|"hard"}
    }]
  }]
}

Rules: pages sequential only; options required for multiple_choice/checkbox/dropdown; correctAnswer+score quiz-only; all ids unique. Minify the JSON (no spaces, no newlines). Output ONLY the minified JSON string.`;

  get isWorking(): boolean {
    return this.state === 'validating' || this.state === 'creating';
  }

  isStepDone(step: WizardStep): boolean {
    return STEP_ORDER.indexOf(this.currentStep) > STEP_ORDER.indexOf(step);
  }

  constructor(
    private readonly formsService: FormsService,
    readonly i18n: I18nService,
    private readonly title: Title,
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Formulino – Crea Google Form con il tuo assistente AI');
    const pending = sessionStorage.getItem('pending_dsl');
    if (pending) {
      this.dslJson = pending;
      sessionStorage.removeItem('pending_dsl');
      this.currentStep = 'step3';
      this.validate();
    }
  }

  private parseDsl(): unknown | null {
    let cleaned = this.dslJson.trim();
    // Strip markdown code fences: ```json ... ``` or ``` ... ```
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    try {
      return JSON.parse(cleaned);
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
        this.currentStep = 'done';
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

  goNext(): void {
    const idx = STEP_ORDER.indexOf(this.currentStep);
    // step1(0)→step2(1)→step3(2): navigable; step4(3) reached only via create()
    if (idx >= 0 && idx < 3) {
      this.currentStep = STEP_ORDER[idx + 1];
    }
  }

  goBack(): void {
    const idx = STEP_ORDER.indexOf(this.currentStep);
    if (idx > 0) {
      this.currentStep = STEP_ORDER[idx - 1];
    }
  }

  resetWizard(): void {
    this.currentStep = 'step1';
    this.dslJson = '';
    this.helpExpanded = false;
    this.reset();
  }

  private reset(): void {
    this.errors = [];
    this.validationOk = false;
    this.formUrl = '';
    this.serverError = '';
    this.state = 'idle';
  }
}
