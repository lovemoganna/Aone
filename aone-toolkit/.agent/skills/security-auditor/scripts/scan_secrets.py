#!/usr/bin/env python3
import sys
import re
import os

PATTERNS = {
    "AWS Access Key": r"AKIA[0-9A-Z]{16}",
    "Generic Private Key": r"-----BEGIN [A-Z]+ PRIVATE KEY-----",
    "Stripe Secret": r"sk_live_[0-9a-zA-Z]{24}",
    "Slack Token": r"xox[baprs]-([0-9a-zA-Z]{10,48})"
}

def scan_file(filepath):
    """
    Scans a file for potential secrets.
    """
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        found = False
        for name, pattern in PATTERNS.items():
            matches = re.finditer(pattern, content)
            for match in matches:
                found = True
                print(f"⚠️ POTENTIAL LEAK in {filepath}: {name}")
                # Don't print the secret itself for safety logs
                print(f"  Match at index {match.start()}")
        
        if not found:
            print(f"✅ Clean: {filepath}")
            return True
            
        return False
        
    except Exception as e:
        print(f"❌ Error scanning {filepath}: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scan_secrets.py <file>")
        sys.exit(1)
    
    scan_file(sys.argv[1])
