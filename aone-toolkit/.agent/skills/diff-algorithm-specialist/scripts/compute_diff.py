#!/usr/bin/env python3
import sys
import difflib

def compute_diff(file1, file2):
    """
    Computes unified diff between two files using Python difflib (Standard library).
    """
    try:
        with open(file1, 'r', encoding='utf-8') as f1, open(file2, 'r', encoding='utf-8') as f2:
            lines1 = f1.readlines()
            lines2 = f2.readlines()
            
        print(f"--- {file1}")
        print(f"+++ {file2}")
        
        diff = difflib.unified_diff(
            lines1, lines2, 
            fromfile=file1, tofile=file2,
            lineterm=""
        )
        
        has_diff = False
        for line in diff:
            has_diff = True
            if line.startswith('---') or line.startswith('+++'):
                continue # Skip headers already printed
            print(line)
            
        if not has_diff:
            print("Files are identical.")
            return True

    except Exception as e:
        print(f"❌ Error computing diff: {e}")
        return False
        
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python compute_diff.py <old_file> <new_file>")
        sys.exit(1)
    
    compute_diff(sys.argv[1], sys.argv[2])
