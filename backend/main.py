from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from scraper import fetch_stock_ohlcv, fetch_news_keywords, clean_news_filter

app = FastAPI(title="Stock Chart Puzzle Backend")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Stock Chart Puzzle API is running!"}

@app.get("/api/stock/{symbol}")
async def get_stock_data(symbol: str):
    data = fetch_stock_ohlcv(symbol)
    if not data:
        raise HTTPException(status_code=404, detail="Stock data not found")
    return {"symbol": symbol, "data": data}

@app.get("/api/news/{stock_name}")
async def get_news_keywords(stock_name: str):
    news = fetch_news_keywords(stock_name)
    return {"stock_name": stock_name, "news": news}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
