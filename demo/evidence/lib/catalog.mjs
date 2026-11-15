import { readFileSync } from "node:fs";
import { parse } from "yaml";

export const CATALOG_PATH = "tests/catalog.yaml";

export function loadCatalog(path = CATALOG_PATH) {
  return parse(readFileSync(path, "utf8"));
}

export function idsFor(catalog, category) {
  return catalog.tests.filter((t) => t.category === category).map((t) => t.id);
}

/** Scenario files for a category, deduplicated, in catalog order. */
export function scenariosFor(catalog, category) {
  return [...new Set(catalog.tests.filter((t) => t.category === category).map((t) => t.scenario))];
}
