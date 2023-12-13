import { expect, test } from "vitest";
import { tableSchema } from "../src/descriptor";

test("Test error", () => {
  expect(tableSchema.parse({ fields: [] })).toEqual({ fields: [] });
});
