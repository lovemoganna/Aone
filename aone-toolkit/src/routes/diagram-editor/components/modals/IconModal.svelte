<script lang="ts">
    import { Search, X, Grid, Info, Cloud, Server, Database, Layers, ShieldCheck, Cpu } from "lucide-svelte";
    import { scale } from "svelte/transition";
    import { diagramStore } from "../../lib/store.svelte";

    let { isOpen = $bindable(false), onSelect } = $props<{
        isOpen: boolean;
        onSelect: (snippet: string) => void;
    }>();

    let searchTerm = $state("");
    let activeCategory = $state<"cloud" | "data" | "compute" | "openiconic">("cloud");

    const ARCHITECTURE_ICONS = [
        { name: "API Gateway", category: "cloud", snippet: `rectangle "<&cloud> API Gateway" as api_gw #E0F2FE` },
        { name: "Load Balancer", category: "cloud", snippet: `rectangle "<&transfer> Load Balancer" as lb #E0E7FF` },
        { name: "CDN Edge", category: "cloud", snippet: `rectangle "<&globe> CloudFront CDN" as cdn #FEF3C7` },
        { name: "Kubernetes Cluster", category: "compute", snippet: `package "K8s Cluster" <<$k8s>> as k8s {\n    rectangle "<&box> Pod A" as pod_a\n    rectangle "<&box> Pod B" as pod_b\n}` },
        { name: "Microservice Node", category: "compute", snippet: `component "<&cog> Order Service" as order_svc #DCFCE7` },
        { name: "Auth Service (OAuth)", category: "compute", snippet: `component "<&key> Auth & JWT Service" as auth_svc #FEE2E2` },
        { name: "PostgreSQL Database", category: "data", snippet: `database "<&data-transfer-download> PostgreSQL Primary" as db_pg #E0F2FE` },
        { name: "Redis Cache Cluster", category: "data", snippet: `database "<&bolt> Redis In-Memory" as redis #FEE2E2` },
        { name: "Kafka Event Bus", category: "data", snippet: `queue "<&audio-spectrum> Kafka Stream Topic" as kafka #FEF3C7` },
        { name: "Elasticsearch Index", category: "data", snippet: `database "<&magnifying-glass> Elasticsearch" as es #F3E8FF` },
        { name: "S3 Object Storage", category: "data", snippet: `storage "<&folder> S3 Media Bucket" as s3_bucket #FFEDD5` },
        { name: "RabbitMQ Broker", category: "data", snippet: `queue "<&ellipses> RabbitMQ Queue" as rmq #FEF08A` },
    ];

    const OPEN_ICONIC = [
        "account-login", "aperture", "badge", "bar-chart", "bell", "bolt", "book", "box", "briefcase", "browser", "bug", "calculator", "calendar", "camera-slr", "chat", "check", "circle-check", "clock", "cloud", "cloud-download", "cloud-upload", "code", "cog", "compass", "credit-card", "dashboard", "data-transfer-download", "document", "eye", "file", "fire", "flash", "folder", "globe", "graph", "grid-three-up", "hard-drive", "heart", "home", "image", "inbox", "info", "key", "layers", "lightbulb", "link-intact", "list", "lock-locked", "loop", "magnifying-glass", "map-marker", "media-play", "microphone", "monitor", "moon", "paperclip", "pencil", "people", "person", "phone", "pie-chart", "pin", "print", "project", "pulse", "puzzle-piece", "rss", "screen", "script", "server", "share", "shield", "signal", "spreadsheet", "star", "sun", "tag", "target", "task", "terminal", "thumb-up", "timer", "transfer", "trash", "tuning", "vertical-align-bottom", "video", "volume-high", "warning", "wifi", "wrench", "zoom-in"
    ];

    let filteredArchIcons = $derived(
        ARCHITECTURE_ICONS.filter(i =>
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    let filteredOpenIconic = $derived(
        OPEN_ICONIC.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    function handleInsert(snippet: string) {
        if (diagramStore.code) {
            diagramStore.takeSnapshot();
            // Append definition before @enduml or at end
            if (diagramStore.mode === 'plantuml' && diagramStore.code.includes('@enduml')) {
                diagramStore.code = diagramStore.code.replace('@enduml', `${snippet}\n@enduml`);
            } else {
                diagramStore.code += `\n${snippet}\n`;
            }
            diagramStore.render();
        }
        onSelect?.(snippet);
        isOpen = false;
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        onclick={() => (isOpen = false)}
        onkeydown={(e) => e.key === "Escape" && (isOpen = false)}
        role="button"
        tabindex="0"
    >
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
            transition:scale={{ duration: 120, start: 0.97 }}
        >
            <!-- Header -->
            <div
                class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40"
            >
                <div class="flex items-center gap-2">
                    <Grid size={15} class="text-slate-700 dark:text-slate-300" />
                    <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Architecture Icons & Components</h2>
                </div>
                <button
                    class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    onclick={() => (isOpen = false)}
                >
                    <X size={15} />
                </button>
            </div>

            <!-- Search & Filter -->
            <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 space-y-2.5">
                <div class="relative">
                    <Search
                        class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        size={14}
                    />
                    <input
                        type="text"
                        bind:value={searchTerm}
                        placeholder="Search cloud, databases, services, or symbols..."
                        class="w-full pl-8 pr-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                </div>

                <div class="flex gap-1.5">
                    <button
                        class="px-2.5 py-1 rounded text-xs font-semibold transition-colors border {activeCategory === 'cloud' ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}"
                        onclick={() => (activeCategory = "cloud")}
                    >
                        Cloud Architecture
                    </button>
                    <button
                        class="px-2.5 py-1 rounded text-xs font-semibold transition-colors border {activeCategory === 'openiconic' ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}"
                        onclick={() => (activeCategory = "openiconic")}
                    >
                        PlantUML OpenIconic ({OPEN_ICONIC.length})
                    </button>
                </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-4 custom-scrollbar text-xs">
                {#if activeCategory === "cloud"}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {#each filteredArchIcons as item}
                            <button
                                class="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors group flex items-start gap-2.5"
                                onclick={() => handleInsert(item.snippet)}
                            >
                                <div class="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 mt-0.5">
                                    {#if item.category === 'cloud'}
                                        <Cloud size={14} />
                                    {:else if item.category === 'data'}
                                        <Database size={14} />
                                    {:else}
                                        <Cpu size={14} />
                                    {/if}
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        {item.name}
                                    </div>
                                    <code class="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 block truncate bg-white dark:bg-slate-950 p-1 rounded border border-slate-200/60 dark:border-slate-800">{item.snippet}</code>
                                </div>
                            </button>
                        {/each}
                    </div>
                {:else}
                    <div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                        {#each filteredOpenIconic as icon}
                            <button
                                class="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-center transition-colors flex flex-col items-center gap-1"
                                onclick={() => handleInsert(`<${icon}>`)}
                            >
                                <span class="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">&lt;&{icon}&gt;</span>
                                <span class="text-[10px] text-slate-400 truncate w-full">{icon}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
