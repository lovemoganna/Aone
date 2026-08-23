import { describe, it, expect } from 'vitest';
import {
    autoDetectAndParse,
    parseCSVData,
    parseMarkdownTable,
    parseHTMLTable,
    parseTSVData,
    parseJSONArrayData,
    parseBoxOrAsciiTable,
    parseTextTable,
} from './parsers';

describe('Table Parser Engine - Precision & Robustness Tests', () => {
    describe('CSV Parser with Quotes, Multilines & Empty Cells', () => {
        it('should correctly preserve empty cells in CSV', () => {
            const csv = 'id,name,role,salary\n1,Alice,,25000\n2,,Dev,\n3,Charlie,PM,30000';
            const res = parseCSVData(csv);
            expect(res).toEqual([
                ['id', 'name', 'role', 'salary'],
                ['1', 'Alice', '', '25000'],
                ['2', '', 'Dev', ''],
                ['3', 'Charlie', 'PM', '30000'],
            ]);
        });

        it('should handle multiline quoted fields without mangling rows', () => {
            const csv = 'id,description,status\n1,"Line 1\nLine 2\nLine 3",Active\n2,"Simple text",Pending';
            const res = parseCSVData(csv);
            expect(res.length).toBe(3);
            expect(res[1][1]).toBe('Line 1\nLine 2\nLine 3');
            expect(res[1][2]).toBe('Active');
            expect(res[2][0]).toBe('2');
        });

        it('should handle escaped quotes ("") correctly', () => {
            const csv = 'id,quote,author\n1,"He said ""Hello world""",Bob';
            const res = parseCSVData(csv);
            expect(res[1][1]).toBe('He said "Hello world"');
        });

        it('should handle semicolon-separated CSV values', () => {
            const csv = 'id;name;city\n1;Bob;Paris\n2;Alice;London';
            const res = parseCSVData(csv);
            expect(res[0]).toEqual(['id', 'name', 'city']);
            expect(res[1]).toEqual(['1', 'Bob', 'Paris']);
        });
    });

    describe('Markdown Table Parser with Escaped Pipes & Empty Cells', () => {
        it('should preserve empty cells inside markdown table', () => {
            const md = `
| id | name | role | note |
| --- | --- | --- | --- |
| 1 | Alice | | First |
| 2 | | Designer | |
| 3 | Bob | Lead | |
`;
            const res = parseMarkdownTable(md);
            expect(res).toEqual([
                ['id', 'name', 'role', 'note'],
                ['1', 'Alice', '', 'First'],
                ['2', '', 'Designer', ''],
                ['3', 'Bob', 'Lead', ''],
            ]);
        });

        it('should handle escaped pipes without splitting cells', () => {
            const md = `
| col1 | col2 | col3 |
| --- | --- | --- |
| A | B\\|C | D |
| E | F | G |
`;
            const res = parseMarkdownTable(md);
            expect(res[1][1]).toBe('B|C');
            expect(res[1][2]).toBe('D');
            expect(res[1].length).toBe(3);
        });

        it('should handle markdown tables without leading or trailing pipes', () => {
            const md = `
id | name | age
--- | --- | ---
1 | Alice | 24
2 | Bob | 30
`;
            const res = parseMarkdownTable(md);
            expect(res).toEqual([
                ['id', 'name', 'age'],
                ['1', 'Alice', '24'],
                ['2', 'Bob', '30'],
            ]);
        });
    });

    describe('HTML Table Parser with Rowspan & Colspan Grid', () => {
        it('should accurately position cells with colspan', () => {
            const html = `
<table>
  <tr><th>ID</th><th colspan="2">Name & Role</th></tr>
  <tr><td>1</td><td>Alice</td><td>Developer</td></tr>
</table>`;
            const res = parseHTMLTable(html);
            expect(res[0]).toEqual(['ID', 'Name & Role', '']);
            expect(res[1]).toEqual(['1', 'Alice', 'Developer']);
        });

        it('should accurately allocate cells with rowspan without row shifting', () => {
            const html = `
<table>
  <tr><th>Category</th><th>Item</th><th>Price</th></tr>
  <tr><td rowspan="2">Electronics</td><td>Phone</td><td>$500</td></tr>
  <tr><td>Laptop</td><td>$1200</td></tr>
  <tr><td>Food</td><td>Apple</td><td>$2</td></tr>
</table>`;
            const res = parseHTMLTable(html);
            expect(res.length).toBe(4);
            expect(res[0]).toEqual(['Category', 'Item', 'Price']);
            expect(res[1]).toEqual(['Electronics', 'Phone', '$500']);
            expect(res[2]).toEqual(['', 'Laptop', '$1200']);
            expect(res[3]).toEqual(['Food', 'Apple', '$2']);
        });
    });

    describe('Box-drawing and ASCII Tables', () => {
        it('should parse +---+---+ ASCII border tables', () => {
            const ascii = `
+----+-------+--------+
| id | name  | role   |
+----+-------+--------+
| 1  | Alice | Dev    |
| 2  | Bob   |        |
+----+-------+--------+`;
            const res = parseBoxOrAsciiTable(ascii);
            expect(res).toEqual([
                ['id', 'name', 'role'],
                ['1', 'Alice', 'Dev'],
                ['2', 'Bob', ''],
            ]);
        });

        it('should parse Unicode box-drawing tables (┌───┬───┐)', () => {
            const unicodeBox = `
┌────┬───────┬────────┐
│ id │ name  │ status │
├────┼───────┼────────┤
│ 1  │ Alice │ Active │
│ 2  │ Bob   │        │
└────┴───────┴────────┘`;
            const res = parseBoxOrAsciiTable(unicodeBox);
            expect(res).toEqual([
                ['id', 'name', 'status'],
                ['1', 'Alice', 'Active'],
                ['2', 'Bob', ''],
            ]);
        });
    });

    describe('Fixed-width and Space-aligned Tables', () => {
        it('should parse fixed-width space-separated tables with separators', () => {
            const text = `
Name        Age    Department    Status
---------   ----   -----------   --------
Alice       28     Engineering   Active
Bob                Design        Pending
Charlie     35                   Active`;
            const res = parseTextTable(text);
            expect(res[0]).toEqual(['Name', 'Age', 'Department', 'Status']);
            expect(res[1]).toEqual(['Alice', '28', 'Engineering', 'Active']);
            expect(res[2]).toEqual(['Bob', '', 'Design', 'Pending']);
            expect(res[3]).toEqual(['Charlie', '35', '', 'Active']);
        });
    });

    describe('Auto-detection and Sparse JSON Arrays', () => {
        it('should parse sparse JSON objects array with missing keys', () => {
            const json = JSON.stringify([
                { id: 1, name: 'Alice', role: 'Dev' },
                { id: 2, name: 'Bob' }, // missing role
                { id: 3, role: 'Lead', salary: 30000 }, // missing name
            ]);
            const res = autoDetectAndParse(json);
            expect(res.data[0]).toContain('id');
            expect(res.data[0]).toContain('name');
            expect(res.data[0]).toContain('role');
            expect(res.data[0]).toContain('salary');

            const idIdx = res.data[0].indexOf('id');
            const nameIdx = res.data[0].indexOf('name');
            const roleIdx = res.data[0].indexOf('role');
            const salaryIdx = res.data[0].indexOf('salary');

            expect(res.data[2][idIdx]).toBe('2');
            expect(res.data[2][nameIdx]).toBe('Bob');
            expect(res.data[2][roleIdx]).toBe('');
            expect(res.data[3][salaryIdx]).toBe('30000');
        });
    });
});
