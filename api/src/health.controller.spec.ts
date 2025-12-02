import { HealthController } from './health.controller'

describe('HealthController', () => {
  it('ready returns true', () => {
    const ctrl = new HealthController()
    expect(ctrl.ready()).toBe(true)
  })
})
