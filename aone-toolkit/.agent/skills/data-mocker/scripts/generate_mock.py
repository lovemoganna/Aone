#!/usr/bin/env python3
import sys
import json
import random
import uuid

def generate_users(count):
    """
    Generates a list of mock users.
    """
    users = []
    domains = ["example.com", "test.org", "mock.net"]
    jobs = ["Engineer", "Designer", "Manager", "Analyst"]
    
    for i in range(count):
        uid = str(uuid.uuid4())
        first = f"User{i}"
        last = f"Smith{random.randint(1, 100)}"
        email = f"{first.lower()}.{last.lower()}@{random.choice(domains)}"
        role = random.choice(jobs)
        age = random.randint(20, 60)
        
        users.append({
            "id": uid,
            "firstName": first,
            "lastName": last,
            "email": email,
            "role": role,
            "age": age,
            "isActive": random.choice([True, False])
        })
        
    print(json.dumps(users, indent=2))

if __name__ == "__main__":
    count = 10
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except:
            pass
    
    generate_users(count)
