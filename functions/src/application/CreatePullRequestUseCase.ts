import { CreatePullRequestParams } from "../constants/CreatePullRequestUseCase.types";
import { AICommentService } from "../domain/service/AICommentService";
import { GitHubClient } from "../infrastructure/github/GitHubClient";

export class CreatePullRequestUseCase {
  private readonly aiService: AICommentService;
  private readonly githubClient: GitHubClient;

  constructor(aiService: AICommentService, githubClient: GitHubClient) {
    this.aiService = aiService;
    this.githubClient = githubClient;
  }

  async handle(params: CreatePullRequestParams): Promise<void> {
    const {
      owner,
      repo,
      issueNumber,
      sourceBranch,
      baseBranch = "develop",
    } = params;

    // 1. developとの差分を取得
    const diffFiles = await this.githubClient.getDiffBetweenBranches(
      owner,
      repo,
      baseBranch,
      sourceBranch
    );

    // 2. AIに要約とPR情報を生成させる
    const aiResponse = await this.aiService.summarizeDiffAndGeneratePR(
      diffFiles,
      sourceBranch
    );

    // 3. PR作成
    const prUrl = await this.githubClient.createPullRequest({
      owner,
      repo,
      title: aiResponse.title,
      body: aiResponse.body,
      base: baseBranch,
      head: sourceBranch,
    });

    // 4. IssueにPR URLをコメント
    await this.githubClient.postComment(
      owner,
      repo,
      issueNumber,
      `✨ PRを作成しました: ${prUrl}`
    );
  }
}
