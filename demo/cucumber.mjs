// One cucumber profile per test category. Each writes JUnit XML (converted to
// CTRF by the evidence pipeline) and Cucumber Messages (kept as a native report).
const profile = (category) => ({
  paths: [`tests/features/${category}/*.feature`],
  import: ["tests/features/steps/*.mjs"],
  format: [
    `junit:out/raw/${category}/junit.xml`,
    `message:out/raw/${category}/messages.ndjson`,
    "summary",
  ],
  formatOptions: { junit: { suiteName: category } },
});

export const integration = profile("integration");
export const contract = profile("contract");
export const uat = profile("uat");
export default profile("integration");
