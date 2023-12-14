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
    .with({ type: "object" }, () => pl.DataType.Object)
    .with({ type: "array" }, () => pl.DataType.List(pl.DataType.Utf8))
    .with({ type: "geojson" }, () => pl.DataType.Object)
    .with({ type: "date" }, () => pl.DataType.Date)
    .with({ type: "time" }, () => pl.DataType.Time)
    .with({ type: "datetime" }, () =>
      pl.DataType.Datetime(pl.TimeUnit.Milliseconds)
    )
    .with({ type: "duration" }, () => pl.DataType.Time)
    .with({ type: "any" }, () => pl.DataType.Object)
    .with({ type: "geopoint" }, () => pl.DataType.Object)
    .with({ type: "year" }, () => pl.DataType.Date)
    .with({ type: "yearmonth" }, () => pl.DataType.Date)
    .exhaustive();

const scanCsvOptionsFromDp = (
  dialect: d.CsvDialect | undefined,
  encoding: string | undefined
): Optional<pl.ScanCsvOptions, "commentChar"> => {
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

  if (encoding !== undefined && encoding !== "utf8" && encoding !== "utf-8") {
    throw new Error(`Encoding not supported ({encoding})`);
  }

  return {
    // CSV Dialect
    hasHeader: opts.header,
    sep: opts.delimiter,
    commentChar: opts.commentChar, // undefined => no comments
    quoteChar: opts.quoteChar,
    nullValues: [],
    encoding: "utf8",

    // Read options
    inferSchemaLength: 0,
    skipRows: 0,
    skipRowsAfterHeader: 0,
    nRows: -1,

    // Polars things (from defaults)
    ignoreErrors: false,
    cache: true,
    rechunk: false,
    lowMemory: false,
    parseDates: false,
  };
};

const scanPathResource =
  (rootDir: string) =>
  async (resource: d.PathResource): Promise<pl.LazyDataFrame> => {
    const result = await tryScanPathCsv(resource, rootDir);

    if (result === undefined) {
      throw new Error("Unable to scan path resource");
    }

    return result;
  };

const tryScanPathCsv = async (
  resource: d.PathResource,
  rootDir: string
): Promise<pl.LazyDataFrame | undefined> => {
  const paths =
    typeof resource.path === "string" ? [resource.path] : resource.path;

  const absPaths = paths.map((p) => path.join(rootDir, p));

  // Verify format is CSV
  if (resource.format === undefined) {
    // If no resource format given, make sure all paths end with .csv
    if (!absPaths.every((p) => p.endsWith(".csv"))) {
      return undefined;
    }
  } else {
    // If resource format given, make sure it's csv
    if (resource.format !== "csv") {
      return undefined;
    }
  }

  // TODO: resolve URLs if necessary

  const polarsScanOptions = scanCsvOptionsFromDp(
    resource.dialect,
    resource.encoding
  );

  if (absPaths.length === 1) {
    return pl.scanCSV(absPaths[0], polarsScanOptions);
  } else {
    const allData = await Promise.all(
      absPaths.map((p) => pl.scanCSV(p, polarsScanOptions).collect())
    );
    // TODO: change this when concat accepts lazyframes natively
    return pl.concat(allData).lazy();
  }
};

const scanInlineResource = async (
  resource: d.InlineResource
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
  resource: d.InlineResource
): Promise<pl.LazyDataFrame | undefined> => {
  return undefined;
};

const tryScanInlineArrayRows = async (
  resource: d.InlineResource
): Promise<pl.LazyDataFrame | undefined> => {
  return undefined;
};

const tryScanInlineCsv = async (
  resource: d.InlineResource
): Promise<pl.LazyDataFrame | undefined> => {
  return undefined;
};

export const scanResourceRaw = async (
  resource: d.Resource,
  rootDir: string
): Promise<pl.LazyDataFrame> =>
  match(resource)
    .with(P._, d.isPathResource, scanPathResource(rootDir))
    .with(P._, d.isInlineResource, scanInlineResource)
    .exhaustive();

export const readResourceRaw = async (
  resource: d.Resource,
  rootDir: string
): Promise<pl.DataFrame> => {
  const scannedResource = await scanResourceRaw(resource, rootDir);
  return await scannedResource.collect();
};

export const scanResource = async (
  resource: d.Resource,
  rootDir: string
): Promise<pl.LazyDataFrame> => {
  return await scanResourceRaw(resource, rootDir);
};

export const readResource = async (
  resource: d.Resource,
  rootDir: string
): Promise<pl.DataFrame> => {
  const scannedResource = await scanResource(resource, rootDir);
  return await scannedResource.collect();
};
