#!/usr/bin/env python3
import sys
import re
import shlex

def parse_curl_command(curl_str):
    """
    Simulates parsing of a cURL command string.
    """
    clean = curl_str.strip().replace("\\\n", " ") # Remove continuations
    
    try:
        parts = shlex.split(clean)
    except Exception as e:
        print(f"❌ Error parsing shell syntax: {e}")
        return

    method = "GET" # Default
    url = "?"
    headers = []
    data = None

    for i, part in enumerate(parts):
        if part.lower().startswith('http'):
            url = part
        elif part == '-X' or part == '--request':
            if i + 1 < len(parts):
                method = parts[i+1]
        elif part == '-H' or part == '--header':
            if i + 1 < len(parts):
                headers.append(parts[i+1])
        elif part == '-d' or part == '--data' or part == '--data-raw':
            if i + 1 < len(parts):
                data = parts[i+1]
                if method == "GET": method = "POST" # Implicit POST

    print("✅ Parsed cURL:")
    print(f"  Method:  {method}")
    print(f"  URL:     {url}")
    print(f"  Headers: {len(headers)}")
    for h in headers:
        print(f"    - {h}")
    if data:
        print(f"  Data:    {data[:50]}...") # Truncate

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python parse_curl.py 'curl ...'")
        sys.exit(1)
    
    parse_curl_command(sys.argv[1])
