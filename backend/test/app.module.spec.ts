import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';

describe('AppModule', () => {
  it('registers ThrottlerGuard as APP_GUARD provider', () => {
    const providers: { provide: unknown; useClass: unknown }[] =
      Reflect.getMetadata('providers', AppModule) ?? [];

    const guardProvider = providers.find((p) => p.provide === APP_GUARD);
    expect(guardProvider).toBeDefined();
    expect(guardProvider?.useClass).toBe(ThrottlerGuard);
  });
});
