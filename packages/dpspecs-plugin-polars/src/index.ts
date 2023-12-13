import * as d from "@dpspecs/core";
import * as pl from "nodejs-polars";
import { match, P } from "ts-pattern";
import { z } from "zod";

export const polarsTypeFromDp = (field: d.Field): pl.DataType =>
  match(field)
    .with({ type: "string" } as const, () => pl.DataType.Utf8)
    .with({ type: "boolean" } as const, () => pl.DataType.Bool)
    .with({ type: "integer" } as const, () => pl.DataType.Int64)
    .with({ type: "number" } as const, () => pl.DataType.Float64)
    .with({ type: "object" } as const, () => pl.DataType.Object)
    .with({ type: "array" } as const, () => pl.DataType.List(pl.DataType.Utf8))
    .with({ type: "geojson" } as const, () => pl.DataType.Object)
    .with({ type: "date" } as const, () => pl.DataType.Date)
    .with({ type: "time" } as const, () => pl.DataType.Time)
    .with({ type: "datetime" } as const, () =>
      pl.DataType.Datetime(pl.TimeUnit.Milliseconds)
    )
    .with({ type: "duration" } as const, () => pl.DataType.Time)
    .with({ type: "any" } as const, () => pl.DataType.Object)
    .with({ type: "geopoint" } as const, () => pl.DataType.Object)
    .with({ type: "year" } as const, () => pl.DataType.Date)
    .with({ type: "yearmonth" } as const, () => pl.DataType.Date)
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
