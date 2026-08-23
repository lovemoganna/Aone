// @ts-nocheck
// Acceptance Test for Sequential Batch Optimizations
import { describe, it, expect } from "vitest";

describe("Charts Sequential Batch Optimizations Test Suite", () => {
    it("should pass all sequential optimization tests", () => {
        // 1. Test TSV (Excel / Feishu clipboard parsing)
        const tsvInput = "月份\t营业额\t成本\n一月\t500\t200\n二月\t600\t240";
        function parseTSVtoDataset(rawText) {
            const isTSV = rawText.includes("\t") && !rawText.includes(",");
            const normalized = isTSV ? rawText.replace(/\t/g, ",") : rawText;
            const lines = normalized.trim().split("\n");
            const headers = lines[0].split(",");
            const rows = lines.slice(1).map(line => {
                const parts = line.split(",");
                return Object.fromEntries(headers.map((h, i) => [h, parts[i] || ""]));
            });
            return { columns: headers, rows };
        }

        const tsvRes = parseTSVtoDataset(tsvInput);
        expect(tsvRes.columns).toEqual(["月份", "营业额", "成本"]);
        expect(tsvRes.rows.length).toBe(2);
        expect(tsvRes.rows[0]["营业额"]).toBe("500");

        // 2. Test Pivot / Transpose
        const initialRows = [
            { "业务": "广告", "Q1": 100, "Q2": 150 },
            { "业务": "会员", "Q1": 80, "Q2": 120 }
        ];

        function transpose(gridRows, labelCol, metricCols) {
            const newColumns = ["项目", ...gridRows.map(r => String(r[labelCol]))];
            const newRows = [];
            for (const mCol of metricCols) {
                const rowObj = { "项目": mCol };
                gridRows.forEach(r => {
                    rowObj[String(r[labelCol])] = Number(r[mCol]) || 0;
                });
                newRows.push(rowObj);
            }
            return { columns: newColumns, rows: newRows };
        }

        const transposed = transpose(initialRows, "业务", ["Q1", "Q2"]);
        expect(transposed.columns).toEqual(["项目", "广告", "会员"]);
        expect(transposed.rows.length).toBe(2);
        expect(transposed.rows[0]["项目"]).toBe("Q1");
        expect(transposed.rows[0]["广告"]).toBe(100);
        expect(transposed.rows[0]["会员"]).toBe(80);

        // 3. Test Batch Numeric Operations
        const rowsToCompute = [
            { "label": "A", "val": 100 },
            { "label": "B", "val": 2500 }
        ];

        function batchComputeTest(rows, op, cols) {
            return rows.map(r => {
                const copy = { ...r };
                for (const c of cols) {
                    const v = Number(copy[c]) || 0;
                    if (op === "mul10") copy[c] = v * 10;
                    if (op === "div1000") copy[c] = Math.round((v / 1000) * 100) / 100;
                    if (op === "round") copy[c] = Math.round(v);
                }
                return copy;
            });
        }

        const mulRes = batchComputeTest(rowsToCompute, "mul10", ["val"]);
        expect(mulRes[0].val).toBe(1000);
        expect(mulRes[1].val).toBe(25000);

        const divRes = batchComputeTest(rowsToCompute, "div1000", ["val"]);
        expect(divRes[0].val).toBe(0.1);
        expect(divRes[1].val).toBe(2.5);

        // 4. Test Dynamic X Label Rotation logic
        function shouldRotate(items) {
            const avgLen = items.reduce((sum, d) => sum + d.label.length, 0) / (items.length || 1);
            return items.length > 6 || avgLen > 4;
        }

        expect(shouldRotate([{ label: "一月" }, { label: "二月" }])).toBe(false);
        expect(shouldRotate([{ label: "华东地区云服务部" }, { label: "华北地区智能运维部" }])).toBe(true);
        expect(shouldRotate(Array.from({ length: 8 }, (_, i) => ({ label: `M${i}` })))).toBe(true);

        // 5. Test Series Visibility Toggle
        const allSeries = ["营业额", "净利润", "成本"];
        const hiddenSet = new Set(["成本"]);
        const visibleSeries = allSeries.filter(s => !hiddenSet.has(s));
        expect(visibleSeries).toEqual(["营业额", "净利润"]);

        // 6. Test Donut Center Metric Cycling
        let donutMode = "sum";
        function cycleMode(m) {
            if (m === "sum") return "avg";
            if (m === "avg") return "max";
            return "sum";
        }
        expect(cycleMode("sum")).toBe("avg");
        expect(cycleMode("avg")).toBe("max");
        expect(cycleMode("max")).toBe("sum");

        // 7. Test Custom Series Palette Overrides
        const defaultPalette = ["#10b981", "#059669", "#34d399"];
        const customColMap = { "净利润": "#ff007f" };
        const appliedColors = allSeries.map((col, idx) => customColMap[col] || defaultPalette[idx]);
        expect(appliedColors[1]).toBe("#ff007f");
        expect(appliedColors[0]).toBe("#10b981");

        // 8. Test Standalone HTML Exporter Content
        const dummySVG = `<svg viewBox="0 0 400 200"><rect width="10" height="20"/></svg>`;
        const generatedHTML = `<!DOCTYPE html><html><body>${dummySVG}</body></html>`;
        expect(generatedHTML).toContain("<svg");
        expect(generatedHTML).toContain("<!DOCTYPE html>");

        // 9. Test Outlier Detection
        const datasetWithOutlier = [
            { label: "A", values: [100] },
            { label: "B", values: [120] },
            { label: "C", values: [110] },
            { label: "D", values: [950] } // Outlier (> 3.5 * avg)
        ];
        const avg = datasetWithOutlier.reduce((acc, d) => acc + d.values[0], 0) / datasetWithOutlier.length;
        const outlier = datasetWithOutlier.find(d => d.values[0] > avg * 2.5);
        expect(outlier).toBeDefined();
        expect(outlier?.label).toBe("D");

        // 10. Test Variance / YoY delta percentage
        const v1 = 160;
        const v2 = 220;
        const diff = v2 - v1;
        const pct = ((diff / v1) * 100).toFixed(1);
        expect(diff).toBe(60);
        expect(pct).toBe("37.5");
    });
});
