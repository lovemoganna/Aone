<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import { Terminal, Copy, Globe, Code2 } from "lucide-svelte";

    let curlInput = $state("");
    let targetLang = $state<"fetch" | "axios" | "python" | "go">("fetch");

    function parseCurl(curl: string) {
        const result = {
            method: "GET",
            url: "",
            headers: {} as Record<string, string>,
            body: "",
        };

        // Very basic regex-based curl parser
        const urlMatch = curl.match(
            /'(https?:\/\/[^']+)'|"(https?:\/\/[^"]+)"/,
        );
        if (urlMatch) result.url = urlMatch[1] || urlMatch[2];

        const methodMatch = curl.match(/-X\s+(\w+)|--request\s+(\w+)/);
        if (methodMatch) result.method = methodMatch[1] || methodMatch[2];

        const headerMatches = curl.matchAll(/-H\s+['"]([^'"]+)['"]/g);
        for (const match of headerMatches) {
            const [key, ...val] = match[1].split(":");
            result.headers[key.trim()] = val.join(":").trim();
        }

        const bodyMatch = curl.match(
            /-d\s+['"]([^'"]+)['"]|--data\s+['"]([^'"]+)['"]/,
        );
        if (bodyMatch) {
            result.body = bodyMatch[1] || bodyMatch[2];
            if (result.method === "GET") result.method = "POST";
        }

        return result;
    }

    let parsed = $derived(parseCurl(curlInput));

    let generatedCode = $derived.by(() => {
        if (!parsed.url)
            return "// Paste a valid curl command to generate code";

        switch (targetLang) {
            case "fetch":
                return `fetch("${parsed.url}", {\n  method: "${parsed.method}",\n  headers: ${JSON.stringify(parsed.headers, null, 2)},\n  ${parsed.body ? `body: JSON.stringify(${parsed.body})` : ""}\n}).then(res => res.json());`;
            case "axios":
                return `axios({\n  method: "${parsed.method}",\n  url: "${parsed.url}",\n  headers: ${JSON.stringify(parsed.headers, null, 2)},\n  ${parsed.body ? `data: ${parsed.body}` : ""}\n});`;
            case "python":
                return `import requests\n\nheaders = ${JSON.stringify(parsed.headers, null, 4)}\n${parsed.body ? `data = ${parsed.body}\n` : ""}response = requests.${parsed.method.toLowerCase()}("${parsed.url}", headers=headers${parsed.body ? ", data=data" : ""})`;
            case "go":
                return `req, _ := http.NewRequest("${parsed.method}", "${parsed.url}", ${parsed.body ? `strings.NewReader(\`${parsed.body}\`)` : "nil"})\n${Object.entries(
                    parsed.headers,
                )
                    .map(([k, v]) => `req.Header.Set("${k}", "${v}")`)
                    .join(
                        "\n",
                    )}\nclient := &http.Client{}\nresp, _ := client.Do(req)`;
            default:
                return "";
        }
    });

    function copyCode() {
        navigator.clipboard.writeText(generatedCode);
    }
</script>

<svelte:head>
    <title>Curl Converter - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 flex flex-col space-y-4">
    <Panel class="flex-1 flex flex-col min-h-0">
        {#snippet header()}
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2">
                    <div
                        class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center border"
                    >
                        <Terminal size={16} />
                    </div>
                    <h2 class="font-semibold text-slate-900 dark:text-white">
                        Curl to Code
                    </h2>
                </div>
                <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {#each ["fetch", "axios", "python", "go"] as lang}
                        <button
                            class="px-3 py-1 text-xs font-medium rounded-md transition-all {targetLang ===
                            lang
                                ? 'bg-white shadow text-primary-600'
                                : 'text-slate-500'}"
                            onclick={() => (targetLang = lang as any)}
                            >{lang}</button
                        >
                    {/each}
                </div>
            </div>
        {/snippet}

        <div
            class="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800"
        >
            <div class="flex flex-col p-6 space-y-4">
                <div
                    class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                    Input Curl
                </div>
                <textarea
                    bind:value={curlInput}
                    class="flex-1 p-4 font-mono text-xs bg-slate-50 dark:bg-black/20 border-none rounded-2xl resize-none focus:outline-none dark:text-slate-300"
                    placeholder="curl 'https://api.example.com/v1/user' -H 'Authorization: Bearer ...'"
                ></textarea>
            </div>
            <div
                class="flex flex-col p-6 space-y-4 bg-slate-50/30 dark:bg-black/10"
            >
                <div class="flex justify-between items-center">
                    <div
                        class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >
                        Generated {targetLang.toUpperCase()}
                    </div>
                    <Button variant="ghost" size="sm" onclick={copyCode}>
                        <Copy size={14} class="mr-2" /> Copy
                    </Button>
                </div>
                <pre
                    class="flex-1 p-4 bg-slate-900 text-emerald-400 rounded-2xl border border-slate-800 overflow-auto font-mono text-xs leading-relaxed group relative"><code
                        >{generatedCode}</code
                    ></pre>
            </div>
        </div>
    </Panel>
</div>
