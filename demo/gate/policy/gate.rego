# Semantic gate rules (architecture §7: "Rego / OPA — the semantic gate the
# meaning-checks run in"). The JavaScript verifier does the structural checks
# (signatures, signer identity, digests) and passes only attestations whose
# signature and signer verified. This policy decides what the evidence means.
#
# input:
#   policy          gate/policy.yaml as JSON
#   catalog         tests/catalog.yaml as JSON
#   source_digest   sha256 of the clone's source manifest
#   artifact_digest sha256 of the delivered jar
#   product_purl    purl of the delivered package, with version
#   attestations[]  { category, kind (test-result | provenance), predicate, environment_spec, vex_document }
package codetracer.gate

import rego.v1

# Every admitted attestation (for G12), and the test-result ones (for G09-G11, G13).
all_atts := {a.category: a | some a in input.attestations}

atts := {a.category: a | some a in input.attestations; a.kind == "test-result"}

required := {c | some c in input.policy.product_types[input.catalog.product.type]}

catalog_ids(cat) := {t.id | some t in input.catalog.tests; t.category == cat}

all_catalog_ids := {t.id | some t in input.catalog.tests}

reported(a) := ({id | some id in a.predicate.passedTests} | {id | some id in a.predicate.warnedTests}) | {id | some id in a.predicate.failedTests}

# ---------- G09 coverage-complete ----------
deny contains {"rule": "G09", "category": cat, "detail": sprintf("not reported: %s", [concat(", ", sort(missing))])} if {
	some cat, a in atts
	missing := catalog_ids(cat) - reported(a)
	count(missing) > 0
}

# ---------- G10 result-acceptable ----------
allow_warned(cat) if input.policy.categories[cat].allow_warned == true

allowed_results(cat) := {"PASSED", "WARNED"} if allow_warned(cat)

else := {"PASSED"}

warned_ok(cat, _) if allow_warned(cat)

warned_ok(_, a) if count(a.predicate.warnedTests) == 0

result_ok(cat, a) if {
	a.predicate.result in allowed_results(cat)
	count(a.predicate.failedTests) == 0
	warned_ok(cat, a)
}

deny contains {"rule": "G10", "category": cat, "detail": detail} if {
	some cat, a in atts
	not result_ok(cat, a)
	detail := sprintf("result %s; failed: %v; warned: %v", [a.predicate.result, a.predicate.failedTests, a.predicate.warnedTests])
}

# ---------- G11 environment-spec-complete ----------
spec_fields(cat) := input.policy.categories[cat].environment_spec_required_fields

blank(v) if v == null

blank(v) if v == ""

deny contains {"rule": "G11", "category": cat, "detail": "no environment spec"} if {
	some cat, a in atts
	spec_fields(cat)
	a.environment_spec == null
}

deny contains {"rule": "G11", "category": cat, "detail": sprintf("missing: %s", [concat(", ", sort(missing))])} if {
	some cat, a in atts
	spec := a.environment_spec
	spec != null
	missing := {f | some f in spec_fields(cat); blank(object.get(spec, split(f, "."), null))}
	count(missing) > 0
}

deny contains {"rule": "G11", "category": cat, "detail": "spec describes a different source digest"} if {
	some cat, a in atts
	spec_fields(cat)
	spec := a.environment_spec
	spec != null
	spec.system_under_test.source_digest != concat("", ["sha256:", input.source_digest])
}

deny contains {"rule": "G11", "category": cat, "detail": "spec describes a different artifact than the delivered jar"} if {
	some cat, a in atts
	spec_fields(cat)
	spec := a.environment_spec
	spec != null
	input.artifact_digest != null
	spec.system_under_test.artifact_digest != concat("", ["sha256:", input.artifact_digest])
}

# ---------- G12 required-categories-present ----------
deny contains {"rule": "G12", "category": "*", "detail": sprintf("missing for %s: %s", [input.catalog.product.type, concat(", ", sort(missing))])} if {
	missing := {c | some c in required; not all_atts[c]}
	count(missing) > 0
}

# ---------- G13 vex-backed-by-proof ----------
# A VEX statement that suppressed a finding is evidence only if it is in the
# attested OpenVEX document, has an allowed status and justification, and cites
# proof tests that are in the catalog and passed in an admitted attestation.
justifications := {
	"component_not_present",
	"vulnerable_code_not_present",
	"vulnerable_code_not_in_execute_path",
	"vulnerable_code_cannot_be_controlled_by_adversary",
	"inline_mitigations_already_exist",
}

passed_anywhere(id) if {
	some a in atts
	id in a.predicate.passedTests
}

applied := [[cat, a, v] |
	some cat, a in atts
	some v in object.get(a.predicate, ["x-code-tracer", "vexApplied"], [])
]

vex_statement(a, v) := s if {
	some s in a.vex_document.statements
	s.vulnerability.name == v.vulnerability
	s.status == v.status
	some p in s.products
	product_matches(p["@id"])
	some c in p.subcomponents
	c["@id"] == v.subcomponent
}

proof(s) := object.get(s, "x-code-tracer-proof", [])

# A VEX product identifier names the delivered package exactly, or by versionless purl (every version).
product_matches(id) if id == input.product_purl

product_matches(id) if {
	id == input.catalog.product.purl
	startswith(input.product_purl, concat("", [id, "@"]))
}

vex_issue contains [cat, v, "no matching statement in the attested OpenVEX document"] if {
	some [cat, a, v] in applied
	not vex_statement(a, v)
}

vex_issue contains [cat, v, sprintf("status %s cannot suppress a finding", [v.status])] if {
	some [cat, _, v] in applied
	not v.status in {"not_affected", "fixed"}
}

vex_issue contains [cat, v, sprintf("justification %v is not an OpenVEX justification", [s.justification])] if {
	some [cat, a, v] in applied
	s := vex_statement(a, v)
	s.status == "not_affected"
	not s.justification in justifications
}

vex_issue contains [cat, v, "no proof test cited (x-code-tracer-proof)"] if {
	some [cat, a, v] in applied
	s := vex_statement(a, v)
	count(proof(s)) == 0
}

vex_issue contains [cat, v, sprintf("proof test %s is not in the catalog", [id])] if {
	some [cat, a, v] in applied
	s := vex_statement(a, v)
	some id in proof(s)
	not id in all_catalog_ids
}

vex_issue contains [cat, v, sprintf("proof test %s did not pass in any admitted attestation", [id])] if {
	some [cat, a, v] in applied
	s := vex_statement(a, v)
	some id in proof(s)
	id in all_catalog_ids
	not passed_anywhere(id)
}

deny contains {"rule": "G13", "category": cat, "detail": sprintf("%s on %s: %s", [v.vulnerability, v.subcomponent, msg])} if {
	some [cat, v, msg] in vex_issue
}
