import { scanResourceData } from "../src";
import { expect, test } from "vitest";
import { readDataPackage } from "@dpspecs/node";
import * as d from "@dpspecs/core";
import * as path from "path";

test("Test read", async () => {
  const rootDir = path.join(__dirname, "fixtures/testPackage");

  const packagePath = path.join(rootDir, "datapackage.json");

  const dpkg = await readDataPackage(packagePath);

  const df = await scanResourceData(dpkg.resources[0].data);

  const df_collected = await df.collect();

  console.log(df_collected);

  expect(true).toBeTruthy();
});
