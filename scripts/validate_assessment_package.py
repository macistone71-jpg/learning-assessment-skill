#!/usr/bin/env python3
"""Structural validator for an AI assessment package. Standard-library only."""
import json
import sys
from pathlib import Path

VALID_STATUS = {"draft_ai", "rule_checked", "teacher_review", "subject_review", "approved", "active", "retired"}
VALID_STAKES = {"low", "medium", "high"}


def validate(data):
    errors, warnings = [], []
    required = ("meta", "brief", "sources", "knowledge_points", "blueprint", "items", "diagnostic_rules", "quality", "governance")
    for key in required:
        if key not in data:
            errors.append(f"missing top-level field: {key}")
    if errors:
        return errors, warnings

    if data["meta"].get("status") not in VALID_STATUS:
        errors.append("meta.status is invalid")
    stakes = data["brief"].get("stakes")
    if stakes not in VALID_STAKES:
        errors.append("brief.stakes is invalid")

    def id_set(items, label):
        values = [x.get("id") for x in items]
        if None in values:
            errors.append(f"{label} contains item without id")
        if len(values) != len(set(values)):
            errors.append(f"{label} contains duplicate ids")
        return set(values)

    source_ids = id_set(data["sources"], "sources")
    knowledge_ids = id_set(data["knowledge_points"], "knowledge_points")
    item_ids = id_set(data["items"], "items")

    for kp in data["knowledge_points"]:
        for sid in kp.get("source_ids", []):
            if sid not in source_ids:
                errors.append(f"knowledge point {kp.get('id')} references unknown source {sid}")

    blueprint_counts = {}
    for target in data.get("blueprint", {}).get("targets", []):
        kid = target.get("knowledge_id")
        if kid not in knowledge_ids:
            errors.append(f"blueprint references unknown knowledge point {kid}")
        blueprint_counts[kid] = blueprint_counts.get(kid, 0) + int(target.get("count", 0))

    actual_counts = {kid: 0 for kid in knowledge_ids}
    total_points = 0
    for item in data["items"]:
        iid = item.get("id")
        total_points += item.get("points", 0)
        for kid in item.get("knowledge_ids", []):
            if kid not in knowledge_ids:
                errors.append(f"item {iid} references unknown knowledge point {kid}")
            else:
                actual_counts[kid] += 1
        for sid in item.get("source_ids", []):
            if sid not in source_ids:
                errors.append(f"item {iid} references unknown source {sid}")
        if not item.get("explanation"):
            errors.append(f"item {iid} has no explanation")
        if item.get("type") == "single_choice":
            option_ids = [x.get("id") for x in item.get("options", [])]
            if not option_ids or len(option_ids) != len(set(option_ids)):
                errors.append(f"item {iid} has missing or duplicate option ids")
            if item.get("answer") not in option_ids:
                errors.append(f"item {iid} answer is not an option id")
        if stakes in {"medium", "high"} and item.get("review_status") in {None, "draft_ai"}:
            errors.append(f"item {iid} requires human review for {stakes}-stakes assessment")

    expected_points = data["brief"].get("total_points")
    if expected_points != total_points:
        errors.append(f"item points total {total_points} != brief.total_points {expected_points}")

    for kid, count in blueprint_counts.items():
        if actual_counts.get(kid, 0) < count:
            errors.append(f"knowledge point {kid} has {actual_counts.get(kid, 0)} items, blueprint requires {count}")

    for rule in data["diagnostic_rules"]:
        kid = rule.get("knowledge_id")
        if kid not in knowledge_ids:
            errors.append(f"diagnostic rule references unknown knowledge point {kid}")
        refs = rule.get("item_ids", [])
        for iid in refs:
            if iid not in item_ids:
                errors.append(f"diagnostic rule for {kid} references unknown item {iid}")
        if rule.get("minimum_evidence_count", 0) > len(refs):
            warnings.append(f"diagnostic rule for {kid} asks for more evidence than listed items")

    if data["meta"].get("status") in {"approved", "active"} and data["quality"].get("hard_failures"):
        errors.append("approved/active package still has hard failures")
    return errors, warnings


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: validate_assessment_package.py assessment-package.json")
    path = Path(sys.argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))
    errors, warnings = validate(data)
    for msg in warnings:
        print(f"WARN: {msg}")
    for msg in errors:
        print(f"ERROR: {msg}")
    if errors:
        raise SystemExit(1)
    print("OK: assessment package structure is valid")


if __name__ == "__main__":
    main()
