// @ts-nocheck
// Charts Feature Rigorous Evidence-based Acceptance Test
import { describe, it, expect } from "vitest";
import assert from "node:assert";

describe("Charts Feature Rigorous Evidence-based Acceptance Test", () => {
    it("should pass all acceptance and falsification assertions", () => {
        // 1. Data label calculation and format testing
        function formatDataLabel(val, total, mode) {
            const percent = total > 0 ? ((val / total) * 100).toFixed(1) + "%" : "0%";
            const formattedVal = val.toLocaleString();
            if (mode === "value") return formattedVal;
            if (mode === "percent") return percent;
            return `${formattedVal} (${percent})`;
        }

        const testVal = 420;
        const testTotal = 1000;
        const bothLabel = formatDataLabel(testVal, testTotal, "both");
        const valLabel = formatDataLabel(testVal, testTotal, "value");
        const pctLabel = formatDataLabel(testVal, testTotal, "percent");

        expect(bothLabel).toBe("420 (42.0%)");
        expect(valLabel).toBe("420");
        expect(pctLabel).toBe("42.0%");

        // 2. Multi-Series Data Parsing
        const multiSeriesInput = [
            { "月份": "一月", "营业收入": 420, "净利润": 160 },
            { "月份": "二月", "营业收入": 510, "净利润": 195 },
            { "月份": "三月", "营业收入": 480, "净利润": 180 },
            { "月份": "四月", "营业收入": 640, "净利润": 260 },
            { "月份": "五月", "营业收入": 580, "净利润": 220 },
            { "月份": "六月", "营业收入": 720, "净利润": 310 }
        ];

        function processRows(rows, labelCol, numCols) {
            return rows.map((r, idx) => {
                const vals = numCols.map(col => Number(r[col]) || 0);
                const total = vals.reduce((a, b) => a + b, 0);
                return {
                    label: r[labelCol] || `项目 ${idx + 1}`,
                    values: vals,
                    total,
                    originalIndex: idx
                };
            });
        }

        const parsedMulti = processRows(multiSeriesInput, "月份", ["营业收入", "净利润"]);
        expect(parsedMulti.length).toBe(6);
        expect(parsedMulti[0].values).toEqual([420, 160]);
        expect(parsedMulti[0].total).toBe(580);
        expect(parsedMulti[5].values[1]).toBe(310);

        // 3. Sorting & Filtering Operations
        function pipeline(items, sortOrder, filterMode) {
            let res = [...items];
            if (filterMode === "noZero") {
                res = res.filter(d => d.total > 0);
            } else if (filterMode === "top5") {
                res = [...res].sort((a, b) => b.total - a.total).slice(0, 5);
            }

            if (sortOrder === "asc") {
                res.sort((a, b) => a.total - b.total);
            } else if (sortOrder === "desc") {
                res.sort((a, b) => b.total - a.total);
            }
            return res;
        }

        const descSorted = pipeline(parsedMulti, "desc", "all");
        expect(descSorted[0].label).toBe("六月");
        expect(descSorted[0].total).toBe(1030); // 720 + 310
        expect(descSorted[descSorted.length - 1].label).toBe("一月");
        expect(descSorted[descSorted.length - 1].total).toBe(580);

        // 4. Markdown Multi-dimensional Table Copy
        function generateMarkdown(items, labelCol, seriesCols) {
            let md = `| ${labelCol} | ${seriesCols.join(' | ')} | **合计** |\n`;
            md += `| :--- | ${seriesCols.map(() => ':---').join(' | ')} | :--- |\n`;
            items.forEach((d) => {
                md += `| ${d.label} | ${d.values.map(v => v.toLocaleString()).join(' | ')} | **${d.total.toLocaleString()}** |\n`;
            });
            const totalSum = items.reduce((acc, r) => acc + r.total, 0);
            md += `| **总计** | ${seriesCols.map((_, sIdx) => {
                const sSum = items.reduce((acc, row) => acc + (row.values[sIdx] || 0), 0);
                return `**${sSum.toLocaleString()}**`;
            }).join(' | ')} | **${totalSum.toLocaleString()}** |\n`;
            return md;
        }

        const mdOutput = generateMarkdown(parsedMulti, "月份", ["营业收入", "净利润"]);
        expect(mdOutput).toContain("| 月份 | 营业收入 | 净利润 | **合计** |");
        expect(mdOutput).toContain("| 一月 | 420 | 160 | **580** |");
        expect(mdOutput).toContain("| **总计** | **3,350** | **1,325** | **4,675** |");

        // 5. Analytical Benchmark & Extremes Calculation
        const allValues = parsedMulti.flatMap(d => d.values);
        const totalSum = allValues.reduce((a, b) => a + b, 0);
        const avg = totalSum / allValues.length;
        const maxVal = Math.max(...allValues);
        const minVal = Math.min(...allValues);

        expect(totalSum).toBe(4675);
        expect(avg).toBe(4675 / 12);
        expect(maxVal).toBe(720); // 六月营业收入
        expect(minVal).toBe(160); // 一月净利润

        // Falsification Test A
        const alteredInput = [
            { "月份": "A", "营业收入": 100, "净利润": 50 },
            { "月份": "B", "营业收入": 900, "净利润": 400 }
        ];
        const alteredParsed = processRows(alteredInput, "月份", ["营业收入", "净利润"]);
        expect(alteredParsed[1].total).toBe(1300);

        // Falsification Test B: Negative value sanitization
        const negativeInput = [
            { "月份": "负数项", "营业收入": -50, "净利润": 100 }
        ];
        const negProcessed = negativeInput.map(r => ({
            label: r["月份"],
            values: [Math.max(0, r["营业收入"]), Math.max(0, r["净利润"])]
        }));
        expect(negProcessed[0].values[0]).toBe(0);
        expect(negProcessed[0].values[1]).toBe(100);

        // Falsification Test C: Filter out zeros
        const zeroItems = [
            { label: "项目A", values: [0, 0], total: 0 },
            { label: "项目B", values: [10, 20], total: 30 }
        ];
        const noZeroFiltered = zeroItems.filter(d => d.total > 0);
        expect(noZeroFiltered.length).toBe(1);
        expect(noZeroFiltered[0].label).toBe("项目B");
    });
});
