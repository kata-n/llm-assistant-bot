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

  async getPullRequestFiles(
    owner: string,
    repo: string,
    pullRequestNumber: number
  ): Promise<{ filename: string; status: string; patch?: string }[]> {
    const { data } = await this.octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
      {
        owner,
        repo,
        pull_number: pullRequestNumber,
      }
    );

    return data.map((file) => ({
      filename: file.filename,
      status: file.status,
      patch: file.patch,
    }));
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string
  ): Promise<string> {
    const res = await this.octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
      }
    );

    const content = res.data && "content" in res.data ? res.data.content : "";
    return Buffer.from(content, "base64").toString("utf8");
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
