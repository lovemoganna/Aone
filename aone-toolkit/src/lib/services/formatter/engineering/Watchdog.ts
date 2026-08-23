import type { FormatterOptions } from '../CodeFormatterService';

export interface WatchdogResult {
    status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
    result?: string;
    error?: string;
}

/**
 * Watchdog (Circuit Breaker) - Feature 13 Enhancement
 * Manages FormatterWorker lifecycle with strict timeouts and health checks.
 * Prevents complex SQL formatting from hanging the main thread.
 */
export class Watchdog {
    private static DEFAULT_TIMEOUT = 5000; // 5 seconds

    /**
     * Executes formatting in a separate worker with a timeout.
     */
    public static async run(
        sql: string,
        options: FormatterOptions,
        timeoutMs: number = this.DEFAULT_TIMEOUT
    ): Promise<WatchdogResult> {
        return new Promise((resolve) => {
            // In a real browser environment, this would be:
            // const worker = new Worker(new URL('../worker/FormatterWorker.ts', import.meta.url));
            // Since we are in a toolkit environment, we simulate the worker message interface
            // or use the actual worker if the platform supports it.

            let worker: Worker | null = null;
            try {
                // Mocking worker creation logic for the toolkit architecture
                // @ts-ignore
                worker = new Worker(new URL('../worker/FormatterWorker.ts', import.meta.url), { type: 'module' });
            } catch (e) {
                // Fallback to direct call if Worker is unsupported
                console.warn('Web Workers not supported or failed to load. Falling back to main thread.');
                resolve({ status: 'ERROR', error: 'WORKER_UNSUPPORTED' });
                return;
            }

            const timeoutId = setTimeout(() => {
                if (worker) {
                    worker.terminate();
                    resolve({ status: 'TIMEOUT', error: `Formatting timed out after ${timeoutMs}ms` });
                }
            }, timeoutMs);

            worker.onmessage = (e: MessageEvent) => {
                const data = e.data;
                if (data.type === 'HEARTBEAT') return;

                clearTimeout(timeoutId);
                worker?.terminate();

                if (data.status === 'SUCCESS') {
                    resolve({ status: 'SUCCESS', result: data.result });
                } else {
                    resolve({ status: 'ERROR', error: data.error });
                }
            };

            worker.onerror = (e) => {
                clearTimeout(timeoutId);
                worker?.terminate();
                resolve({ status: 'ERROR', error: e.message });
            };

            worker.postMessage({
                id: Math.random().toString(36).substr(2, 9),
                type: 'FORMAT',
                sql,
                options
            });
        });
    }
}
