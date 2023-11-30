import { z } from "zod";

export const BaseField = z.object({
  name: z.string(),
  type: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  missingValues: z.array(z.string()).optional(),
});

export const AnyField = BaseField.extend({
  type: z.literal("any"),
});

export const ArrayField = BaseField.extend({
  type: z.literal("array"),
  arrayItem: z.record(z.any()).optional(),
});

export const BooleanField = BaseField.extend({
  type: z.literal("boolean"),
  trueValues: z.array(z.string()).optional(),
  falseValues: z.array(z.string()).optional(),
});

export const DateField = BaseField.extend({
  type: z.literal("date"),
});

export const DatetimeField = BaseField.extend({
  type: z.literal("datetime"),
});

export const DurationField = BaseField.extend({
  type: z.literal("duration"),
});

export const GeojsonField = BaseField.extend({
  type: z.literal("geojson"),
});

export const GeopointField = BaseField.extend({
  type: z.literal("geopoint"),
});

export const IntegerField = BaseField.extend({
  type: z.literal("integer"),
  bareNumber: z.boolean().optional(),
  groupChar: z.string().optional(),
});

export const NumberField = BaseField.extend({
  type: z.literal("number"),
  bareNumber: z.boolean().optional(),
  groupChar: z.string().optional(),
  decimalChar: z.string().optional(),
});

export const ObjectField = BaseField.extend({
  type: z.literal("object"),
});

export const StringField = BaseField.extend({
  type: z.literal("string"),
});

export const TimeField = BaseField.extend({
  type: z.literal("time"),
});

export const YearField = BaseField.extend({
  type: z.literal("year"),
});

export const YearmonthField = BaseField.extend({
  type: z.literal("yearmonth"),
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

export const Schema = z.object({
  fields: z.array(Field),
  missingValues: z.array(z.string()).optional(),
  primaryKey: z.array(z.string()).optional(),
  foreignKeys: z.array(ForeignKey).optional(),
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
export type Schema = z.infer<typeof Schema>;
