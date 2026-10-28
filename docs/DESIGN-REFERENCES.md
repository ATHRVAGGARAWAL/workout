# Design direction

Reviewed the user's local UI catalog at `/home/anay/Desktop/Projects/UI` (semantic design tokens, native Button, animated tabs, progress ring, dock, timeline and numeric text families), and actual screenshots of:

- https://lucide.dev/icons/
- https://www.untitledui.com/free-icons
- https://hugeicons.com/icons/stroke-rounded
- https://21st.dev/@ephraimduncan/components/stats-cards-with-links

Production icons use the installed Lucide React Native SVG library with consistent rounded strokes. The 21st.dev stats card informed the journal summary's compact hierarchy; it was adapted as native views and text. The mobile dock and surrounding layout are authored for this tracker. The muscle anatomy paths, map styling, and heat colors are adapted from BHIM, with its MIT license notice retained in `src/data/muscle-anatomy.ts`.

The app follows the system appearance by default and offers light and dark modes. Previous dark palette preferences migrate to dark mode.

The product priority is consistency: achievable weekly targets, neutral rest days, completed-session heatmaps, useful progress trends, and clear next actions. Muscle shading reports logged working sets, not unmeasured biological recovery. Only real saved data appears in charts.
