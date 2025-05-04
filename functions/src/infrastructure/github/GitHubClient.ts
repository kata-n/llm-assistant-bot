import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

export class GitHubClient {
  private readonly octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: Number(process.env.GITHUB_APP_ID),
        privateKey: process.env.GITHUB_PRIVATE_KEY!,
        installationId: Number(process.env.GITHUB_INSTALLATION_ID),
      },
    });
  }

  async postComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<void> {
    await this.octokit.request(
      "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
      {
        owner,
        repo,
        issue_number: issueNumber,
        body,
      }
    );
  }
}
