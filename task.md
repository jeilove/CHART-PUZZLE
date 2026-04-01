# Task: Stock Chart Puzzle UI Emergency Hotfix (v1.0.8)

## 1. Layout Restoration & correction
- [x] Correct Trigger/Warp icon position: Move from top to **BELOW** the chart container.
- [x] Restore Front-side Header: Re-implement Stock Name and Timeframe selector at the absolute top.
- [x] Fix Front-side Spacing: Apply `mt-32` to chart container to prevent header overlap.

## 2. Analysis Screen (Back) Recovery
- [x] Restore "Intelligence Analysis" screen layout to stable state.
- [x] Optimize vertical flow: Remove forced centering and use flexible spacing (`mt-20`, `mt-auto`).
- [x] Ensure Trigger Cloud and Gap Index Analysis don't overlap.

## 3. Component Synchronization
- [x] Maintain CustomEvent sync for Time Warp across all views.
