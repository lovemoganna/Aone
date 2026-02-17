#!/usr/bin/env python3
import sys

def lint_yaml_basic(filepath):
    """
    Very basic YAML linter checking for common indentation sins
    since standard lib doesn't have a YAML parser.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    errors = []
    
    for i, line in enumerate(lines, 1):
        # 1. Check for tabs
        if '\t' in line:
            errors.append(f"Line {i}: Found TAB character. YAML forbids tabs for indentation.")
        
        # 2. Check for suspicious booleans without quotes
        clean = line.strip()
        if ':' in clean:
             val = clean.split(':', 1)[1].strip().lower()
             if val in ['yes', 'no', 'on', 'off']:
                  print(f"⚠️ Warning Line {i}: Ambiguous boolean '{val}' without quotes. Recommending 'true'/'false' or quotes.")

    if errors:
        print("\n❌ YAML Lint Errors:")
        for e in errors:
            print(f"  - {e}")
        return False
        
    print(f"✅ YAML Basic Lint Passed on {len(lines)} lines.")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python lint_yaml.py <file.yaml>")
        sys.exit(1)
    
    success = lint_yaml_basic(sys.argv[1])
    sys.exit(0 if success else 1)
