import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { I18nService } from './services/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="app-header">
      <a routerLink="/" class="app-name">JSON &rarr; Google Form</a>
      <button type="button" class="lang-toggle" (click)="i18n.toggle()">
        {{ i18n.lang() === 'it' ? 'EN' : 'IT' }}
      </button>
    </header>
    <router-outlet />
    <footer class="app-footer">
      <a routerLink="/privacy">{{ i18n.lang() === 'it' ? 'Informativa sulla privacy' : 'Privacy Policy' }}</a>
    </footer>
  `,
  styles: [`
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: .75rem 1.5rem;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .app-name {
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: .95rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -.02em;
      text-decoration: none;
    }

    .app-name:hover {
      color: var(--accent);
    }

    .lang-toggle {
      padding: .3rem .8rem;
      border-radius: 5px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-secondary);
      font-size: .82rem;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: .04em;
      transition: border-color 100ms, color 100ms;
    }

    .lang-toggle:hover {
      border-color: var(--accent);
      color: var(--accent);
    }

    .app-footer {
      text-align: center;
      padding: 1.5rem 1rem 2rem;
      border-top: 1px solid var(--border);
      margin-top: 2rem;
    }

    .app-footer a {
      color: var(--text-secondary);
      font-size: .82rem;
      text-decoration: none;
    }

    .app-footer a:hover {
      color: var(--accent);
      text-decoration: underline;
    }
  `],
})
export class AppShellComponent {
  constructor(readonly i18n: I18nService) {}
}
