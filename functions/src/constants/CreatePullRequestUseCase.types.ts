export type CreatePullRequestParams = {
  owner: string;
  repo: string;
  issueNumber: number;
  sourceBranch: string;
  baseBranch?: "develop";
};
