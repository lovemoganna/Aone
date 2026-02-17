# SVG Path Commands (`d` attribute)

## 1. Move & Line

- **M x y**: Move to (absolute).
- **m dx dy**: Move to (relative).
- **L x y**: Line to.
- **H x**: Horizontal Line to.
- **V y**: Vertical Line to.
- **Z**: Close Path (Draw line back to start).

## 2. Curves

- **C x1 y1, x2 y2, x y**: Cubic Bezier (2 control points).
- **S x2 y2, x y**: Smooth Cubic (1 control point, mirrors previous).
- **Q x1 y1, x y**: Quadratic Bezier (1 control point).
- **T x y**: Smooth Quadratic.

## 3. Arcs

- **A rx ry rot large-arc-flag sweep-flag x y**: Elliptical Arc.
  - Complicated! Use tools or specialized libraries for arcs.

## 4. Example (Triangle)

```xml
<path d="M 50 10 L 90 90 L 10 90 Z" fill="red" />
```
