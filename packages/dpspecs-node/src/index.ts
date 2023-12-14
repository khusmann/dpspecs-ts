import * as fs from "fs/promises";
import { z } from "zod";

export const readDescriptor = async <T extends z.ZodTypeAny>(
  parser: T,
  pathOrObject: unknown
): Promise<z.infer<T>> => {
  if (typeof pathOrObject === "string") {
    // TODO: support fetch
    const content = await fs.readFile(pathOrObject, "utf-8");
    const obj = JSON.parse(content);
    return parser.parse(obj);
  } else {
    return parser.parse(pathOrObject);
  }
};
