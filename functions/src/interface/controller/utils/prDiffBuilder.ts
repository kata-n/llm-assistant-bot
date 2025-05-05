/**
 * PRのファイル差分からプロンプト用のdiff文字列を生成
 */
export function buildPrDiffPrompt(
  prFiles: { filename: string; patch?: string }[]
): string {
  const diffs = prFiles
    .filter((f) => !!f.patch)
    .map((f) => `--- ${f.filename} ---\n${f.patch}`)
    .join("\n\n");
  return diffs ? `\n\n--- このPRの変更ファイルと差分 ---\n${diffs}` : "";
}
