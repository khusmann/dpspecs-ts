import * as d from "@dpspecs/core";
import { resolveDescriptor } from "@dpspecs/node";
import * as pl from "nodejs-polars";
import { match, P } from "ts-pattern";
import { Optional } from "utility-types";
import * as path from "path";
import { z } from "zod";

const typeFromDp = (field: d.Field): pl.DataType =>
  match(field)
    .with({ type: "string" }, () => pl.DataType.Utf8)
    .with({ type: "boolean" }, () => pl.DataType.Bool)
    .with({ type: "integer" }, () => pl.DataType.Int64)
    .with({ type: "number" }, () => pl.DataType.Float64)
    .with({ type: "array" }, () => pl.DataType.List(pl.DataType.Utf8))
    .with({ type: "any" }, () => pl.DataType.Utf8)
    // TODO: support the rest of these types...
    .with({ type: "object" }, () => pl.DataType.Utf8)
    .with({ type: "geojson" }, () => pl.DataType.Utf8)
    .with({ type: "date" }, () => pl.DataType.Utf8)
    .with({ type: "time" }, () => pl.DataType.Utf8)
    .with({ type: "datetime" }, () => pl.DataType.Utf8)
    .with({ type: "duration" }, () => pl.DataType.Utf8)
    .with({ type: "geopoint" }, () => pl.DataType.Utf8)
    .with({ type: "year" }, () => pl.DataType.Utf8)
    .with({ type: "yearmonth" }, () => pl.DataType.Utf8)
    .otherwise(() => pl.DataType.Utf8);

const checkCsvDialect = (dialect: d.CsvDialect | undefined) => {
  const opts = { ...d.csvDialectDefaults, ...dialect };

  if (opts.escapeChar !== undefined) {
    throw new Error("escapeChar not supported");
  }

  if (opts.doubleQuote !== undefined && opts.doubleQuote !== true) {
    throw new Error("doubleQuote = false not supported");
  }

  if (opts.nullSequence !== undefined) {
    throw new Error("nullSequence not supported");
  }

  if (opts.skipInitialSpace !== undefined && opts.skipInitialSpace !== false) {
    throw new Error("skipInitialSpace = true not supported");
  }

  if (
    opts.lineTerminator !== undefined &&
    opts.lineTerminator !== "\r\n" &&
    opts.lineTerminator !== "\n"
  ) {
    throw new Error(
      `Nonstandard line terminator not supported ({opts.lineTerminator})`
    );
  }

  // TODO: support caseSensitiveHeader?
  if (
    opts.caseSensitiveHeader !== undefined &&
    opts.caseSensitiveHeader !== false
  ) {
    throw new Error("caseSensitiveHeader = true not supported");
  }

  return opts;
};

const csvOptionsFromDp = (dialect: d.CsvDialect | undefined) => {
  const opts = checkCsvDialect(dialect);
  return {
    // CSV Dialect
    hasHeader: opts.header,
    sep: opts.delimiter,
    commentChar: opts.commentChar, // undefined => no comments
    quoteChar: opts.quoteChar,
    nullValues: [],
    encoding: "utf8" as const,

    // Read options
    inferSchemaLength: 0,
    skipRows: 0,
    skipRowsAfterHeader: 0,

    // Polars things (from defaults)
    ignoreErrors: false,
    parseDates: false,
  };
};

const scanPathResource =
  (rootDir: string) =>
  async (resource: d.Resource): Promise<pl.LazyDataFrame> => {
    const result = await tryScanPathCsv(resource, rootDir);

    if (result === undefined) {
      throw new Error("Unable to scan path resource");
    }

    return result;
  };

const isUrl = (path: string): boolean =>
  path.startsWith("http") || path.startsWith("https");

const scanPathCsvHelper = async (
  relPath: string,
  rootDir: string,
  dialect: d.CsvDialect | undefined
): Promise<pl.LazyDataFrame> => {
  if (relPath.startsWith("/")) {
    throw new Error("Absolute paths not supported");
  }

  if (relPath.includes("..")) {
    throw new Error("Relative paths with .. not supported");
  }

  const scanOptions = csvOptionsFromDp(dialect);

  if (isUrl(relPath)) {
    return scanUrlCsvHelper(relPath, scanOptions);
  }

  if (isUrl(rootDir)) {
    return scanUrlCsvHelper(path.join(rootDir, relPath), scanOptions);
  }

  return pl.scanCSV(path.join(rootDir, relPath), scanOptions);
};

const scanUrlCsvHelper = async (
  url: string,
  dialect: d.CsvDialect | undefined
): Promise<pl.LazyDataFrame> => {
  const response = await fetch(url);
  const csv = await response.arrayBuffer();
  if (csv === null) {
    throw new Error("Unable to fetch CSV");
  }
  return pl.readCSV(Buffer.from(csv), csvOptionsFromDp(dialect)).lazy();
};

