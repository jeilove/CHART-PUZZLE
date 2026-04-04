## 1. Full-Screen Search UI
The current search overlay was replaced with a dedicated full-screen view (`SEARCH`) to provide more focus and space for detailed stock information. 
- A prominent back arrow (`<-`) was added to the top left.
- Interactive Search Input at the top center.
- **New (v1.6.1)**: All favorite stocks (ungrouped and grouped) are automatically listed in the search results when the search term is empty, serving as a comprehensive watchlist.

## 2. Enhanced Search Results
Search results now follow the "PORTFOLIOS & WATCHLISTS" aesthetic:
- **Left**: Stock Name (Code omitted for cleaner look).
- **Center**: 4 Quick-Action Icons:
  - **Chart**: /icons/v3_chart.png
  - **Puzzle**: /icons/v3_puzzle.png
  - **Warp**: /icons/v3_warp.png
  - **Cloud**: /icons/v17_trigger.png (Scaled 1.2x)
- **Right**: Current Price & Change Ratio (Normal/Green/Red styling).
- **Far Right**: Favorite Star (Interactive toggle).

## 3. Word Cloud Logic Integration
The "Cloud" icon triggers a specialized Trigger Cloud analysis.
- Logic uses Exponential Decay ($e^{-\lambda \cdot t}$) with a 14-day half-life to weight news/report keywords.
- **New (v1.6.1)**: Icon size increased by 120% for better accessibility.

## 4. Back-to-Search Navigation (New in v1.6.1)
Users can now navigate back to the search results screen from Chart or Puzzle views.
- A **"<- Search"** button appears in the top-left corner of the result screens only when navigated from the full-screen search results.
