# CSS Layout Patterns

## 1. Centering (The "Golden" Snippet)

```css
.center-box {
    display: flex;
    justify-content: center;
    align-items: center;
}
```

## 2. The "Holy Grail" Layout (Grid)

```css
.layout {
    display: grid;
    grid-template-rows: auto 1fr auto; /* Header, Body, Footer */
    grid-template-columns: 250px 1fr;  /* Sidebar, Main */
    height: 100vh;
}
```

## 3. Responsive Card Grid (Auto-Fill)

No media queries needed!

```css
.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}
```

## 4. Sticky Header/Footer

```css
.header {
    position: sticky;
    top: 0;
    z-index: 10;
}
```

## 5. Aspect Ratio Box (Modern)

```css
.video-wrapper {
    aspect-ratio: 16 / 9;
    width: 100%;
}
```
