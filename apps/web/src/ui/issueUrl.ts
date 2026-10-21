import { parseIssueRef, type IssueRef, type Project } from '@diorama/schema';

/** Link to an issue on GitHub when the project's repo is known, else undefined. */
export function issueUrl(project: Project, ref: IssueRef): string | undefined {
  const issue = parseIssueRef(ref);
  if (issue.provider !== 'github' || !project.repo?.startsWith('github:')) return undefined;
  if (!/^\d+$/.test(issue.id)) return undefined;
  return `https://github.com/${project.repo.slice('github:'.length)}/issues/${issue.id}`;
}
