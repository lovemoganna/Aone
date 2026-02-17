# Documentation Best Practices

## 1. Title is Key

- **Bad**: `util.js`
- **Good**: `formatCurrency(amount, currency)`

## 2. Show Inputs/Outputs

```javascript
/**
 * @param {string} dateString - e.g. "2023-01-01"
 * @returns {Date} Start of day
 */
```

## 3. Explain the "Why"

- Don't just show code. Explain **when** to use it.
- "Use this for client-side validaton, NOT security."

## 4. Include Example Usage

```javascript
// Example:
const output = chunkArray([1, 2, 3, 4], 2);
// Output: [[1, 2], [3, 4]]
```

## 5. Dependencies

List them explicitly.

```python
# Requires: pip install pandas
import pandas as pd
```
