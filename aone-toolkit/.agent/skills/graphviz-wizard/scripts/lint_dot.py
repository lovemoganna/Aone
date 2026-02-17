#!/usr/bin/env python3
import sys
import re

def lint_dot_file(filepath):
    """
    Checks if a DOT file has basic consistency and valid syntax.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.splitlines()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    errors = []
    
    # 1. Determine Graph Type
    is_digraph = re.search(r'\bdigraph\b', content)
    is_graph = re.search(r'\bgraph\b', content)
    
    if is_digraph and is_graph:
        # It's possible to have "graph" inside "digraph" as subgraph..
        # But usually the top-level kw determines edge type.
        pass 
    elif not is_digraph and not is_graph:
        errors.append("File must start with 'digraph' or 'graph'.")

    # 2. Check Edge Operators
    for idx, line in enumerate(lines, 1):
        clean_line = line.strip()
        if clean_line.startswith("//") or clean_line.startswith("#"):
            continue

        if is_digraph:
            if "--" in clean_line and "->" not in clean_line and not "label" in clean_line:
                # heuristic: double dash in digraph is usually error, unless part of label or attribute
                # This is a weak check but catches common mistakes.
                # Actually, -- is valid in digraph? No, edge op is ->.
                # But -- might appear in strings.
                if not '"' in clean_line: 
                     errors.append(f"Line {idx}: Found '--' in digraph. Use '->' for directed edges.")

        if is_graph and not is_digraph:
             if "->" in clean_line and "--" not in clean_line and not "label" in clean_line:
                if not '"' in clean_line:
                    errors.append(f"Line {idx}: Found '->' in graph. Use '--' for undirected edges.")

    # 3. Check Braces
    brace_balance = content.count('{') - content.count('}')
    if brace_balance != 0:
        errors.append(f"Unbalanced braces: {brace_balance} (positive=missing closing, negative=extra closing).")

    if errors:
        print("\n❌ Lint Checks Failed:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("\n✅ Syntax Looks Good (Basic Check Passed)")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python lint_dot.py <file.dot>")
        sys.exit(1)
    
    success = lint_dot_file(sys.argv[1])
    sys.exit(0 if success else 1)
