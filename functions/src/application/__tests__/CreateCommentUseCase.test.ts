import { CreateCommentUseCase } from "../CreateCommentUseCase";

describe("CreateCommentUseCase", () => {
  it("コメントが正常にGitHubに投稿されること", async () => {
    const aiService = {
      createCommentFromPrompt: jest
        .fn()
        .mockResolvedValue({ value: "テストコメント" }),
    };

    const githubClient = {
      postComment: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new CreateCommentUseCase(
      aiService as any,
      githubClient as any
    );

    await useCase.handle({
      owner: "test-owner",
      repo: "test-repo",
      issueNumber: 1,
      prompt: "テスト内容です",
    });

    expect(aiService.createCommentFromPrompt).toHaveBeenCalledWith(
      "テスト内容です"
    );
    expect(githubClient.postComment).toHaveBeenCalledWith(
      "test-owner",
      "test-repo",
      1,
      "テストコメント"
    );
  });
});
