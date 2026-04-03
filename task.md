# Task: Home Search Full Screen Transformation & Word Cloud Integration

## Status: In Progress 
- [ ] Backend: Update `search_stock` to include price and change ratio (if possible)
- [ ] Frontend: Implement Full-Screen Search View state and UI
- [ ] Frontend: Add Back button and "PORTFOLIOS & WATCHLISTS" style results
- [ ] Frontend: Integrated "Word Cloud" icon and trigger logic
- [ ] Documentation: Update CHANGELOG.md and walkthrough.md
- [ ] Deployment: Push to GitHub

## Details
- **Search UI**: Transition from current absolute overlay to a dedicated full-screen view.
- **Layout**: Each search result item will display Name, 4 Action Icons (Chart, Puzzle, Warp, WordCloud), Price/Change, and Favorite Star.
- **Word Cloud**: Powered by the Exponential Decay sentiment model ($e^{-\lambda \cdot \Delta t}$).
- **Version**: v1.6.0
