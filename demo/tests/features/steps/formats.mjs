// Minimal "date-time" format for ajv, to avoid another dependency.
export default function addFormats(ajv) {
  ajv.addFormat("date-time", {
    type: "string",
    validate: (s) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(s) && !Number.isNaN(Date.parse(s)),
  });
  return ajv;
}
