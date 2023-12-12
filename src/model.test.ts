import { expect, test } from "vitest";
import { tableSchema } from "./model";

test("Test error", () => {
  expect(tableSchema.parse({ fields: [] })).toEqual({ fields: [] });
});
