import * as fs from "fs/promises";
import { z } from "zod";

export const resolveDescriptor = async <T extends z.ZodTypeAny>(
  parser: T,
  pathOrObject: unknown
): Promise<z.infer<T>> => {
  if (typeof pathOrObject === "string") {
    // TODO: support fetch
    if (pathOrObject.startsWith("http") || pathOrObject.startsWith("https")) {
      const response = await fetch(pathOrObject);
      const obj = await response.json();
      return parser.parse(obj);
    } else {
      const content = await fs.readFile(pathOrObject, "utf-8");
      const obj = JSON.parse(content);
      return parser.parse(obj);
    }
  } else {
    return parser.parse(pathOrObject);
  }
};
