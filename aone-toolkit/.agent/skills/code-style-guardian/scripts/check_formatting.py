#!/usr/bin/env python3
import sys

def check_file(filepath):
    """
    Scans a file for basic stylistic sins:
    - Trailing whitespace
    - Mixed tabs/spaces (heuristic)
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    errors = []
    
    has_tabs = False
    has_spaces = False
    
    for i, line in enumerate(lines, 1):
        stripped = line.rstrip('\n')
        
        # Check trailing whitespace
        if stripped != stripped.rstrip():
            errors.append(f"Line {i}: Trailing whitespace detected.")

        # Check indentation type
        leading_space = line[:len(line)-len(line.lstrip())]
        if '\t' in leading_space:
            has_tabs = True
        if ' ' in leading_space:
            has_spaces = True

    if has_tabs and has_spaces:
        errors.append("File contains mixed tabs and spaces for indentation.")

    if errors:
        print("\n❌ Format Checks Failed:")
        # Limit output
        for err in errors[:5]:
            print(f"  - {err}")
        if len(errors) > 5:
            print(f"  ... and {len(errors)-5} more.")
        return False
    else:
        print(f"✅ Style OK (Basic check passed on {len(lines)} lines)")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_formatting.py <file>")
        sys.exit(1)
    
    success = check_file(sys.argv[1])
    sys.exit(0 if success else 1)
