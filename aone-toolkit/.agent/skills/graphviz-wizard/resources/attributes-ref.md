# Graphviz Attributes Reference

Style your diagrams by applying attributes to `graph`, `node`, and `edge`.

## 1. Global Attributes (Best Practice)

Reduce boilerplate by setting defaults at the top.

```dot
digraph G {
    // Graph Level
    splines=ortho;      // orthogonal lines (Manhattan style)
    rankdir=LR;         // Left-to-Right layout
    nodesep=0.6;        // Horizontal gap between nodes
    ranksep=0.8;        // Vertical gap between ranks

    // Node Defaults
    node [
        fontname="Arial",
        fontsize=12,
        shape="rect",
        style="rounded,filled",
        fillcolor="#F8F8F8",
        color="#888888"
    ];

    // Edge Defaults
    edge [
        fontname="Arial",
        fontsize=10,
        color="#555555"
    ];
}
```

## 2. Node Attributes

| Attribute | Values | Description |
| :--- | :--- | :--- |
| `shape` | `box`, `circle`, `ellipse`, `record` | Basic shape. |
| `style` | `filled`, `rounded`, `dashed` | Border/Fill style. |
| `fillcolor`| `#RRGGBB` or name | Background color. |
| `penwidth` | `1.0`, `2.0` | Thickness of border. |
| `label` | "My Node" | Text content (supports HTML-like). |

### Record Shapes (Tables)
Powerful for database schemas or classes.

```dot
node1 [shape=record, label="{ Class Name | + Method() \n - Property }"];
```

## 3. Edge Attributes

| Attribute | Values | Description |
| :--- | :--- | :--- |
| `dir` | `forward`, `back`, `both`, `none` | Arrow direction. |
| `arrowhead` | `normal`, `dot`, `diamond`, `vee` | Style of arrow tip. |
| `style` | `solid`, `dashed`, `dotted`, `bold` | Line style. |
| `label` | "Connection" | Label along the edge. |
| `constraint`| `true` (default), `false` | If false, edge doesn't affect rank (layout). |

## 4. Graph Attributes (Layout)

- `compound=true`: Allows edges between clusters (using `lhead`, `ltail`).
- `concentrate=true`: Merges parallel edges (cleaner diagrams).
- `bgcolor`: Background color of canvas.

## 5. HTML Labels
For complex formatting.

```dot
myNode [label=<
    <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
        <TR><TD><b>Bold</b></TD></TR>
        <TR><TD>Normal</TD></TR>
    </TABLE>
>];
```
