#!/usr/bin/env python3
import sys
import re

def validate_file(filepath):
    """
    Checks if a PlantUML file has basic syntactic validity.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    has_start = False
    has_end = False
    brace_balance = 0
    errors = []

    for idx, line in enumerate(lines, 1):
        clean_line = line.strip()
        
        # Check start/end
        if clean_line.startswith("@startuml") or clean_line.startswith("@startmindmap"):
            if has_start:
                errors.append(f"Line {idx}: Multiple @start... found.")
            has_start = True
        
        if clean_line.startswith("@enduml") or clean_line.startswith("@endmindmap"):
            if not has_start:
                errors.append(f"Line {idx}: @end... without @start...")
            has_end = True

        # Check braces (ignore comments)
        if not clean_line.startswith("'") and not clean_line.startswith("/'"):
            brace_balance += clean_line.count('{')
            brace_balance -= clean_line.count('}')
            
            if brace_balance < 0:
                errors.append(f"Line {idx}: Closing brace without opening brace.")
                brace_balance = 0 # Reset to avoid cascading errors

    if not has_start:
        errors.append("Missing @startuml or @startmindmap.")
    if not has_end:
        errors.append("Missing @enduml or @endmindmap.")
    if brace_balance > 0:
        errors.append(f"Unclosed braces detected ({brace_balance} open blocks).")

    if errors:
        print("\n❌ Validation Failed:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("\n✅ Syntax Valid (Basic Check Passed)")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_puml.py <file.puml>")
        sys.exit(1)
    
    success = validate_file(sys.argv[1])
    sys.exit(0 if success else 1)
