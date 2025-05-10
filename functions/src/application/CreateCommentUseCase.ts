import { AICommentService } from "../domain/service/AICommentService";
import { GitHubClient } from "../infrastructure/github/GitHubClient";
import { CreateCommentUseCaseInput } from "../constants/CreateCommentUseCase.types";

export class CreateCommentUseCase {
  private readonly aiService: AICommentService;
  private readonly githubClient: GitHubClient;

  constructor(aiService: AICommentService, githubClient: GitHubClient) {
    this.aiService = aiService;
    this.githubClient = githubClient;
  }

  async handle(input: CreateCommentUseCaseInput): Promise<void> {
    const aiComment = await this.aiService.createCommentFromPrompt(
      input.prompt
    );
    await this.githubClient.postComment(
      input.owner,
      input.repo,
      input.issueNumber,
      aiComment.value
    );
  }
}
