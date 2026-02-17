#!/usr/bin/env python3
import sys
import re

def test_regex(pattern, test_strings):
    """
    Tests a regex pattern against a list of strings (provided as comma-separated or space-separated).
    """
    try:
        regex = re.compile(pattern)
        print(f"✅ Regex Compiled: /{pattern}/")
    except re.error as e:
        print(f"❌ Invalid Regex: {e}")
        return False
        
    match_count = 0
    
    strings = test_strings.split(',') # Simple CSV split for CLI
    if len(strings) == 1 and ' ' in strings[0]:
         strings = strings[0].split() # Build space separated support

    for s in strings:
        clean_s = s.strip()
        if not clean_s: continue
        
        match = regex.search(clean_s)
        if match:
            print(f"  ✅ MATCH:    '{clean_s}'")
            # Show groups if any
            if match.groups():
                print(f"     Groups: {match.groups()}")
            match_count += 1
        else:
            print(f"  ❌ NO MATCH: '{clean_s}'")
            
    print(f"\nSummary: {match_count}/{len(strings)} matched.")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python test_regex.py <pattern> <string1,string2,...>")
        sys.exit(1)
    
    test_regex(sys.argv[1], sys.argv[2])
