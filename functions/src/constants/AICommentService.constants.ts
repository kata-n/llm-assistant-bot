// AICommentServiceで使用する定数

export const PR_DIFF_PROMPT_TEMPLATE = `以下は GitHub の develop ブランチと {sourceBranch} ブランチの差分です。変更の意図をくみ取って、PR タイトルと本文を日本語で丁寧に出力してください。

出力形式:
{
  "title": string,
  "body": string
}

--- 差分 ---
{fileSummaries}`;

export const DIFF_FILE_SUMMARY_TEMPLATE = `### {filename}\n変更種別: {status}\n\n{patch}`;

export const DIFF_FILE_NO_PATCH_PLACEHOLDER = "(差分なし)";
