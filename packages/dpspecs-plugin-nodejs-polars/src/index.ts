import * as d from "@dpspecs/core";
import * as pl from "nodejs-polars";
import { match, P } from "ts-pattern";
import { z } from "zod";

export const polarsTypeFromDp = (field: d.Field): pl.DataType =>
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

const resolveDescriptor = async <T extends z.ZodTypeAny>(
  descriptor: unknown,
  parser: T
): Promise<z.infer<T> | undefined> => {
  if (typeof descriptor === "string") {
    throw new Error("Fetch not implemented");
  } else {
    return parser.parse(descriptor);
  }
};

export const readResourcePolars = async (
  resource: d.Resource
): Promise<pl.DataFrame> => {
  const dpSchema = (await resolveDescriptor(
    resource.schema,
    d.tableSchema
  )) ?? { fields: [] };

  const dtypes = dpSchema.fields.reduce(
    (acc, field) => {
      const polarsType = polarsTypeFromDp(field);
      return {
        ...acc,
        [field.name]: polarsType,
      };
    },
    {} as Record<string, pl.DataType>
  );

  return match(resource)
    .with(P._, d.isPathResource, ({ path }) => pl.readCSV(path, { dtypes }))
    .with(P._, d.isInlineResource, ({ data }) => {
      throw new Error("Not implemented");
    })
    .exhaustive();
};
