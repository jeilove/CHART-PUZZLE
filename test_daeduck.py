import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from scraper import analysis_trigger_cloud

def test_hit():
    print("Testing Daeduck Electronics (대덕전자, 353200)...")
    res = analysis_trigger_cloud("353200", "대덕전자")
    print(f"Cloud: {res['cloud']}")
    print(f"Comment: {res['gap_comment']}")

test_hit()
