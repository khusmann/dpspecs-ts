import { expect, test } from "vitest";
import { Schema } from "./schema";

test("Test error", () => {
  expect(Schema.parse({ fields: [] })).toEqual({ fields: [] });
});
