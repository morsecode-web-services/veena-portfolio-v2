import json
import sys

def analyze_lighthouse(filepath):
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    print("--- Lighthouse Report Summary ---\n")

    # Categories
    categories = data.get('categories', {})
    for cat_id, cat_data in categories.items():
        score = cat_data.get('score')
        if score is not None:
             print(f"Category: {cat_data.get('title')} - Score: {int(score * 100)}")

    print("\n--- Top Performance Issues (Score < 1) ---\n")
    
    audits = data.get('audits', {})
    performance_audits = []
    
    # Filter for interesting audits (mostly those referenced in the performance category)
    perf_audit_refs = categories.get('performance', {}).get('auditRefs', [])
    for ref in perf_audit_refs:
        audit_id = ref.get('id')
        audit = audits.get(audit_id)
        if audit and audit.get('score') is not None and audit.get('score') < 1:
            # Weight is helpful but score is the main filter here
            performance_audits.append(audit)

    # Sort by score (ascending) to see worst first
    performance_audits.sort(key=lambda x: x.get('score', 1))

    for audit in performance_audits[:15]: # Show top 15 issues
        print(f"Audit: {audit.get('title')}")
        print(f"  Score: {audit.get('score')}")
        print(f"  Display Value: {audit.get('displayValue')}")
        # print(f"  Description: {audit.get('description')}")
        print("-" * 20)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_lighthouse.py <filepath>")
    else:
        analyze_lighthouse(sys.argv[1])
