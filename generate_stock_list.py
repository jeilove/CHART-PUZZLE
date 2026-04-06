"""
FinanceDataReader로 KRX 전종목 리스트 JSON 생성
"""
import json
import os
import FinanceDataReader as fdr

print("KOSPI 종목 가져오는 중...")
kospi = fdr.StockListing('KOSPI')
print(f"  {len(kospi)}개 (컬럼: {list(kospi.columns)})")

print("KOSDAQ 종목 가져오는 중...")
kosdaq = fdr.StockListing('KOSDAQ')
print(f"  {len(kosdaq)}개")

stocks = []

for _, row in kospi.iterrows():
    code = str(row.get('Code', row.get('Symbol', ''))).strip().zfill(6)
    name = str(row.get('Name', '')).strip()
    industry = str(row.get('Industry', row.get('Sector', ''))).strip()
    if code and name and len(code) == 6:
        stocks.append({"name": name, "symbol": code, "market": "KOSPI", "industry": industry})

for _, row in kosdaq.iterrows():
    code = str(row.get('Code', row.get('Symbol', ''))).strip().zfill(6)
    name = str(row.get('Name', '')).strip()
    industry = str(row.get('Industry', row.get('Sector', ''))).strip()
    if code and name and len(code) == 6:
        stocks.append({"name": name, "symbol": code, "market": "KOSDAQ", "industry": industry})

# 중복 제거
seen = set()
unique = [s for s in stocks if s["symbol"] not in seen and not seen.add(s["symbol"])]

print(f"\n총 {len(unique)}개 종목 (중복 제거 후)")

out = "frontend/public/stock_list_full.json"
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump(unique, f, ensure_ascii=False)

size_kb = os.path.getsize(out) / 1024
print(f"✅ 저장: {out} ({size_kb:.0f} KB)")
print(f"샘플: {unique[:3]}")
