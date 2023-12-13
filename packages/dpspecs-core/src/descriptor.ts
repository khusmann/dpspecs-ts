import { z } from "zod";

export const baseField = z
  .object({
    name: z.string(),
    type: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    format: z.string().optional(),
    missingValues: z.array(z.string()).optional(),
  })
  .passthrough();

export const baseConstraints = z
  .object({
    required: z.boolean().optional(),
    unique: z.boolean().optional(),
  })
  .passthrough();

export const anyField = baseField.extend({
  type: z.literal("any"),
  constraints: baseConstraints.optional(),
});

export const arrayField = baseField.extend({
  type: z.literal("array"),
  arrayItem: z.record(z.any()).optional(),
  constraints: baseConstraints.extend({
    enum: z.array(z.array(z.string().or(z.number()))).optional(),
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
  }),
});

export const booleanField = baseField.extend({
  type: z.literal("boolean"),
  trueValues: z.array(z.string()).optional(),
  falseValues: z.array(z.string()).optional(),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.boolean()).optional(),
    })
    .optional(),
});

export const integerField = baseField.extend({
  type: z.literal("integer"),
  bareNumber: z.boolean().optional(),
  groupChar: z.string().optional(),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.number().int()).optional(),
      minimum: z.number().int().optional(),
      maximum: z.number().int().optional(),
    })
    .optional(),
});

export const numberField = baseField.extend({
  type: z.literal("number"),
  bareNumber: z.boolean().optional(),
  groupChar: z.string().optional(),
  decimalChar: z.string().optional(),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.number()).optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
    })
    .optional(),
});

export const objectField = baseField.extend({
  type: z.literal("object"),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.record(z.any())).optional(),
      minLength: z.number().int().optional(),
      maxLength: z.number().int().optional(),
    })
    .optional(),
});

export const stringField = baseField.extend({
  type: z.literal("string"),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.string()).optional(),
      minLength: z.number().int().optional(),
      maxLength: z.number().int().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});

// TODO: the following field types need work

export const dateField = baseField.extend({
  type: z.literal("date"),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.any()).optional(),
    })
    .optional(),
});

export const datetimeField = baseField.extend({
  type: z.literal("datetime"),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.any()).optional(),
    })
    .optional(),
});

export const durationField = baseField.extend({
  type: z.literal("duration"),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.any()).optional(),
    })
    .optional(),
});

export const geojsonField = baseField.extend({
  type: z.literal("geojson"),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.any()).optional(),
    })
    .optional(),
});

export const geopointField = baseField.extend({
  type: z.literal("geopoint"),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.any()).optional(),
    })
    .optional(),
});

export const timeField = baseField.extend({
  type: z.literal("time"),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.any()).optional(),
    })
    .optional(),
});

export const yearField = baseField.extend({
  type: z.literal("year"),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.any()).optional(),
    })
    .optional(),
});

export const yearmonthField = baseField.extend({
  type: z.literal("yearmonth"),
  constraints: baseConstraints
    .extend({
      enum: z.array(z.any()).optional(),
    })
    .optional(),
});

export const field = z.union([
  anyField,
  arrayField,
  booleanField,
  dateField,
  datetimeField,
  durationField,
  geojsonField,
  geopointField,
  integerField,
  numberField,
  objectField,
  stringField,
  timeField,
  yearField,
  yearmonthField,
]);

export const foreignKeyReference = z
  .object({
    fields: z.array(z.string()),
    resource: z.string(),
  })
  .passthrough();

export const foreignKey = z
  .object({
    fields: z.array(z.string()),
    reference: foreignKeyReference.optional(),
  })
  .passthrough();

export const tableSchema = z
  .object({
    fields: z.array(field),
    missingValues: z.array(z.string()).optional(),
    primaryKey: z.array(z.string()).or(z.string()).optional(),
    foreignKeys: z.array(foreignKey).optional(),
  })
  .passthrough();

export const source = z
  .object({
    title: z.string(),
    path: z.string().optional(),
    email: z.string().optional(),
  })
  .passthrough();

