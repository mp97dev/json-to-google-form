import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div style="display:grid;place-items:center;min-height:100vh;font-family:sans-serif;">
      <p>{{ message }}</p>
    </div>
  `,
})
export class CallbackComponent implements OnInit {
  message = 'Processing authentication…';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get('access_token');
      const code = params.get('code');

      if (token) {
        sessionStorage.setItem('access_token', token);
        void this.router.navigate(['/editor']);
      } else if (code) {
        // Backend handles code exchange server-side; token should have been returned
        this.message = 'Authentication code received but no token returned. Check backend configuration.';
      } else {
        this.message = 'Authentication failed. No token or code received.';
      }
    });
  }
}
