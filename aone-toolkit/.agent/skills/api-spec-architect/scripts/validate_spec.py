#!/usr/bin/env python3
import sys

def validate_openapi_file(filepath):
    """
    Checks if an OpenAPI YAML file has basic structure validity.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    has_version = False
    has_paths = False
    has_info = False

    for line in lines:
        clean = line.strip()
        if clean.startswith("openapi:") or clean.startswith("swagger:"):
            has_version = True
        if clean.startswith("info:"):
            has_info = True
        if clean.startswith("paths:"):
            has_paths = True

    if not has_version:
        print("❌ Missing 'openapi:' or 'swagger:' version declaration.")
        return False
    if not has_info:
        print("❌ Missing 'info:' section.")
        return False
    if not has_paths:
        print("❌ Missing 'paths:' section.")
        return False

    print("✅ OpenAPI Structure Looks Valid (Basic Check Passed)")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_spec.py <file.yaml>")
        sys.exit(1)
    
    success = validate_openapi_file(sys.argv[1])
    sys.exit(0 if success else 1)
