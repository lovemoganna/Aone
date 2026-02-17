#!/usr/bin/env python3
import sys
import csv

def validate_csv(filepath):
    """
    Checks if a CSV file has consistent column counts.
    """
    try:
        with open(filepath, 'r', encoding='utf-8', newline='') as f:
            # Sniff dialect first? No, assume standard for now to be safe with unknown delimiters
            dialect = csv.Sniffer().sniff(f.read(1024))
            f.seek(0)
            reader = csv.reader(f, dialect)
            
            header = next(reader, None)
            if not header:
                print("❌ Empty file.")
                return False
                
            expected_cols = len(header)
            print(f"Header: {expected_cols} columns ({dialect.delimiter} delimiter)")
            
            errors = []
            row_num = 1
            for row in reader:
                row_num += 1
                if len(row) != expected_cols:
                    errors.append(f"Row {row_num}: Expected {expected_cols}, got {len(row)}.")
            
            if errors:
                print("\n❌ CSV Issues:")
                for e in errors[:5]:
                    print(f"  - {e}")
                if len(errors) > 5:
                    print(f"  ... and {len(errors)-5} more.")
                return False
                
            print(f"✅ CSV Valid ({row_num-1} data rows).")
            return True

    except Exception as e:
        print(f"❌ Error processing CSV: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_csv.py <data.csv>")
        sys.exit(1)
    
    validate_csv(sys.argv[1])
