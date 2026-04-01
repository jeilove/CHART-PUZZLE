# UI Icon Toolbar Implementation Details

## Icons Used
- **Home**: `/icons/v11_home.png` (active/inactive states with drop-shadow)
- **Chart**: `/icons/v3_chart.png` (active/inactive states with drop-shadow)
- **Puzzle**: `/icons/v3_puzzle.png` (active/inactive states with drop-shadow)
- **News Pulse**: `/icons/v11_pulse.png` (active/inactive states with drop-shadow)
- **Trigger**: `/icons/v17_trigger.png` (Front and Back sides of FlipCard)
- **TimeWarp**: `/icons/v3_warp.png` (Front side of FlipCard and bottom buttons)

## Menu Logic
- **Bottom Navigation**: Found in `page.tsx`. Uses `motion.div` for a fixed bottom bar with `layoutId` for dots.
- **Button Replacement**: Original text-based buttons like "블라인드 챌린지 시작", "퀴즈 도전" were replaced with icon buttons in some views.

## Component Specifics
- `PuzzleGame`'s `UnifiedFlipCard` front design: Icons for Trigger and TimeWarp placed side-by-side below the chart.
- Search result stars: Enhanced with `z-[60]` to avoid interaction blocks.
