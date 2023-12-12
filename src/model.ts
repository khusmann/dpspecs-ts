import { z } from "zod";

export const BaseField = z.object({
  name: z.string(),
  type: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  missingValues: z.array(z.string()).optional(),
});

export const BaseConstraints = z.object({
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
});

export const AnyField = BaseField.extend({
  type: z.literal("any"),
  constraints: BaseConstraints.optional(),
});

export const ArrayField = BaseField.extend({
  type: z.literal("array"),
  arrayItem: z.record(z.any()).optional(),
  constraints: BaseConstraints.extend({
    enum: z.array(z.array(z.string().or(z.number()))).optional(),
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
  }),
});

export const BooleanField = BaseField.extend({
  type: z.literal("boolean"),
  trueValues: z.array(z.string()).optional(),
  falseValues: z.array(z.string()).optional(),
  constraints: BaseConstraints.extend({
    enum: z.array(z.boolean()).optional(),
  }).optional(),
});

export const IntegerField = BaseField.extend({
  type: z.literal("integer"),
  bareNumber: z.boolean().optional(),
  groupChar: z.string().optional(),
  constraints: BaseConstraints.extend({
    enum: z.array(z.number().int()).optional(),
    minimum: z.number().int().optional(),
    maximum: z.number().int().optional(),
  }).optional(),
});

export const NumberField = BaseField.extend({
  type: z.literal("number"),
  bareNumber: z.boolean().optional(),
  groupChar: z.string().optional(),
  decimalChar: z.string().optional(),
  constraints: BaseConstraints.extend({
    enum: z.array(z.number()).optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
  }).optional(),
});

export const ObjectField = BaseField.extend({
  type: z.literal("object"),
  constraints: BaseConstraints.extend({
    enum: z.array(z.record(z.any())).optional(),
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
  }).optional(),
});

