import * as d from "./descriptor";
import { z } from "zod";

export interface LocalPath {
  _tag: "localPath";
  relPath: string;
  rootDir: string;
  toDescriptor(): string;
}

export const localPath = (relPath: string, rootDir: string): LocalPath => ({
  _tag: "localPath",
  relPath,
  rootDir,
  toDescriptor: () => relPath,
});

export interface RemotePath {
  _tag: "remotePath";
  relUrl: string;
  rootUrl: string;
  toDescriptor(): string;
}

export const remotePath = (relUrl: string, rootUrl: string): RemotePath => ({
  _tag: "remotePath",
  relUrl,
  rootUrl,
  toDescriptor: () => relUrl,
});

export interface AbsRemotePath {
  _tag: "absRemotePath";
  url: string;
  toDescriptor(): string;
}

export const absRemotePath = (url: string): AbsRemotePath => ({
  _tag: "absRemotePath",
  url,
  toDescriptor: () => url,
});

export type Path = LocalPath | RemotePath | AbsRemotePath;

export const parsePathStr = (path: string, rootDir: string): Path => {
  if (isRemotePath(path)) {
    return absRemotePath(path);
  } else {
    if (isRemotePath(rootDir)) {
      return remotePath(path, rootDir);
    } else {
      return localPath(path, rootDir);
    }
  }
};

export interface PathData {
  _tag: "pathData";
  paths: Path | Path[];
  format?: string;
  toProps(): {
    path: string | string[];
    format?: string;
  };
  get pathsArray(): Path[];
}

export const pathData = (paths: Path | Path[], format?: string): PathData => ({
  _tag: "pathData",
  paths,
  format,
  toProps: () => ({
    path: Array.isArray(paths)
      ? paths.map((p) => p.toDescriptor())
      : paths.toDescriptor(),
    format,
  }),
  get pathsArray(): Path[] {
    return Array.isArray(paths) ? paths : [paths];
  },
});

export interface InlineDataString {
  _tag: "inlineDataString";
  data: string;
  format: string;
  toProps(): {
    data: string;
    format: string;
  };
}

export const inlineDataString = (
  data: string,
  format: string
): InlineDataString => ({
  _tag: "inlineDataString",
  data,
  format,
  toProps: () => ({
    data,
    format,
  }),
});

export interface InlineDataRecordRows {
  _tag: "inlineDataRecordRows";
  data: Array<Record<string, string>>;
  format?: "json" | "inline";
  toProps(): {
    data: Array<Record<string, string>>;
    format?: "json" | "inline";
  };
}

export const inlineDataRecordRows = (
  data: Array<Record<string, string>>,
  format?: "json" | "inline"
): InlineDataRecordRows => ({
  _tag: "inlineDataRecordRows",
  data,
  format,
  toProps: () => ({
    data,
    format,
  }),
});

export interface InlineDataArrayRows {
  _tag: "inlineDataArrayRows";
  data: Array<Array<string>>;
  format?: "json" | "inline";
  toProps(): {
    data: Array<Array<string>>;
    format?: "json" | "inline";
  };
}

export const inlineDataArrayRows = (
  data: Array<Array<string>>,
  format?: "json" | "inline"
): InlineDataArrayRows => ({
  _tag: "inlineDataArrayRows",
  data,
  format,
  toProps: () => ({
    data,
    format,
  }),
});

export type ResourceData =
  | PathData
  | InlineDataString
  | InlineDataRecordRows
  | InlineDataArrayRows;

export interface PathSchema {
  _tag: "pathSchema";
  props: d.TableSchema;
  path: Path;
  toDescriptor(): string;
}

export const pathSchema = (props: d.TableSchema, path: Path): PathSchema => ({
  _tag: "pathSchema",
  props,
  path,
  toDescriptor: () => path.toDescriptor(),
});

export interface InlineSchema {
  _tag: "inlineSchema";
  props: d.TableSchema;
  toDescriptor(): d.TableSchema;
}

export const inlineSchema = (props: d.TableSchema): InlineSchema => ({
  _tag: "inlineSchema",
  props,
  toDescriptor: () => props,
});

export type Schema = PathSchema | InlineSchema;

