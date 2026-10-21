import {
  validateIssueStates,
  validateScene,
  type IssueRef,
  type IssueState,
  type Scene,
  type ValidationError,
} from '@diorama/schema';
import exampleIssues from '../../../../examples/corner-shop.issues.json';
import exampleScene from '../../../../examples/corner-shop.scene.json';

export interface LoadedScene {
  scene: Scene;
  issues: Map<IssueRef, IssueState>;
  /** Where the scene came from, for display and logs. */
  source: string;
}

export type LoadResult =
  { ok: true; value: LoadedScene } | { ok: false; source: string; errors: ValidationError[] };

type Fetch = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

/**
 * Loads the scene named by `?scene=<url>` (and optional `?issues=<url>`), or the bundled
 * corner-shop example when no scene is given.
 */
export async function loadFromSearch(
  search: string,
  fetchJson: Fetch = fetch,
): Promise<LoadResult> {
  const params = new URLSearchParams(search);
  const sceneUrl = params.get('scene');
  const issuesUrl = params.get('issues');
  if (!sceneUrl)
    return fromJson(exampleScene, issuesUrl ? undefined : exampleIssues, 'example: corner-shop');

  const source = sceneUrl;
  try {
    const scene = await getJson(fetchJson, sceneUrl);
    const issues = issuesUrl ? await getJson(fetchJson, issuesUrl) : {};
    return fromJson(scene, issues, source);
  } catch (error) {
    return { ok: false, source, errors: [{ path: '', message: String(error) }] };
  }
}

/** Validates already-parsed scene and issue JSON. Missing issues means "nothing reported yet". */
export function fromJson(sceneJson: unknown, issuesJson: unknown = {}, source: string): LoadResult {
  const scene = validateScene(sceneJson);
  if (!scene.success) return { ok: false, source, errors: scene.errors };
  const issues = validateIssueStates(issuesJson);
  if (!issues.success) {
    return {
      ok: false,
      source,
      errors: issues.errors.map((e) => ({ ...e, path: `issues: ${e.path}` })),
    };
  }
  return { ok: true, value: { scene: scene.scene, issues: issues.issues, source } };
}

/** Tells a scene file from an issue-state file by its content. */
export function isSceneJson(json: unknown): boolean {
  return typeof json === 'object' && json !== null && 'schemaVersion' in json;
}

async function getJson(fetchJson: Fetch, url: string): Promise<unknown> {
  const response = await fetchJson(url);
  if (!response.ok) throw new Error(`could not load ${url} (HTTP ${response.status})`);
  return response.json();
}
