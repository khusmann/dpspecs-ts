import { expect, test } from "vitest";
import { TableSchema } from "./schema";

test("Test error", () => {
  expect(TableSchema.parse({ fields: [] })).toEqual({ fields: [] });
});
