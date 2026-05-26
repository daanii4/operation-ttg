import fs from "node:fs";
import path from "node:path";

/** Returns true when `relativePath` exists under the repo root (server-only). */
export function repoFileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

export function allRepoFilesExist(relativePaths: string[]): boolean {
  return relativePaths.every(repoFileExists);
}

/** True when `relativePath` exists and its UTF-8 contents include `needle`. */
export function repoFileContains(relativePath: string, needle: string): boolean {
  if (!repoFileExists(relativePath)) return false;
  const text = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
  return text.includes(needle);
}
