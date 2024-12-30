import { z } from "zod";
import { DocumentStatus } from "@prisma/client";

export const documentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.nativeEnum(DocumentStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
  user: z.object({
    name: z.string().nullable(),
    email: z.string(),
  }),
  documentType: z.enum(["POWRA", "FPL_MISSION", "TAILBOARD"]),
});

export type DocumentSchema = z.infer<typeof documentSchema>;

export const documentFilterSchema = z.object({
  status: z
    .string()
    .transform((val) => val.split(","))
    .pipe(z.nativeEnum(DocumentStatus).array())
    .optional(),
  documentType: z
    .string()
    .transform((val) => val.split(","))
    .pipe(z.enum(["POWRA", "FPL_MISSION", "TAILBOARD"]).array())
    .optional(),
  createdAt: z
    .string()
    .transform((val) => val.split("-").map(Number))
    .pipe(z.coerce.date().array())
    .optional(),
  updatedAt: z
    .string()
    .transform((val) => val.split("-").map(Number))
    .pipe(z.coerce.date().array())
    .optional(),
  rpic: z.string().optional(),
});

export type DocumentFilterSchema = z.infer<typeof documentFilterSchema>;
