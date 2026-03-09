# Pizza Monster Game

A simple browser game for kids where you pick two pizza-slice numbers to feed targets to Pizza Monster.

Each New Game creates a fresh random round of kid-friendly targets and slices.

## How to run

1. Open `index.html` directly in a browser, **or**
2. Serve the folder with a local web server:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## How to play

- The active target is shown near Pizza Monster and highlighted in the target list.
- Click two pizza slices.
- If those two numbers can make the target with **addition** or **multiplication**, the monster eats the target and those slices are removed.
- If not, try another pair.
- Clear all targets to win.

## Project structure

- `index.html` — game layout
- `styles.css` — playful visual styling
- `script.js` — game logic and interactions 