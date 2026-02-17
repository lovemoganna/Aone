#!/usr/bin/env python3
import sys
import re

def check_sql(filepath):
    """
    Checks for basic SQL syntax consistency in a schema file.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    statements = content.split(';')
    errors = []
    
    table_count = 0
    
    for stmt in statements:
        clean = stmt.strip()
        if not clean: continue
        
        # Heuristic check for Create Table
        if 'CREATE TABLE' in clean.upper():
            table_count += 1
            if '(' not in clean or ')' not in clean:
                errors.append(f"CREATE TABLE statement seems malformed (missing parenthesis): {clean[:30]}...")

        # Naming check
        match = re.search(r'CREATE TABLE (\w+)', clean, re.IGNORECASE)
        if match:
            table_name = match.group(1)
            if not table_name.islower():
                errors.append(f"Table '{table_name}' should be lowercase.")

    if not table_count and not errors:
        print("⚠️ No CREATE TABLE statements found.")
    
    if errors:
        print("\n❌ SQL Issues:")
        for e in errors:
            print(f"  - {e}")
        return False

    print(f"✅ SQL Syntax (Basic) Valid. Found {table_count} tables.")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_sql_syntax.py <schema.sql>")
        sys.exit(1)
    
    success = check_sql(sys.argv[1])
    sys.exit(0 if success else 1)
