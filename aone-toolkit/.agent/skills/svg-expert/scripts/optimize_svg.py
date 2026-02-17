#!/usr/bin/env python3
import sys
import re

def optimize_svg(filepath):
    """
    Rudimentary SVG optimizer: Reduces float precision in path data.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    original_size = len(content)
    
    # Regex to find float numbers with >2 decimal places in attributes
    # Only optimizing clear numeric sequences to be safe
    def round_match(match):
        num_str = match.group(0)
        try:
            num = float(num_str)
            return f"{num:.2f}"
        except:
            return num_str

    # Only target numbers inside d="..." or points="..."
    # This is a simplification! Real SVGO is complex.
    # We will just scan for number-like patterns globally for this demo (risky but effective for simple paths)
    # Pattern: Digit . Digit{3,}
    optimized = re.sub(r'(\d+\.\d{3,})', round_match, content)

    new_size = len(optimized)
    savings = original_size - new_size
    
    print(f"Original: {original_size} bytes")
    print(f"Optimized: {new_size} bytes")
    print(f"Savings: {savings} bytes ({(savings/original_size)*100:.1f}%)")
    
    # In a real tool we would overwrite, here we just show preview
    print("\nPreview (First 100 chars):")
    print(optimized[:100] + "...")
    
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python optimize_svg.py <file.svg>")
        sys.exit(1)
    
    optimize_svg(sys.argv[1])
