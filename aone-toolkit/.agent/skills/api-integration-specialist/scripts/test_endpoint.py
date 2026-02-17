#!/usr/bin/env python3
import sys
import urllib.request
import urllib.error

def test_url(url):
    """
    Checks if a URL is reachable (HTTP 200).
    """
    print(f"Testing connectivity to: {url}")
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            status = response.getcode()
            print(f"✅ Success! Status Code: {status}")
            return True
    except urllib.error.HTTPError as e:
        print(f"⚠️ HTTP Error: {e.code} - {e.reason}")
        return False
    except urllib.error.URLError as e:
        print(f"❌ Connection Failed: {e.reason}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_endpoint.py <url>")
        sys.exit(1)
    
    success = test_url(sys.argv[1])
    sys.exit(0 if success else 1)
