#!/usr/bin/env python3
import sys
import json

def validate_data(filepath):
    """
    Checks if a JSON file is a valid dataset (Array of Consistent Objects).
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading/parsing JSON: {e}")
        return False

    if not isinstance(data, list):
        print("❌ Data must be an Array of objects.")
        return False

    if not data:
        print("⚠️ Data is empty.")
        return True

    # Check key consistency
    keys = set(data[0].keys())
    missing_count = 0
    extra_count = 0

    for i, item in enumerate(data):
        if not isinstance(item, dict):
            print(f"❌ Item at index {i} is not an object.")
            return False
            
        current_keys = set(item.keys())
        if current_keys != keys:
            missing = keys - current_keys
            extra = current_keys - keys
            if missing: missing_count += 1
            if extra: extra_count += 1

    if missing_count or extra_count:
        print(f"⚠️ Inconsistent Schema Detected!")
        print(f" - Missing props in {missing_count} items.")
        print(f" - Extra props in {extra_count} items.")
        return False

    print(f"✅ Data Valid! ({len(data)} records, {len(keys)} columns)")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_dataset.py <data.json>")
        sys.exit(1)
    
    success = validate_data(sys.argv[1])
    sys.exit(0 if success else 1)
