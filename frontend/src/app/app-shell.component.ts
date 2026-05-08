import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './services/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header class="app-header">
      <span class="app-name">json → form</span>
      <button type="button" class="lang-toggle" (click)="i18n.toggle()">
        {{ i18n.lang() === 'it' ? 'EN' : 'IT' }}
      </button>
    </header>
    <router-outlet />
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
  `],
})
export class AppShellComponent {
  constructor(readonly i18n: I18nService) {}
}
