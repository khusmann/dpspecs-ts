import { descriptor as d, model as m } from "@dpspecs/core";
import * as pl from "nodejs-polars";
import { match } from "ts-pattern";

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

const scanPathDataHelper = (
  path: m.Path,
  format: string | undefined,
  dialect: d.CsvDialect | undefined,
  encoding: string | undefined
): Promise<pl.LazyDataFrame> => {
  if (format !== undefined) {
    if (!path.absPath.endsWith(".csv")) {
      throw new Error(`Unsupported format ({path.absPath})`);
    }
  } else {
    if (format !== "csv") {
      throw new Error(`Unsupported format ({format})`);
    }
  }

  if (encoding !== "utf8" && encoding !== "utf-8") {
    throw new Error(`Unsupported encoding ({encoding})`);
  }

  const scanOptions = csvOptionsFromDp(dialect);

  return match(path)
    .with({ _tag: "localPath" }, async ({ absPath }) =>
      pl.scanCSV(absPath, scanOptions)
    )
    .with(
      { _tag: "remotePath" },
      { _tag: "absRemotePath" },
      async ({ absPath }) => {
        const response = await fetch(absPath);
        const buffer = Buffer.from(await response.arrayBuffer());
        return pl.readCSV(buffer, scanOptions).lazy();
      }
    )
    .exhaustive();
};

const scanPathData = async (data: m.PathData): Promise<pl.LazyDataFrame> => {
  const paths = data.pathsArray;

  if (paths.length === 0) {
    throw new Error("No data paths specified in resource");
  } else if (paths.length === 1) {
    return await scanPathDataHelper(
      paths[0],
      data.format,
      data.csvDialect,
      data.encoding
    );
  } else {
    const scannedData = await Promise.all(
      paths.map((p) =>
        scanPathDataHelper(p, data.format, data.csvDialect, data.encoding)
      )
    );
    const collectedData = await Promise.all(
      scannedData.map((df) => df.collect())
    );
    // TODO: change this when concat accepts lazyframes natively
    return pl.concat(collectedData).lazy();
  }
};

const scanInlineData = async (
  data: m.InlineData
): Promise<pl.LazyDataFrame> => {
  throw new Error("Inline data not supported yet");
};

export const scanResourceData = async (
  data: m.ResourceData
): Promise<pl.LazyDataFrame> => {
  const scannedData = await match(data)
    .with({ _tag: "pathData" }, scanPathData)
    .with(
      { _tag: "inlineDataString" },
      { _tag: "inlineDataArrayRows" },
      { _tag: "inlineDataRecordRows" },
      scanInlineData
    )
    .exhaustive();

  // Replace null values with empty string ("")
  return scannedData.select(
    scannedData.columns.map((c) =>
      pl.when(pl.col(c).isNull()).then(pl.lit("")).otherwise(pl.col(c)).alias(c)
    )
  );
};

export type ScanResourceResult = {
  values: pl.LazyDataFrame;
  missing: pl.LazyDataFrame;
};

export type ReadResourceResult = {
  values: pl.DataFrame;
  missing: pl.DataFrame;
};

const convertValues = (
  data: pl.LazyDataFrame,
  fields: d.Field[],
  missingValues: string[]
) => {
  if (fields.length !== data.columns.length) {
    throw new Error(
      `Schema and columns length mismatch (${fields.length} vs ${data.columns.length})`
    );
  }

  const valueExprs = fields.map((field, idx) => {
    const col = data.columns[idx];
    const mv = field.missingValues ?? missingValues ?? [];
    const type = typeFromDp(field);
    return pl
      .when(pl.col(col).isIn(mv))
      .then(pl.lit(null))
      .otherwise(pl.col(col))
      .cast(type)
      .alias(field.name);
  });

  return data.select(valueExprs);
};

const convertMissing = (
  data: pl.LazyDataFrame,
  fields: d.Field[],
  missingValues: string[]
) => {
  if (fields.length !== data.columns.length) {
    throw new Error(
      `Schema and columns length mismatch (${fields.length} vs ${data.columns.length})`
    );
  }

  const missingExprs = fields.map((field, idx) => {
    const col = data.columns[idx];
    const mv = field.missingValues ?? missingValues ?? [];
    return pl
      .when(pl.col(col).isIn(mv))
      .then(pl.col(col))
      .otherwise(pl.lit(null))
      .alias(field.name);
  });

  return data.select(missingExprs);
};

export const scanResource = async (
  resource: m.Resource
): Promise<ScanResourceResult> => {
  const data = await scanResourceData(resource.data);
  const schema = resource.schema;
  const fields = schema.props.fields;
  const missingValues = schema.props.missingValues ?? [];
  return {
    values: convertValues(data, fields, missingValues),
    missing: convertMissing(data, fields, missingValues),
  };
};

export const scanResourceValues = async (
  resource: m.Resource
): Promise<pl.LazyDataFrame> => {
  const data = await scanResourceData(resource.data);
  const schema = resource.schema;
  const fields = schema.props.fields;
  const missingValues = schema.props.missingValues ?? [];
  return convertValues(data, fields, missingValues);
};

export const readResource = async (
  resource: m.Resource
): Promise<ReadResourceResult> => {
  const result = await scanResource(resource);
  return {
    values: await result.values.collect(),
    missing: await result.missing.collect(),
  };
};

export const readResourceValues = async (
  resource: m.Resource
): Promise<pl.DataFrame> => (await scanResourceValues(resource)).collect();
