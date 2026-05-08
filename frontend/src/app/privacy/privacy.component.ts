import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="privacy">
      <h1>Privacy Policy</h1>
      <p class="updated">Last updated: May 8, 2026</p>

      <section>
        <h2>What this app does</h2>
        <p>
          <strong>json → form</strong> converts JSON input into Google Forms on your behalf.
          It uses Google OAuth to request permission to create forms in your Google account.
        </p>
      </section>

      <section>
        <h2>Data we collect</h2>
        <ul>
          <li><strong>Google account info</strong> — your name and email, provided by Google during sign-in, used only to authenticate your session.</li>
          <li><strong>OAuth tokens</strong> — stored in your browser session to make API calls to Google on your behalf. They are never sent to or stored on our servers beyond the duration of the request.</li>
          <li><strong>JSON input</strong> — the JSON you paste into the editor is sent to our server only to create the form via the Google Forms API. We do not log or store it.</li>
        </ul>
      </section>

      <section>
        <h2>Data we do NOT collect</h2>
        <ul>
          <li>We do not store your Google credentials or OAuth tokens persistently.</li>
          <li>We do not track usage analytics or sell any data.</li>
          <li>We do not retain the JSON or form content after the API call completes.</li>
        </ul>
      </section>

      <section>
        <h2>Third-party services</h2>
        <p>
          This app interacts with <strong>Google APIs</strong> (Google Forms API, Google OAuth 2.0).
          Your use of those services is governed by
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google's Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For any privacy-related questions, contact:
          <a href="mailto:info@ginkgo3d.it">info@ginkgo3d.it</a>
        </p>
      </section>

      <a routerLink="/" class="back">← Back to app</a>
    </main>
  `,
  styles: [`
    .privacy {
      max-width: 680px;
      margin: 3rem auto;
      padding: 0 1.5rem 4rem;
      color: var(--text-primary);
      line-height: 1.7;
    }

    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: .25rem;
    }

    .updated {
      color: var(--text-secondary);
      font-size: .85rem;
      margin-bottom: 2rem;
    }

    h2 {
      font-size: 1.05rem;
      font-weight: 600;
      margin: 2rem 0 .5rem;
      color: var(--text-primary);
    }

    p, li {
      color: var(--text-secondary);
      font-size: .92rem;
    }

    ul {
      padding-left: 1.25rem;
    }

    li {
      margin-bottom: .4rem;
    }

    a {
      color: var(--accent);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .back {
      display: inline-block;
      margin-top: 2.5rem;
      font-size: .88rem;
    }
  `],
})
export class PrivacyComponent {}
