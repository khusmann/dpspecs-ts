import { readResource } from "../src";
import { expect, test } from "vitest";
import { readDataPackage } from "@dpspecs/node";
import * as path from "path";

test("Test read", async () => {
  const rootDir = path.join(__dirname, "fixtures/testPackage");

  const packagePath = path.join(rootDir, "datapackage.json");

  const dpkg = await readDataPackage(packagePath);

  const df = await readResource(dpkg.resources[1]);

  console.log(df);

  expect(true).toBeTruthy();
});
