import { CreatePullRequestUseCase } from "../CreatePullRequestUseCase";

describe("CreatePullRequestUseCase", () => {
  it("PR作成フローが正常に実行されること", async () => {
    // モックデータ
    const diffFiles = [
      { filename: "file1.ts", patch: "diff1", status: "modified" },
      { filename: "file2.ts", patch: "diff2", status: "added" },
    ];
    const aiResponse = { title: "PRタイトル", body: "PR本文" };
    const prUrl = "https://github.com/test/pr/1";

    // モック化
    const aiService = {
      summarizeDiffAndGeneratePR: jest.fn().mockResolvedValue(aiResponse),
    };
    const githubClient = {
      getDiffBetweenBranches: jest.fn().mockResolvedValue(diffFiles),
      createPullRequest: jest.fn().mockResolvedValue(prUrl),
      postComment: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new CreatePullRequestUseCase(
      aiService as any,
      githubClient as any
    );

    const params = {
      owner: "test-owner",
      repo: "test-repo",
      issueNumber: 123,
      sourceBranch: "feature/test-branch",
      // baseBranchは省略（デフォルトdevelop）
    };

    await useCase.handle(params);

    expect(githubClient.getDiffBetweenBranches).toHaveBeenCalledWith(
      "test-owner",
      "test-repo",
      "develop",
      "feature/test-branch"
    );
    expect(aiService.summarizeDiffAndGeneratePR).toHaveBeenCalledWith(
      diffFiles,
      "feature/test-branch"
    );
    expect(githubClient.createPullRequest).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      title: aiResponse.title,
      body: aiResponse.body,
      base: "develop",
      head: "feature/test-branch",
    });
    expect(githubClient.postComment).toHaveBeenCalledWith(
      "test-owner",
      "test-repo",
      123,
      `✨ PRを作成しました: ${prUrl}`
    );
  });
});
