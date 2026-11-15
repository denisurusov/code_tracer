# Unit tests for the semantic gate policy: opa test --v1-compatible gate/policy
package codetracer.gate_test

import rego.v1

import data.codetracer.gate

base_policy := {
	"product_types": {"library": ["unit", "sca"]},
	"categories": {
		"unit": {"signers": ["ci-pipeline"]},
		"sca": {"signers": ["ci-pipeline"], "allow_warned": true},
		"load": {"signers": ["perf-env"], "environment_spec_required_fields": ["compute.vcpu", "network.topology"]},
	},
}

base_catalog := {
	"product": {"type": "library", "purl": "pkg:npm/x@1.0.0"},
	"tests": [
		{"id": "UNIT-001", "category": "unit"},
		{"id": "UNIT-002", "category": "unit"},
		{"id": "SCA-001", "category": "sca"},
		{"id": "LOAD-001", "category": "load"},
	],
}

att(category, passed, warned, failed, result) := {
	"category": category,
	"predicate": {"result": result, "passedTests": passed, "warnedTests": warned, "failedTests": failed},
	"environment_spec": null,
	"vex_document": null,
}

input_with(atts) := {"policy": base_policy, "catalog": base_catalog, "source_digest": "abc", "attestations": atts}

rules(denies) := {d.rule | some d in denies}

test_all_good_admits if {
	denies := gate.deny with input as input_with([
		att("unit", ["UNIT-001", "UNIT-002"], [], [], "PASSED"),
		att("sca", [], ["SCA-001"], [], "WARNED"),
	])
	count(denies) == 0
}

test_missing_test_is_g09 if {
	denies := gate.deny with input as input_with([
		att("unit", ["UNIT-001"], [], [], "PASSED"),
		att("sca", ["SCA-001"], [], [], "PASSED"),
	])
	rules(denies) == {"G09"}
}

test_warned_not_allowed_is_g10 if {
	denies := gate.deny with input as input_with([
		att("unit", ["UNIT-001"], ["UNIT-002"], [], "WARNED"),
		att("sca", ["SCA-001"], [], [], "PASSED"),
	])
	rules(denies) == {"G10"}
}

test_missing_category_is_g12 if {
	denies := gate.deny with input as input_with([att("unit", ["UNIT-001", "UNIT-002"], [], [], "PASSED")])
	rules(denies) == {"G12"}
}

test_incomplete_env_spec_is_g11 if {
	load := object.union(att("load", ["LOAD-001"], [], [], "PASSED"), {"environment_spec": {
		"compute": {"vcpu": 4},
		"system_under_test": {"source_digest": "sha256:abc"},
	}})
	denies := gate.deny with input as input_with([
		att("unit", ["UNIT-001", "UNIT-002"], [], [], "PASSED"),
		att("sca", ["SCA-001"], [], [], "PASSED"),
		load,
	])
	some d in denies
	d.rule == "G11"
	contains(d.detail, "network.topology")
}

vex_doc(proof) := {"statements": [{
	"vulnerability": {"name": "DEMO-1"},
	"status": "not_affected",
	"justification": "vulnerable_code_not_present",
	"products": [{"@id": "pkg:npm/x@1.0.0", "subcomponents": [{"@id": "pkg:npm/dep@2.0.0"}]}],
	"x-code-tracer-proof": proof,
}]}

sca_with_vex(proof) := object.union(att("sca", ["SCA-001"], [], [], "PASSED"), {
	"predicate": {"result": "PASSED", "passedTests": ["SCA-001"], "warnedTests": [], "failedTests": [], "x-code-tracer": {"vexApplied": [{
		"vulnerability": "DEMO-1", "subcomponent": "pkg:npm/dep@2.0.0", "status": "not_affected",
	}]}},
	"vex_document": vex_doc(proof),
})

test_vex_with_passed_proof_admits if {
	denies := gate.deny with input as input_with([att("unit", ["UNIT-001", "UNIT-002"], [], [], "PASSED"), sca_with_vex(["UNIT-001"])])
	count(denies) == 0
}

test_vex_without_proof_is_g13 if {
	denies := gate.deny with input as input_with([att("unit", ["UNIT-001", "UNIT-002"], [], [], "PASSED"), sca_with_vex([])])
	rules(denies) == {"G13"}
}

test_vex_with_unknown_proof_is_g13 if {
	denies := gate.deny with input as input_with([att("unit", ["UNIT-001", "UNIT-002"], [], [], "PASSED"), sca_with_vex(["UNIT-999"])])
	rules(denies) == {"G13"}
}
