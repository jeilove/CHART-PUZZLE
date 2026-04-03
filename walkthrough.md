# Walkthrough: Search Transformation & Word Cloud

## 1. Full-Screen Search UI
The current search overlay was replaced with a dedicated full-screen view (`SEARCH`) to provide more focus and space for detailed stock information. 
- A prominent back arrow (`<-`) was added to the top left.
- Interactive Search Input at the top center.

## 2. Enhanced Search Results
Search results now follow the "PORTFOLIOS & WATCHLISTS" aesthetic:
- **Left**: Stock Name (Code omitted for cleaner look).
- **Center**: 4 Quick-Action Icons:
  - **Chart**: /icons/v3_chart.png
  - **Puzzle**: /icons/v3_puzzle.png
  - **Warp**: /icons/v3_warp.png
  - **Cloud**: /icons/v17_trigger.png (Targeting Trigger Cloud)
- **Right**: Current Price & Change Ratio (Normal/Green/Red styling).
- **Far Right**: Favorite Star (Interactive toggle).

## 3. Word Cloud Logic Integration
The "Cloud" icon triggers a specialized Trigger Cloud analysis.
- Logic uses Exponential Decay ($e^{-\lambda \cdot t}$) with a 14-day half-life to weight news/report keywords.
- Most recent triggers are displayed with larger scale and distinct sentiment colors (Positive: Rose, Negative: Blue).

## 4. UI Polish
- Smooth transitions with `framer-motion` for full-screen entry/exit.
- Glassmorphism effect consistent with the overall premium design.
