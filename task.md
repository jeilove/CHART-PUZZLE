# Task: Home Search Full Screen Transformation & Word Cloud Integration

## Status: In Progress 
- [x] Backend: Update `search_stock` to include price and change ratio (if possible)
- [x] Frontend: Implement Full-Screen Search View state and UI
- [x] Frontend: Add Back button and "PORTFOLIOS & WATCHLISTS" style results
- [x] Frontend: Integrated "Word Cloud" icon (Scaled 1.2x) and trigger logic
- [x] Frontend: Display all Favorites in search when searchTerm is empty
- [x] Frontend: Implement Back-to-Search navigation button
- [x] Documentation: Update CHANGELOG.md and walkthrough.md
- [x] Deployment: Push to GitHub

## Details
- **Search UI**: Transition from current absolute overlay to a dedicated full-screen view.
- **Layout**: Each search result item will display Name, 4 Action Icons (Chart, Puzzle, Warp, WordCloud), Price/Change, and Favorite Star.
- **Favorites Integration**: Default search results now include all favorite stocks.
- **Navigation**: "<- Search" button added to result screens for easy return.
- **Word Cloud**: Icon scaled to 1.2x. Powered by the Exponential Decay sentiment model ($e^{-\lambda \cdot \Delta t}$).
- **Version**: v1.6.1
