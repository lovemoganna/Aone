#!/usr/bin/env python3
import sys

def validate_css(filepath):
    """
    Checks for basic CSS syntax issues like unbalanced braces.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    errors = []
    brace_balance = 0
    
    lines = content.splitlines()
    for i, line in enumerate(lines, 1):
        clean = line.strip()
        brace_balance += clean.count('{')
        brace_balance -= clean.count('}')

        if brace_balance < 0:
            errors.append(f"Line {i}: Unexpected closing brace '}}'.")
            brace_balance = 0 # reset

    if brace_balance > 0:
        errors.append(f"Unclosed braces: {brace_balance} blocks open.")

    if not errors:
        print(f"✅ CSS Syntax (Basic) Valid.")
        return True
    
    print("\n❌ Errors Found:")
    for e in errors:
        print(f"  - {e}")
    return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_css.py <file.css>")
        sys.exit(1)
    
    success = validate_css(sys.argv[1])
    sys.exit(0 if success else 1)
