import csv
import json
import os

def generate_industry_json():
    base_dir = r"e:\바이브코딩\Stock Chart Puzzle"
    trigger_dir = os.path.join(base_dir, "참조자료", "트리거")
    output_path = os.path.join(base_dir, "backend", "stock_industry.json")
    
    files = ["KOSPI_업종_20260331.csv", "KOSDAQ_업종_20260331.csv"]
    mapping = {} # symbol -> industry
    
    for filename in files:
        file_path = os.path.join(trigger_dir, filename)
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue
            
        with open(file_path, "r", encoding="cp949") as f:
            reader = csv.DictReader(f)
            for row in reader:
                code = row.get("종목코드", "").replace('"', '').strip()
                name = row.get("종목명", "").strip()
                industry = row.get("업종명", "").strip()
                if code and name and industry:
                    mapping[code] = {"name": name, "industry": industry}
                    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    
    print(f"Created industry mapping for {len(mapping)} stocks at {output_path}")

if __name__ == "__main__":
    generate_industry_json()
