#!/usr/bin/env python3
import sys

def estimate_tokens(text):
    """
    Roughly estimates token count (1 token ~= 4 chars).
    """
    char_count = len(text)
    word_count = len(text.split())
    # Hybrid heuristic: Average of word-based (0.75 per word) and char-based (4 per token)
    
    token_est_chars = char_count / 4.0
    token_est_words = word_count / 0.75
    
    # Simple average
    avg_est = (token_est_chars + token_est_words) / 2
    
    print(f"Text Length: {char_count} chars, {word_count} words")
    print(f"Estimated Tokens: ~{int(avg_est)}")
    return int(avg_est)

if __name__ == "__main__":
    content = ""
    if len(sys.argv) > 1:
        # Read file
        try:
            with open(sys.argv[1], 'r', encoding='utf-8') as f:
                content = f.read()
        except:
             content = sys.argv[1] # Treat arg as string
    else:
        # Read stdin
        content = sys.stdin.read()
    
    if not content:
        print("No input provided.")
        sys.exit(1)
        
    estimate_tokens(content)
