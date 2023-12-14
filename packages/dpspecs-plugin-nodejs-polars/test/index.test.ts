import { readResourceRaw, readResource } from "../src";
import { expect, test } from "vitest";
import { resolveDescriptor } from "@dpspecs/node";
import * as d from "@dpspecs/core";
import * as fs from "fs";
import * as path from "path";

test("Test read", async () => {
  const rootDir = path.join(__dirname, "fixtures/testPackage");

  const packagePath = path.join(rootDir, "datapackage.json");

  const descriptor = await resolveDescriptor(d.dataPackage, packagePath);

  const df = await readResource(descriptor.resources[1], rootDir);

  console.log(df);

  expect(true).toBeTruthy();
});
