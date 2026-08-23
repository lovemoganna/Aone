import { describe, it, expect } from 'vitest';
import { ProjectStyleMiner } from '../ProjectStyleMiner';
import { ZeroConfigSniffer } from '../ZeroConfigSniffer';

describe('ProjectStyleMiner', () => {
    it('should infer 2 spaces and lowercase keywords', () => {
        const file1 = `
select id, name
  from users
  where active = 1;
`;
        const file2 = `
insert into logs (msg)
  values ('test');
`;
        const options = ProjectStyleMiner.mineStyles([file1, file2]);
        expect(options.tabWidth).toBe(2);
        expect(options.keywordCase).toBe('lower');
    });

    it('should infer 4 spaces and uppercase keywords', () => {
        const file1 = `
SELECT id, name
    FROM users
    WHERE active = 1;
`;
        const options = ProjectStyleMiner.mineStyles([file1]);
        expect(options.tabWidth).toBe(4);
        expect(options.keywordCase).toBe('upper');
    });

    it('should return empty options when no clear signal is heavily favored', () => {
        const empty = ProjectStyleMiner.mineStyles(['']);
        expect(empty).toEqual({});
    });

    it('should ignore empty text lines when measuring indents', () => {
        const file1 = `
SELECT *
    FROM tbl
        
    WHERE id = 1
`;
        const options = ProjectStyleMiner.mineStyles([file1]);
        expect(options.tabWidth).toBe(4);
    });

    it('should infer leading comma style', () => {
        const file = `
SELECT a
     , b
     , c
FROM tbl;
`;
        const options = ProjectStyleMiner.mineStyles([file]);
        expect(options.commaPosition).toBe('leading');
    });

    it('should infer trailing comma style', () => {
        const file = `
SELECT a,
       b,
       c
FROM tbl;
`;
        const options = ProjectStyleMiner.mineStyles([file]);
        expect(options.commaPosition).toBe('trailing');
    });

    it('should infer Postgres dialect via sniffer', () => {
        const file = `SELECT count(*)::int FROM users;`;
        const options = ZeroConfigSniffer.sniff(file);
        expect(options.dialect).toBe('postgresql');
    });
});
