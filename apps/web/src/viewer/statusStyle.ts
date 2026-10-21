import type { BuildStatus } from '@diorama/schema';

/** How each build status is drawn: ghost → partly solid → solid. */
export const STATUS_LOOK: Readonly<
  Record<BuildStatus, { opacity: number; edgeColor: string | null; label: string }>
> = {
  planned: { opacity: 0.14, edgeColor: '#6b93e8', label: 'Planned' },
  in_progress: { opacity: 0.6, edgeColor: '#e39b2d', label: 'In progress' },
  done: { opacity: 1, edgeColor: null, label: 'Built' },
};

/** Colour of ghost (planned) parts, whatever their zone's accent. */
export const GHOST_COLOR = '#a9c4f5';
