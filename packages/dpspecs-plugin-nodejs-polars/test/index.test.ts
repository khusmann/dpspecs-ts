import { readResourcePolarsRaw } from "../src";
import { expect, test } from "vitest";
import { readDescriptor } from "@dpspecs/node";
import * as d from "@dpspecs/core";
import * as fs from "fs";
import * as path from "path";

test("Test read", async () => {
  const rootDir = path.join(__dirname, "fixtures/testPackage");

  const packagePath = path.join(rootDir, "datapackage.json");

  const descriptor = await readDescriptor(d.dataPackage, packagePath);

  const df = await readResourcePolarsRaw(descriptor.resources[0], rootDir);

  console.log(df);

  expect(true).toBeTruthy();
});
