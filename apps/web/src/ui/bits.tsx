import type { BuildStatus } from '@diorama/schema';
import { STATUS_LOOK } from '../viewer/statusStyle.ts';

export function StatusPill({ status }: { status: BuildStatus }) {
  return <span className={`pill ${status}`}>{STATUS_LOOK[status].label}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
    >
      <div style={{ width: `${value * 100}%` }} />
    </div>
  );
}
