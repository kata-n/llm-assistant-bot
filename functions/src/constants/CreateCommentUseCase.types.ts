export type CreateCommentUseCaseInput = {
  owner: string;
  repo: string;
  issueNumber: number;
  prompt: string;
};