export const contributor = z
  .object({
    title: z.string(),
    email: z.string().optional(),
    path: z.string().optional(),
    role: z.string().optional(),
    organization: z.string().optional(),
  })
  .passthrough();

export const contributorDefaults: Partial<Contributor> = {
  role: "contributor",
};

export const csvDialect = z
  .object({
    delimiter: z.string().optional(),
    lineTerminator: z.string().optional(),
    quoteChar: z.string().optional(),
    doubleQuote: z.boolean().optional(),
    escapeChar: z.string().optional(),
    nullSequence: z.string().optional(),
    skipInitialSpace: z.boolean().optional(),
    header: z.boolean().optional(),
    commentChar: z.string().optional(),
    caseSensitiveHeader: z.boolean().optional(),
    csvddfVersion: z.string().optional(),
  })
  .passthrough();

export const csvDialectDefaults: Partial<CsvDialect> = {
  delimiter: ",",
  lineTerminator: "\r\n",
  quoteChar: '"',
  doubleQuote: true,
  escapeChar: undefined,
  nullSequence: undefined,
  skipInitialSpace: false,
  header: true,
  caseSensitiveHeader: false,
  csvddfVersion: "1.2",
};

export const resourceBase = z
  .object({
    name: z.string(),
    profile: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    homepage: z.string().optional(),
    version: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    image: z.string().optional(),
    created: z.string().datetime().optional(),
    format: z.string().optional(),
    mediatype: z.string().optional(),
    encoding: z.string().optional(),
    bytes: z.number().int().optional(),
    hash: z.string().optional(),
    sources: z.array(source).optional(),
    contributors: z.array(contributor).optional(),
    dialect: csvDialect.optional(),
    schema: z.record(z.any()).or(z.string()).optional(),
  })
  .passthrough();

export const pathResource = resourceBase
  .extend({
    path: z.string(),
  })
  .passthrough();

export const inlineResource = resourceBase
  .extend({
    data: z.any(),
  })
  .passthrough();

export const resource = z.union([pathResource, inlineResource]);

export const license = z
  .object({
    name: z.string(),
    path: z.string().optional(),
    title: z.string().optional(),
  })
  .passthrough();

export const dataPackage = z
  .object({
    name: z.string(),
    id: z.string().optional(),
    profile: z.string().optional(),
    title: z.string().optional(),
    licenses: z.array(license).optional(),
    homepage: z.string().optional(),
    version: z.string().optional(),
    sources: z.array(source).optional(),
    contributors: z.array(contributor).optional(),
    keywords: z.array(z.string()).optional(),
    image: z.string().optional(),
    created: z.string().datetime().optional(),
    resources: z.array(resource).nonempty(),
  })
  .passthrough();

export type AnyField = z.infer<typeof anyField>;
export type ArrayField = z.infer<typeof arrayField>;
export type BooleanField = z.infer<typeof booleanField>;
export type DateField = z.infer<typeof dateField>;
export type DatetimeField = z.infer<typeof datetimeField>;
export type DurationField = z.infer<typeof durationField>;
export type GeojsonField = z.infer<typeof geojsonField>;
export type GeopointField = z.infer<typeof geopointField>;
export type IntegerField = z.infer<typeof integerField>;
export type NumberField = z.infer<typeof numberField>;
export type ObjectField = z.infer<typeof objectField>;
export type StringField = z.infer<typeof stringField>;
export type TimeField = z.infer<typeof timeField>;
export type YearField = z.infer<typeof yearField>;
export type YearmonthField = z.infer<typeof yearmonthField>;
export type Field = z.infer<typeof field>;
export type ForeignKeyReference = z.infer<typeof foreignKeyReference>;
export type ForeignKey = z.infer<typeof foreignKey>;
export type TableSchema = z.infer<typeof tableSchema>;
export type Source = z.infer<typeof source>;
export type Contributor = z.infer<typeof contributor>;
export type License = z.infer<typeof license>;
export type CsvDialect = z.infer<typeof csvDialect>;
export type Resource = z.infer<typeof resource>;
export type DataPackage = z.infer<typeof dataPackage>;
