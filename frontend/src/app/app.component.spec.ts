import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('creates component instance', () => {
    expect(new AppComponent()).toBeInstanceOf(AppComponent);
  });

  it('callbackUrl contains the oauth callback path', () => {
    const comp = new AppComponent();
    expect(comp.callbackUrl).toMatch(/\/auth\/google\/callback$/);
  });
});
