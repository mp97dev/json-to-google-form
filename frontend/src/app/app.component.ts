import { Component } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main class="auth-shell">
      <section class="auth-card">
        <p class="eyebrow">Proof Of Concept</p>
        <h1>Login to Continue</h1>
        <p class="description">
          Use Google OAuth to authorize backend actions for Google Forms.
        </p>

        <button type="button" (click)="loginWithGoogle()">
          <span class="mark" aria-hidden="true">G</span>
          Login with Google
        </button>

        <p class="hint">
          Callback endpoint:
          <strong>{{ callbackUrl }}</strong>
        </p>
      </section>
    </main>
  `,
  styles: [
    `
      .auth-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem 1rem;
        background:
          radial-gradient(circle at 10% 20%, rgba(15, 98, 254, 0.14), transparent 36%),
          radial-gradient(circle at 90% 10%, rgba(0, 153, 153, 0.14), transparent 30%),
          linear-gradient(180deg, #f8fbff 0%, #eef5f3 100%);
      }

      .auth-card {
        width: min(460px, 100%);
        border-radius: 20px;
        padding: 2rem;
        background: #ffffff;
        border: 1px solid #dbe6e2;
        box-shadow: 0 14px 40px rgba(16, 24, 40, 0.08);
      }

      .eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.75rem;
        color: #0a8f7d;
        font-weight: 700;
      }

      h1 {
        margin: 0.45rem 0 0;
        font-size: clamp(1.8rem, 4vw, 2.2rem);
        line-height: 1.1;
        color: #132238;
      }

      .description {
        margin: 0.9rem 0 1.4rem;
        color: #3f556f;
        line-height: 1.5;
      }

      button {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;
        border: 1px solid #132238;
        background: #132238;
        color: #ffffff;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 999px;
        padding: 0.9rem 1.2rem;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 120ms ease;
      }

      button:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 22px rgba(19, 34, 56, 0.2);
      }

      .mark {
        display: inline-grid;
        place-items: center;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: #ffffff;
        color: #132238;
        font-weight: 700;
      }

      .hint {
        margin: 1.1rem 0 0;
        font-size: 0.86rem;
        color: #64748b;
        line-height: 1.45;
      }
    `,
  ],
})
export class AppComponent {
  readonly callbackUrl = `${environment.apiBaseUrl}/auth/google/callback`;

  loginWithGoogle() {
    window.location.href = `${environment.apiBaseUrl}/auth/google/login`;
  }
}
