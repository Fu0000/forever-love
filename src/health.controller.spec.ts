import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns service health status', () => {
    const controller = new HealthController();
    const result = controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toEqual(expect.any(String));
  });
});
