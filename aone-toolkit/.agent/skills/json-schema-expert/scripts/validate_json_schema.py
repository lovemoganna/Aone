#!/usr/bin/env python3
import sys
import json

def validate_schema(filepath):
    """
    Checks if a JSON file looks like a valid JSON Schema.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading schema: {e}")
        return False

    if not isinstance(data, dict):
        print("❌ Schema root must be an object.")
        return False

    errors = []
    
    # Check for $schema keyword (recommended but optional)
    if "$schema" not in data:
        print("⚠️ Warning: Missing '$schema' declaration.")
    
    # Check for basic type definition
    if "type" not in data and "properties" not in data and "items" not in data and "$ref" not in data:
        errors.append("Schema seems empty (no 'type', 'properties', 'items', or '$ref').")

    # Basic strictness check
    if "additionalProperties" not in data and data.get("type") == "object":
         print("⚠️ Warning: 'additionalProperties' not defined (defaults to true).")

    if errors:
        print("\n❌ Schema Issues:")
        for e in errors:
            print(f"  - {e}")
        return False
        
    print("✅ JSON Schema Structure Valid.")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_json_schema.py <schema.json>")
        sys.exit(1)
    
    success = validate_schema(sys.argv[1])
    sys.exit(0 if success else 1)
