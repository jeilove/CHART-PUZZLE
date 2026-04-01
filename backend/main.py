from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from scraper import fetch_stock_ohlcv, fetch_news_keywords, clean_news_filter, search_stock, fetch_market_heatmap

app = FastAPI(title="Stock Chart Puzzle Backend")

# CORS 및 PNA(Private Network Access) 보안 고도화
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def add_pna_header(request, call_next):
    response = await call_next(request)
    if request.method == "OPTIONS":
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

@app.get("/")
async def root():
    return {"message": "Stock Chart Puzzle API is running!"}

@app.get("/api/stock/{symbol}")
def get_stock_data(symbol: str, timeframe: str = "day"):
    data = fetch_stock_ohlcv(symbol, timeframe=timeframe)
    if not data:
        raise HTTPException(status_code=404, detail="Stock data not found")
    return {"symbol": symbol, "data": data}

@app.get("/api/search")
def search_stocks(q: str):
    results = search_stock(q)
    return {"results": results}

@app.get("/api/news/{stock_name}")
def get_news_keywords(stock_name: str):
    news = fetch_news_keywords(stock_name)
    return {"stock_name": stock_name, "news": news}

@app.get("/api/trigger/{symbol}")
def get_trigger_analysis(symbol: str, name: str, refresh: bool = False):
    from scraper import analysis_trigger_cloud
    result = analysis_trigger_cloud(symbol, name, force_refresh=refresh)
    return result

@app.get("/api/market/heatmap")
def get_market_heatmap(type: str = "KOSPI", pages: int = 2):
    """
    시장 히트맵 데이터 반환 (KOSPI/KOSDAQ)
    """
    try:
        data = fetch_market_heatmap(type=type, pages=pages)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
