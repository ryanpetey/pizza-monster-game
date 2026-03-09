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
index.html
index.html
New
+37
-0

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pizza Monster</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="game">
      <header class="game-header">
        <h1>🍕 Pizza Monster</h1>
        <p>Pick two slices that make the current target with + or ×!</p>
      </header>

      <section class="monster-box" aria-live="polite">
        <div class="monster" id="monsterFace">😋</div>
        <p id="targetLabel">Target to eat: <strong id="currentTarget">--</strong></p>
      </section>

      <section class="targets" aria-label="Target numbers">
        <h2>Targets</h2>
        <ul id="targetList"></ul>
      </section>

      <section class="feedback" aria-live="polite" id="feedback">
        Select two number slices to start.
      </section>

      <section class="slices" aria-label="Number slices" id="sliceContainer"></section>

      <button id="resetButton" class="reset-btn" type="button">New Game</button>
    </main>

    <script src="script.js"></script>
  </body>
</html>