// Without strict, the omit loses type info
// https://github.com/microsoft/TypeScript/issues/31501
const strictResource = d.resource.strict();
type StrictResource = z.infer<typeof strictResource>;

type ResourceProps = Omit<
  StrictResource,
  "data" | "format" | "schema" | "path"
>;

export interface Resource {
  props: ResourceProps;
  schema: Schema;
  data: ResourceData;
  toDescriptor(): d.Resource;
}

export const resource = (
  props: ResourceProps,
  schema: Schema,
  data: ResourceData
): Resource => ({
  data,
  schema,
  props,
  toDescriptor: () => ({
    ...props,
    ...data.toProps(),
    schema: schema.toDescriptor(),
  }),
});

const strictDataPackage = d.dataPackage.strict();
type StrictDataPackage = z.infer<typeof strictDataPackage>;
type DataPackageProps = Omit<StrictDataPackage, "resources">;

export interface DataPackage {
  props: DataPackageProps;
  resources: Array<Resource>;
  toDescriptor(): d.DataPackage;
}

export const dataPackage = (
  props: DataPackageProps,
  resources: Array<Resource>
): DataPackage => ({
  props,
  resources,
  toDescriptor: () => ({
    ...props,
    resources: resources.map((r) => r.toDescriptor()),
  }),
});

type ParseContext = {
  fetchPathFn(path: Path): Promise<string>;
  rootDir: string;
};

const isRemotePath = (path: string): boolean =>
  path.startsWith("http") || path.startsWith("https");

export const parseResource = async (
  descriptor: unknown,
  ctx: ParseContext
): Promise<Resource> => {
  const parsedDescriptor = d.resource.parse(descriptor) as StrictResource;

  const {
    schema,
    data: _,
    format: __,
    path,
    ...parsedDescriptorProps
  } = parsedDescriptor;

  const parsedData = parseResourceDataHelper(parsedDescriptor, ctx);

  const parsedSchema = await parseSchema(schema, ctx);

  return resource(parsedDescriptorProps, parsedSchema, parsedData);
};

const tryParse = <T extends z.ZodTypeAny, P>(
  value: unknown,
  parser: T,
  successFn: (v: z.infer<T>) => P
) => {
  const parseResult = parser.safeParse(value);
  return parseResult.success ? successFn(parseResult.data) : undefined;
};

const parseResourceDataHelper = (
  descriptor: StrictResource,
  ctx: ParseContext
): ResourceData => {
  if (descriptor.path !== undefined && descriptor.data === undefined) {
    const path = Array.isArray(descriptor.path)
      ? descriptor.path.map((p) => parsePathStr(p, ctx.rootDir))
      : parsePathStr(descriptor.path, ctx.rootDir);

    return pathData(path, descriptor.format);
  }

  if (descriptor.path === undefined && descriptor.data !== undefined) {
    // Inline data
    if (typeof descriptor.data === "string") {
      if (descriptor.format === undefined) {
        throw new Error("Raw inline data must have format");
      }
      return inlineDataString(descriptor.data, descriptor.format);
    } else {
      const format = descriptor.format;
      if (format !== undefined && format !== "json" && format !== "inline") {
        throw new Error("Only json format is supported for inline data");
      }
      const data =
        tryParse(descriptor.data, d.inlineDataRecordRows, (v) =>
          inlineDataRecordRows(v, format)
        ) ??
        tryParse(descriptor.data, d.inlineDataArrayRows, (v) =>
          inlineDataArrayRows(v, format)
        );

      if (data === undefined) {
        throw new Error("Unable to parse inline data");
      }

      return data;
    }
  }
  throw new Error("Resource must have data or a data path");
};

export const parseSchema = async (
  descriptor: unknown,
  ctx: ParseContext
): Promise<Schema> => {
  if (typeof descriptor === "string") {
    const path = parsePathStr(descriptor, ctx.rootDir);
    const content = await ctx.fetchPathFn(path);
    const parsedContent = d.tableSchema.parse(JSON.parse(content));
    return pathSchema(parsedContent, path);
  } else {
    return inlineSchema(d.tableSchema.parse(descriptor));
  }
};
