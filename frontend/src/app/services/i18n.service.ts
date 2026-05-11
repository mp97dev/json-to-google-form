import { Injectable, signal } from '@angular/core';

export type Lang = 'it' | 'en';

const STRINGS = {
  it: {
    appTagline: 'Crea Google Form dalla tua conversazione AI',
    appDesc: 'Descrivi il form al tuo assistente AI (ChatGPT, Claude, Gemini), incolla la risposta e il tuo Google Form è pronto in secondi.',
    guideTitle: 'Come usare questa app',
    step1Title: 'Chiedi al tuo assistente AI',
    step1Desc: 'Descrivi il form o quiz che vuoi creare — argomento, numero di domande, tipologia, modalità (sondaggio o quiz).',
    step2Title: 'Ottieni il prompt per il tuo AI',
    step2Desc: 'Clicca il pulsante qui sotto per copiare il prompt, poi incollalo nella chat del tuo assistente AI preferito.',
    step3Title: 'Incolla la risposta',
    step3Desc: "Copia la risposta del tuo assistente AI e incollala nell'editor qui sotto — Formulino la controlla automaticamente.",
    step4Title: 'Genera il form',
    step4Desc: 'Controlla eventuali errori, correggili se necessario, poi clicca Crea Form (richiede accesso Google).',
    copyPrompt: 'Copia il prompt AI',
    copied: 'Copiato!',
    placeholder: '{\n  "id": "form-1",\n  "title": "Il mio form",\n  ...\n}',
    validate: 'Verifica',
    validating: 'Verifica in corso…',
    createForm: 'Crea Form',
    creating: 'Creazione…',
    validDsl: 'Risposta riconosciuta ✓',
    validationErrors: 'Errori da correggere:',
    formCreated: 'Form creato!',
    openForm: 'Apri Google Form ↗',
    notAuth: 'Accesso Google richiesto. Verrai reindirizzato…',
    errorPrefix: 'Errore:',
    invalidJson: 'Formato non riconosciuto',
  },
  en: {
    appTagline: 'Build Google Forms from your AI conversation',
    appDesc: 'Describe your form to your AI assistant (ChatGPT, Claude, Gemini), paste the response into Formulino, and your Google Form is ready in seconds.',
    guideTitle: 'How to use this app',
    step1Title: 'Chat with your AI assistant',
    step1Desc: 'Describe the form or quiz you need — topic, number of questions, type, mode (survey or quiz).',
    step2Title: 'Get the AI prompt',
    step2Desc: 'Click the button below to copy the prompt, then paste it into your favourite AI assistant.',
    step3Title: 'Paste the response',
    step3Desc: 'Copy what your AI assistant returns and paste it into the editor below — Formulino checks it automatically.',
    step4Title: 'Generate your form',
    step4Desc: 'Review any errors, fix them if needed, then click Create Form (requires Google login).',
    copyPrompt: 'Copy AI Prompt',
    copied: 'Copied!',
    placeholder: '{\n  "id": "form-1",\n  "title": "My form",\n  ...\n}',
    validate: 'Check',
    validating: 'Checking…',
    createForm: 'Create Form',
    creating: 'Creating…',
    validDsl: 'Response recognised ✓',
    validationErrors: 'Errors to fix:',
    formCreated: 'Form created!',
    openForm: 'Open Google Form ↗',
    notAuth: 'Google login required. Redirecting…',
    errorPrefix: 'Error:',
    invalidJson: 'Format not recognised',
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
