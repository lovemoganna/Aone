<script lang="ts">
    import { Button } from "$lib/components/ui";

    let input = $state("");
    let output = $state("");

    const stats = $derived({
        chars: input.length,
        words: input.trim() ? input.trim().split(/\s+/).length : 0,
        lines: input.trim() ? input.split("\n").length : 0,
    });

    function toCamelCase(str: string) {
        return str
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
    }

    function toSnakeCase(str: string) {
        return (
            str
                .match(
                    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
                )
                ?.map((x) => x.toLowerCase())
                .join("_") || ""
        );
    }

    function toKebabCase(str: string) {
        return (
            str
                .match(
                    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
                )
                ?.map((x) => x.toLowerCase())
                .join("-") || ""
        );
    }

    function transform(type: string) {
        if (!input) return;
        switch (type) {
            case "camel":
                output = toCamelCase(input);
                break;
            case "snake":
                output = toSnakeCase(input);
                break;
            case "kebab":
                output = toKebabCase(input);
                break;
            case "upper":
                output = input.toUpperCase();
                break;
            case "lower":
                output = input.toLowerCase();
                break;
            case "upper_first":
                output = input.charAt(0).toUpperCase() + input.slice(1);
                break;
        }
    }

    function processLines(action: string) {
        const lines = input.split("\n");
        let processed: string[] = [];
        switch (action) {
            case "sort":
                processed = [...lines].sort();
                break;
            case "unique":
                processed = [...new Set(lines)];
                break;
            case "reverse":
                processed = [...lines].reverse();
                break;
            case "trim":
                processed = lines.map((l) => l.trim());
                break;
            case "clean":
                processed = lines
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0);
                break;
        }
        output = processed.join("\n");
    }

    function copyOutput() {
        navigator.clipboard.writeText(output);
    }
</script>

<div class="space-y-6 pb-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
            class="bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30"
        >
            <span class="text-[10px] font-bold text-indigo-400 uppercase"
                >Characters</span
            >
            <p class="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.chars}
            </p>
        </div>
        <div
            class="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
        >
            <span class="text-[10px] font-bold text-emerald-400 uppercase"
                >Words</span
            >
            <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.words}
            </p>
        </div>
        <div
            class="bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30"
        >
            <span class="text-[10px] font-bold text-amber-400 uppercase"
                >Lines</span
            >
            <p class="text-xl font-bold text-amber-600 dark:text-amber-400">
                {stats.lines}
            </p>
        </div>
    </div>

    <div class="space-y-2">
        <div class="text-sm font-medium">Input Text</div>
        <textarea
            bind:value={input}
            class="w-full h-32 p-4 font-mono text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl resize-none focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="Paste text to transform or analyze..."
        ></textarea>
    </div>

    <div class="space-y-4">
        <div class="space-y-2">
            <div class="text-[10px] font-bold text-slate-400 uppercase">
                Case Conversion
            </div>
            <div class="flex flex-wrap gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => transform("camel")}>camelCase</Button
                >
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => transform("snake")}>snake_case</Button
                >
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => transform("kebab")}>kebab-case</Button
                >
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => transform("upper")}>UPPERCASE</Button
                >
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => transform("lower")}>lowercase</Button
                >
            </div>
        </div>

        <div class="space-y-2">
            <div class="text-[10px] font-bold text-slate-400 uppercase">
                Line Tools
            </div>
            <div class="flex flex-wrap gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => processLines("sort")}>Sort Lines</Button
                >
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => processLines("unique")}
                    >Remove Duplicates</Button
                >
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => processLines("reverse")}>Reverse</Button
                >
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => processLines("clean")}
                    >Remove Empty Lines</Button
                >
            </div>
        </div>
    </div>

    {#if output}
        <div
            class="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300"
        >
            <div class="flex justify-between items-center">
                <div class="text-sm font-medium">Result</div>
                <Button variant="ghost" size="sm" onclick={copyOutput}
                    >Copy Result</Button
                >
            </div>
            <textarea
                readonly
                value={output}
                class="w-full h-32 p-4 font-mono text-sm bg-slate-100 dark:bg-slate-900 border rounded-xl resize-none outline-none"
            ></textarea>
        </div>
    {/if}
</div>
