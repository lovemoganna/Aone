# Chart Selection Guide

Choosing the right chart is about the *relationship* you want to show.

## 1. Comparison

Compare magnitude of values.

- **Few Items (1-10)**: Vertical Bar Chart (`<BarChart />`).
- **Many Items (10+)**: Horizontal Bar Chart.
- **Over Time**: Line Chart (`<LineChart />`) or Area Chart.

## 2. Part-to-Whole

Show how 100% is broken down.

- **Simple share**: Pie Chart (`<PieChart />`). *Rule: Max 5 slices.*
- **Complex share**: Stacked Bar Chart.
- **Hierarchical**: Tree Map.

## 3. Distribution

Show spread and variance.

- **Single Variable**: Histogram.
- **Single + Outliers**: Box Plot.
- **Two Variables**: Scatter Plot (`<ScatterChart />`).

## 4. Relationship (Correlation)

Show how X affects Y.

- **Two Variables**: Scatter Plot.
- **Three Variables**: Bubble Chart (Size = Z).

## 5. Trend over Time

- **Standard**: Line Chart.
- **Comparison**: Multi-Line Chart.
- **Magnitude**: Area Chart.
