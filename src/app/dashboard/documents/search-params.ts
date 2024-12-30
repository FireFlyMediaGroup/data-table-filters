import {
  createParser,
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  parseAsTimestamp,
  type inferParserType,
} from "nuqs/server";
import { ARRAY_DELIMITER, RANGE_DELIMITER, SORT_DELIMITER } from "@/lib/delimiters";
import { DocumentStatus } from "@prisma/client";

const parseAsSort = createParser({
  parse(queryValue) {
    const [id, desc] = queryValue.split(SORT_DELIMITER);
    if (!id && !desc) return null;
    return { id, desc: desc === "desc" };
  },
  serialize(value) {
    return `${value.id}.${value.desc ? "desc" : "asc"}`;
  },
});

export const searchParamsParser = {
  // Filters
  status: parseAsArrayOf(parseAsStringLiteral(Object.values(DocumentStatus)), ARRAY_DELIMITER),
  documentType: parseAsArrayOf(parseAsStringLiteral(["POWRA", "FPL_MISSION", "TAILBOARD"]), ARRAY_DELIMITER),
  createdAt: parseAsArrayOf(parseAsTimestamp, RANGE_DELIMITER),
  updatedAt: parseAsArrayOf(parseAsTimestamp, RANGE_DELIMITER),
  rpic: parseAsString,
  // Required for sorting & pagination
  sort: parseAsSort,
  size: parseAsInteger.withDefault(10),
  page: parseAsInteger.withDefault(1),
  // Required for selection
  uuid: parseAsString,
};

export const searchParamsCache = createSearchParamsCache(searchParamsParser);

export const searchParamsSerializer = createSerializer(searchParamsParser);

export type SearchParamsType = inferParserType<typeof searchParamsParser>;
