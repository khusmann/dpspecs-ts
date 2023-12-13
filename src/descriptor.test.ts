import { expect, test } from "vitest";
import { tableSchema } from "./descriptor";

test("Test error", () => {
  expect(tableSchema.parse({ fields: [] })).toEqual({ fields: [] });
});
