#!/usr/bin/env python3
import sys
import json

def check_agent_config(filepath):
    """
    Checks if an agent configuration file (JSON) has required fields.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except Exception as e:
        print(f"❌ Error reading config: {e}")
        return False

    required_fields = ["name", "model", "systemPrompt"]
    optional_fields = ["tools", "temperature", "maxTokens"]

    errors = []
    
    if not isinstance(config, dict):
         errors.append("Config root must be an object.")
    else:
        for field in required_fields:
            if field not in config:
                errors.append(f"Missing required field: '{field}'")
        
        if "tools" in config and not isinstance(config["tools"], list):
            errors.append("'tools' must be a list (array).")

    if errors:
        print("\n❌ Configuration Incomplete:")
        for e in errors:
            print(f"  - {e}")
        return False

    print(f"✅ Agent '{config.get('name', 'Unknown')}' Configuration Valid.")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_agent_config.py <config.json>")
        sys.exit(1)
    
    success = check_agent_config(sys.argv[1])
    sys.exit(0 if success else 1)