export const StringField = BaseField.extend({
  type: z.literal("string"),
  constraints: BaseConstraints.extend({
    enum: z.array(z.string()).optional(),
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

// TODO: the following field types need work

export const DateField = BaseField.extend({
  type: z.literal("date"),
  constraints: BaseConstraints.extend({
    enum: z.array(z.any()).optional(),
  }).optional(),
});

export const DatetimeField = BaseField.extend({
  type: z.literal("datetime"),
  constraints: BaseConstraints.extend({
    enum: z.array(z.any()).optional(),
  }).optional(),
});

export const DurationField = BaseField.extend({
  type: z.literal("duration"),
  constraints: BaseConstraints.extend({
    enum: z.array(z.any()).optional(),
  }).optional(),
});

export const GeojsonField = BaseField.extend({
  type: z.literal("geojson"),
  constraints: BaseConstraints.extend({
    enum: z.array(z.any()).optional(),
  }).optional(),
});

export const GeopointField = BaseField.extend({
  type: z.literal("geopoint"),
  constraints: BaseConstraints.extend({
    enum: z.array(z.any()).optional(),
  }).optional(),
});

export const TimeField = BaseField.extend({
  type: z.literal("time"),
  constraints: BaseConstraints.extend({
    enum: z.array(z.any()).optional(),
  }).optional(),
});

export const YearField = BaseField.extend({
  type: z.literal("year"),
  constraints: BaseConstraints.extend({
    enum: z.array(z.any()).optional(),
  }).optional(),
});

export const YearmonthField = BaseField.extend({
  type: z.literal("yearmonth"),
  constraints: BaseConstraints.extend({
    enum: z.array(z.any()).optional(),
  }).optional(),
});

export const Field = z.union([
  AnyField,
  ArrayField,
  BooleanField,
  DateField,
  DatetimeField,
  DurationField,
  GeojsonField,
  GeopointField,
  IntegerField,
  NumberField,
  ObjectField,
  StringField,
  TimeField,
  YearField,
  YearmonthField,
]);

export const ForeignKeyReference = z.object({
  fields: z.array(z.string()),
  resource: z.string(),
});

export const ForeignKey = z.object({
  fields: z.array(z.string()),
  reference: ForeignKeyReference.optional(),
});

export const TableSchema = z.object({
  fields: z.array(Field),
  missingValues: z.array(z.string()).optional(),
  primaryKey: z.array(z.string()).or(z.string()).optional(),
  foreignKeys: z.array(ForeignKey).optional(),
});

export const Source = z.object({
  title: z.string(),
  path: z.string().optional(),
  email: z.string().optional(),
});

export const Contributor = z.object({
  title: z.string(),
  email: z.string().optional(),
  path: z.string().optional(),
  role: z.string().optional(),
  organization: z.string().optional(),
});

export const ContributorDefaults = {
  role: "contributor",
};

export const CSVDialect = z.object({
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
});

export const CSVDialectDefaults = {
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

export const ResourceBase = z.object({
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
  sources: z.array(Source).optional(),
  contributors: z.array(Contributor).optional(),
  dialect: CSVDialect.optional(),
  schema: z.record(z.any()).or(z.string()).optional(),
});

export const PathResource = ResourceBase.extend({
  path: z.string(),
});

export const InlineResource = ResourceBase.extend({
  data: z.any(),
});

export const Resource = z.union([PathResource, InlineResource]);

export const TabularArrayData = z.union([
  z.array(z.array(z.string().or(z.number()))),
  z.array(z.array(z.record(z.string().or(z.number())))),
]);

export const TabularPathResource = PathResource.extend({
  profile: z.literal("tabular-data-resource"),
  schema: TableSchema.or(z.string()),
});

export const TabularInlineResource = InlineResource.extend({
  profile: z.literal("tabular-data-resource"),
  schema: TableSchema.or(z.string()),
  data: TabularArrayData,
});

export const TabularResource = z.union([
  TabularPathResource,
  TabularInlineResource,
]);

export const License = z.object({
  name: z.string(),
  path: z.string().optional(),
  title: z.string().optional(),
});

export const DataPackage = z.object({
  name: z.string(),
  id: z.string().optional(),
  profile: z.string().optional(),
  title: z.string().optional(),
  licenses: z.array(License).optional(),
  homepage: z.string().optional(),
  version: z.string().optional(),
  sources: z.array(Source).optional(),
  contributors: z.array(Contributor).optional(),
  keywords: z.array(z.string()).optional(),
  image: z.string().optional(),
  created: z.string().datetime().optional(),
  resources: z.array(Resource).nonempty(),
});

export const TabularDataPackage = DataPackage.extend({
  resources: z.array(TabularResource).nonempty(),
});

export type AnyField = z.infer<typeof AnyField>;
export type ArrayField = z.infer<typeof ArrayField>;
export type BooleanField = z.infer<typeof BooleanField>;
export type DateField = z.infer<typeof DateField>;
export type DatetimeField = z.infer<typeof DatetimeField>;
export type DurationField = z.infer<typeof DurationField>;
export type GeojsonField = z.infer<typeof GeojsonField>;
export type GeopointField = z.infer<typeof GeopointField>;
export type IntegerField = z.infer<typeof IntegerField>;
export type NumberField = z.infer<typeof NumberField>;
export type ObjectField = z.infer<typeof ObjectField>;
export type StringField = z.infer<typeof StringField>;
export type TimeField = z.infer<typeof TimeField>;
export type YearField = z.infer<typeof YearField>;
export type YearmonthField = z.infer<typeof YearmonthField>;
export type Field = z.infer<typeof Field>;
export type ForeignKeyReference = z.infer<typeof ForeignKeyReference>;
export type ForeignKey = z.infer<typeof ForeignKey>;
export type TableSchema = z.infer<typeof TableSchema>;
export type Source = z.infer<typeof Source>;
export type Contributor = z.infer<typeof Contributor>;
export type Resource = z.infer<typeof Resource>;
export type License = z.infer<typeof License>;
export type DataPackage = z.infer<typeof DataPackage>;
export type CSVDialect = z.infer<typeof CSVDialect>;
