/**
 * Interaction events for research studies (docs/research.md). Off by default: nothing is
 * recorded unless a sink is installed, e.g. with `?log=console`.
 */
export type ViewerEvent =
  | { type: 'scene_load'; source: string }
  | { type: 'zone_hover'; zoneId: string }
  | { type: 'zone_select'; zoneId: string | null }
  | { type: 'camera_move'; position: [number, number, number] };

export type EventSink = (event: ViewerEvent & { t: number }) => void;

let sink: EventSink | null = null;

export function setEventSink(next: EventSink | null): void {
  sink = next;
}

export function track(event: ViewerEvent): void {
  sink?.({ ...event, t: Math.round(performance.now()) });
}
