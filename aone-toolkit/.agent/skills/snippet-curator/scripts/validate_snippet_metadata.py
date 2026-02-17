#!/usr/bin/env python3
import sys
import json

def validate_snippet(filepath):
    """
    Checks if a snippet (in JSON/Markdown metadata) has required fields.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading JSON: {e}")
        return False

    required = ["title", "language", "code"]
    errors = []
    
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: '{field}'")
            
    if "language" in data:
        lang = data["language"].lower()
        if lang not in ["javascript", "python", "css", "html", "sql", "typescript"]:
             print(f"⚠️ Warning: Unusual language '{lang}'")

    if "code" in data:
        code_len = len(data["code"].splitlines())
        if code_len > 100:
             print(f"⚠️ Warning: Snippet is long ({code_len} lines). Consider a module.")

    if errors:
        print("\n❌ Snippet Invalid:")
        for e in errors:
            print(f"  - {e}")
        return False

    print(f"✅ Snippet '{data.get('title', 'Unknown')}' Valid.")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_snippet_metadata.py <snippet.json>")
        sys.exit(1)
    
    validate_snippet(sys.argv[1])
