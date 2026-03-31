# Lithuanian Back Pain Patient Portal - Development Plan

## Design Guidelines

### Design References
- **Calm health apps**: Headspace, Calm — soft colors, large text, minimal UI
- **Style**: Minimal Health Companion — warm, approachable, low-friction

### Color Palette
- Background: #FAFAF8 (Warm off-white)
- Card Background: #FFFFFF (White)
- Primary Accent: #5B8A72 (Muted sage green — health, calm)
- Secondary Accent: #6B9BD2 (Soft blue — trust)
- Warning/Flare: #E8A87C (Warm peach — gentle alert)
- Progress: #7FB3D3 (Light blue)
- Text Primary: #2D3436 (Dark charcoal)
- Text Secondary: #636E72 (Medium gray)
- Border: #E8E5E0 (Warm light gray)

### Typography
- Font: Inter (clean, highly readable)
- Heading1: font-weight 700, 28-32px (mobile-first, large)
- Heading2: font-weight 600, 22-24px
- Body: font-weight 400, 18px (larger than usual for elderly)
- Button text: font-weight 600, 18px

### Key Component Styles
- Cards: White bg, subtle shadow, 16px rounded, large padding (20-24px)
- Buttons: Large (min 56px height), rounded-xl, clear labels
- Back navigation: Always visible, large tap target
- Sections: Generous spacing (24-32px gaps)

### Images to Generate
1. **hero-back-care.jpg** — Serene illustration of a person doing gentle stretching in a calm nature setting, soft green and blue tones, health and wellness feel (Style: watercolor, calming)
2. **exercise-stretching.jpg** — Gentle illustration of an elderly person doing simple exercises, warm and encouraging, soft pastel colors (Style: watercolor, warm)
3. **nutrition-plate.jpg** — Beautiful healthy plate of food with vegetables, proteins, and grains, top-down view, soft natural lighting (Style: watercolor, fresh)
4. **lifestyle-walking.jpg** — Peaceful illustration of a person walking in nature, trees and sunlight, calming green tones (Style: watercolor, serene)

---

## File Structure (8 files max)

1. **src/pages/Index.tsx** — Home screen with welcome message and 6 navigation cards
2. **src/pages/PradetiPrograma.tsx** — Step-by-step program guide
3. **src/pages/Pratimai.tsx** — Exercise section with 4 groups, video links, completion checkboxes
4. **src/pages/Mityba.tsx** — Nutrition section with levels, fully built "1 lygis"
5. **src/pages/Gyvensena.tsx** — Lifestyle section with 4 categories
6. **src/pages/SkausmoPaumejimas.tsx** — Flare-up guide with levels and safety info
7. **src/pages/SavaitesProgresas.tsx** — Weekly progress form with local storage
8. **src/App.tsx** — Routes setup

## Data
- All exercise data, nutrition data, lifestyle tips, and flare-up info will be embedded as constants within their respective page components to keep things simple.
- Weekly progress entries stored in localStorage.
- Exercise completion state stored in localStorage.