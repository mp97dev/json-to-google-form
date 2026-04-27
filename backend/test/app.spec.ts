import { AppController } from '../src/app.controller';

describe('AppController', () => {
  it('returns health payload', () => {
    const controller = new AppController();

    expect(controller.health()).toEqual({
      service: 'backend',
      status: 'ok',
    });
  });
});
