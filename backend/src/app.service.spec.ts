import { AppService } from './app.service';

describe('AppService', () => {
  it('health returns ok', () => {
    const service = new AppService();
    expect(service.health()).toEqual({ status: 'ok' });
  });
});
