import re

filepath = "src/lib/components/flow-editor/FlowEditor.svelte"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    # Fix (n) =>
    if "(n) =>" in line:
        lines[i] = line.replace("(n) =>", "(n: FlowNodeType) =>")
    
    # Fix (edge) =>
    if "(edge) =>" in line:
        lines[i] = line.replace("(edge) =>", "(edge: FlowEdgeType) =>")
    
    # Fix (e) =>
    # We only want to replace (e) => if it's inside an array method since event handlers usually are in HTML template e.g. onclick={(e) =>
    if "edges.find((e) =>" in line or "edges.filter((e) =>" in line or "edges.map((e) =>" in line or "edges.some((e) =>" in line or "edges.findIndex((e) =>" in line:
        lines[i] = line.replace("(e) =>", "(e: FlowEdgeType) =>")
        
    # Also for n
    if "nodes.find((n) =>" in line or "nodes.filter((n) =>" in line or "nodes.map((n) =>" in line or "nodes.some((n) =>" in line or "nodes.findIndex((n) =>" in line:
        lines[i] = line.replace("(n) =>", "(n: FlowNodeType) =>")

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done fixing implicit any in FlowEditor")
