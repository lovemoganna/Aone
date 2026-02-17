#!/usr/bin/env python3
import sys
import base64

def try_decode(data):
    """
    Attempts to decode a string as Base64.
    """
    stripped = data.strip().replace(" ", "+") # Assume standard
    
    # Pad if needed
    missing_padding = len(stripped) % 4
    if missing_padding:
        stripped += '=' * (4 - missing_padding)

    try:
        decoded_bytes = base64.b64decode(stripped, validate=True)
        text = decoded_bytes.decode('utf-8')
        print(f"✅ Decoded (UTF-8):\n{text}")
        return True
    except UnicodeDecodeError:
        print(f"✅ Decoded (Binary Hex):\n{decoded_bytes.hex()}")
        return True
    except Exception as e:
        print(f"❌ Error decoding Base64: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python decode_base64.py <string>")
        sys.exit(1)
    
    try_decode(sys.argv[1])
