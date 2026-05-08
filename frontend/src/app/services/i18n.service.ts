import { Injectable, signal } from '@angular/core';

export type Lang = 'it' | 'en';

const STRINGS = {
  it: {
    appTagline: 'Crea Google Form da JSON con AI',
    appDesc: 'Incolla il JSON generato da un AI assistant e trasformalo in un Google Form in secondi.',
    guideTitle: 'Come usare questa app',
    step1Title: 'Chiedi al tuo AI assistant',
    step1Desc: 'Descrivi il form o quiz che vuoi creare — argomento, numero di domande, tipologia, modalità (sondaggio o quiz).',
    step2Title: 'Copia il prompt JSON',
    step2Desc: 'Clicca il pulsante qui sotto, poi incollalo nella chat del tuo AI per ricevere un JSON valido.',
    step3Title: 'Incolla il JSON',
    step3Desc: "Copia il JSON che ti restituisce l'AI e incollalo nell'editor qui sotto — la validazione avviene automaticamente.",
    step4Title: 'Genera il form',
    step4Desc: 'Controlla eventuali errori, correggili se necessario, poi clicca Crea Form (richiede accesso Google).',
    copyPrompt: 'Copia Prompt LLM',
    copied: 'Copiato!',
    placeholder: '{\n  "id": "form-1",\n  "title": "Il mio form",\n  ...\n}',
    validate: 'Valida JSON',
    validating: 'Validazione…',
    createForm: 'Crea Form',
    creating: 'Creazione…',
    validDsl: 'JSON Valido',
    validationErrors: 'Errori di validazione:',
    formCreated: 'Form creato!',
    openForm: 'Apri Google Form ↗',
    notAuth: 'Accesso Google richiesto. Verrai reindirizzato…',
    errorPrefix: 'Errore:',
    invalidJson: 'Sintassi JSON non valida',
  },
  en: {
    appTagline: 'Build Google Forms from JSON with AI',
    appDesc: 'Paste AI-generated JSON and turn it into a Google Form in seconds.',
    guideTitle: 'How to use this app',
    step1Title: 'Chat with your AI assistant',
    step1Desc: 'Describe the form or quiz you need — topic, number of questions, type, mode (survey or quiz).',
    step2Title: 'Copy the JSON prompt',
    step2Desc: 'Click the button below, then paste it into your AI chat to get a valid JSON response.',
    step3Title: 'Paste the JSON',
    step3Desc: 'Copy the JSON the AI returns and paste it into the editor below — validation happens automatically.',
    step4Title: 'Generate your form',
    step4Desc: 'Review any validation errors, fix them if needed, then click Create Form (requires Google login).',
    copyPrompt: 'Copy LLM Prompt',
    copied: 'Copied!',
    placeholder: '{\n  "id": "form-1",\n  "title": "My form",\n  ...\n}',
    validate: 'Validate JSON',
    validating: 'Validating…',
    createForm: 'Create Form',
    creating: 'Creating…',
    validDsl: 'Valid JSON',
    validationErrors: 'Validation errors:',
    formCreated: 'Form created!',
    openForm: 'Open Google Form ↗',
    notAuth: 'Google login required. Redirecting…',
    errorPrefix: 'Error:',
    invalidJson: 'Invalid JSON syntax',
  },
} as const;

export type StringKey = keyof typeof STRINGS.it;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _lang = signal<Lang>(
    (() => {
      try {
        return (localStorage.getItem('lang') as Lang | null) ?? 'it';
      } catch {
        return 'it';
      }
    })(),
  );

  readonly lang = this._lang.asReadonly();

  t(key: StringKey): string {
    return STRINGS[this._lang()][key];
  }

  toggle(): void {
    const next: Lang = this._lang() === 'it' ? 'en' : 'it';
    try {
      localStorage.setItem('lang', next);
    } catch {
      // private browsing — ignore
    }
    this._lang.set(next);
  }
}
