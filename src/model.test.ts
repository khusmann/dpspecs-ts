import { expect, test } from "vitest";
import { TableSchema } from "./model";

test("Test error", () => {
  expect(TableSchema.parse({ fields: [] })).toEqual({ fields: [] });
});