const tryScanPathCsv = async (
  resource: d.Resource,
  rootDir: string
): Promise<pl.LazyDataFrame | undefined> => {
  const paths =
    typeof resource.path === "string" ? [resource.path] : resource.path;

  // Verify format is CSV
  if (resource.format === undefined) {
    // If no resource format given, make sure all paths end with .csv
    if (!paths.every((p) => p.endsWith(".csv"))) {
      return undefined;
    }
  } else {
    // If resource format given, make sure it's csv
    if (resource.format !== "csv") {
      return undefined;
    }
  }

  if (
    resource.encoding !== undefined &&
    resource.encoding !== "utf8" &&
    resource.encoding !== "utf-8"
  ) {
    throw new Error(`Encoding not supported ({resource.encoding})`);
  }

  if (paths.length === 1) {
    return await scanPathCsvHelper(paths[0], rootDir, resource.dialect);
  } else {
    const scannedData = await Promise.all(
      paths.map((p) => scanPathCsvHelper(p, rootDir, resource.dialect))
    );
    const collectedData = await Promise.all(
      scannedData.map((df) => df.collect())
    );
    // TODO: change this when concat accepts lazyframes natively
    return pl.concat(collectedData).lazy();
  }
};

const scanInlineResource = async (
  resource: d.Resource
): Promise<pl.LazyDataFrame> => {
  const result =
    (await tryScanInlineRecordRows(resource)) ??
    (await tryScanInlineArrayRows(resource)) ??
    (await tryScanInlineCsv(resource));

  if (result === undefined) {
    throw new Error("Unable to scan inline resource");
  }

  return result;
};

const tryScanInlineRecordRows = async (
  resource: d.Resource
): Promise<pl.LazyDataFrame | undefined> => {
  return undefined;
};

const tryScanInlineArrayRows = async (
  resource: d.Resource
): Promise<pl.LazyDataFrame | undefined> => {
  return undefined;
};

const tryScanInlineCsv = async (
  resource: d.Resource
): Promise<pl.LazyDataFrame | undefined> => {
  return undefined;
};

export const scanResourceRaw = async (
  resource: d.Resource,
  rootDir: string
): Promise<pl.LazyDataFrame> => {
  const result = await match(resource)
    .with(P._, d.isPathResource, scanPathResource(rootDir))
    .with(P._, d.isInlineResource, scanInlineResource)
    .exhaustive();

  // Replace null values with empty string ("")
  return result.select(
    result.columns.map((c) =>
      pl.when(pl.col(c).isNull()).then(pl.lit("")).otherwise(pl.col(c)).alias(c)
    )
  );
};

export const readResourceRaw = async (
  resource: d.Resource,
  rootDir: string
): Promise<pl.DataFrame> => {
  const scannedResource = await scanResourceRaw(resource, rootDir);
  return await scannedResource.collect();
};

export type ScanResourceResult = {
  values: pl.LazyDataFrame;
  missing: pl.LazyDataFrame;
};

export type ReadResourceResult = {
  values: pl.DataFrame;
  missing: pl.DataFrame;
};

export const scanResource = async (
  resource: d.Resource,
  rootDir: string
): Promise<ScanResourceResult> => {
  if (resource.schema === undefined) {
    throw new Error("Resource schema is undefined");
  }

  const schema = await resolveDescriptor(d.tableSchema, resource.schema);

  const raw = await scanResourceRaw(resource, rootDir);

  if (schema.fields.length !== raw.columns.length) {
    throw new Error(
      `Schema and columns length mismatch (${schema.fields.length} vs ${raw.columns.length})`
    );
  }

  const valueExprs = schema.fields.map((field, idx) => {
    const col = raw.columns[idx];
    const missingValues = field.missingValues ?? schema.missingValues ?? [];
    const type = typeFromDp(field);
    return pl
      .when(pl.col(col).isIn(missingValues))
      .then(pl.lit(null))
      .otherwise(pl.col(col))
      .cast(type)
      .alias(field.name);
  });

  const missingExprs = schema.fields.map((field, idx) => {
    const col = raw.columns[idx];
    const missingValues = field.missingValues ?? schema.missingValues ?? [];
    return pl
      .when(pl.col(col).isIn(missingValues))
      .then(pl.col(col))
      .otherwise(pl.lit(null))
      .alias(field.name);
  });

  return {
    values: raw.select(valueExprs),
    missing: raw.select(missingExprs),
  };
};

export const readResource = async (
  resource: d.Resource,
  rootDir: string
): Promise<ReadResourceResult> => {
  const scannedResource = await scanResource(resource, rootDir);
  return {
    values: await scannedResource.values.collect(),
    missing: await scannedResource.missing.collect(),
  };
};
