import { afterEach, describe, expect, it, vi } from 'vitest';
import { setEventSink, track } from './telemetry.ts';

afterEach(() => setEventSink(null));

describe('telemetry', () => {
  it('records nothing without a sink', () => {
    expect(() => track({ type: 'zone_select', zoneId: 'cart' })).not.toThrow();
  });

  it('sends timestamped events to the installed sink', () => {
    const sink = vi.fn();
    setEventSink(sink);
    track({ type: 'zone_hover', zoneId: 'cart' });
    expect(sink).toHaveBeenCalledWith({
      type: 'zone_hover',
      zoneId: 'cart',
      t: expect.any(Number),
    });
  });
});
