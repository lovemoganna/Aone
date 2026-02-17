import { json } from '@sveltejs/kit';
import { execSync } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { code, mode } = await request.json();

        if (!code || !mode) {
            return json({ error: 'Missing code or mode' }, { status: 400 });
        }

        // Create a temporary file for the linter to read
        const tempFile = join(tmpdir(), `lint_${Date.now()}.${mode === 'plantuml' ? 'puml' : 'dot'}`);
        await writeFile(tempFile, code);

        // Determine which script to run
        const scriptPath = mode === 'plantuml'
            ? 'c:\\Users\\luoyu\\Downloads\\Aone\\aone-toolkit\\.agent\\skills\\plantuml-expert\\scripts\\validate_puml.py'
            : 'c:\\Users\\luoyu\\Downloads\\Aone\\aone-toolkit\\.agent\\skills\\graphviz-wizard\\scripts\\lint_dot.py';

        try {
            // Execute the Python script
            // Note: execSync will throw if the script exit code is non-zero
            // But we want to capture the output even on failure
            let stdout = '';
            try {
                stdout = execSync(`python "${scriptPath}" "${tempFile}"`, { encoding: 'utf8' });
            } catch (err: any) {
                stdout = err.stdout || err.message;
            }

            // Clean up temp file
            await unlink(tempFile);

            // Parse output
            // Example output: ❌ Error reading file: ... or Line 5: Multiple @start... found.
            const results = parsePythonOutput(stdout);

            return json({ results });
        } catch (err: any) {
            if (await exists(tempFile)) await unlink(tempFile);
            return json({ error: err.message }, { status: 500 });
        }
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
};

async function exists(path: string) {
    try {
        await import('fs/promises').then(fs => fs.access(path));
        return true;
    } catch {
        return false;
    }
}

function parsePythonOutput(output: string) {
    const lines = output.split('\n');
    const results: any[] = [];

    // Regex to match "Line 5: Message" or "  - Line 5: Message"
    const lineRegex = /(?:Line\s+)?(\d+):\s*(.*)/i;

    for (const line of lines) {
        const match = line.match(lineRegex);
        if (match) {
            results.push({
                line: parseInt(match[1]),
                message: match[2].trim(),
                severity: 'error'
            });
        } else if (line.includes('❌') || line.includes('Failed')) {
            // General error if no line number found
            if (!results.some(r => r.message === line.trim())) {
                results.push({
                    line: 1,
                    message: line.trim().replace('❌', '').trim(),
                    severity: 'error'
                });
            }
        }
    }

    return results;
}
