import * as fs from "fs/promises";
import * as path from "path";
import { match } from "ts-pattern";
import { model as m } from "@dpspecs/core";

const fetchPathFn = (p: m.Path): Promise<string> =>
  match(p)
    .with({ _tag: "localPath" }, ({ absPath }) => fs.readFile(absPath, "utf8"))
    .with(
      { _tag: "absRemotePath" },
      { _tag: "remotePath" },
      async ({ absPath }) => {
        const response = await fetch(absPath);
        return await response.text();
      }
    )
    .exhaustive();

export const readDataPackage = async (
  dpPath: string
): Promise<m.DataPackage> => {
  const dpStr = await fs.readFile(dpPath, "utf8");

  const rootDir = path.dirname(dpPath);

  const dp = JSON.parse(dpStr);

  return m.parseDataPackage(dp, {
    rootDir,
    fetchPathFn,
  });
};
