# Test evidence records

One record per build, newest first. Each is written by the bank-side gate job after it fetched the build and its evidence from the Maven repository and checked them. Releases (`demo-v<version>` tags) are the bank-bound builds, gated under the `release` profile; other builds are gated under `development`.

| Version | Built | Gate profile | Verdict | Record | Release |
|---|---|---|---|---|---|
| 0.1.0-ci.7 | 2026-11-16 | — | ADMIT | [records/0.1.0-ci.7.md](records/0.1.0-ci.7.md) | — |
