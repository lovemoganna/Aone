<script lang="ts">
    import { fade } from "svelte/transition";
    import JwtDecoder from "./components/JwtDecoder.svelte";
    import Base64Converter from "./components/Base64Converter.svelte";
    import UrlConverter from "./components/UrlConverter.svelte";
    import CronGenerator from "./components/CronGenerator.svelte";
    import HashCalculator from "./components/HashCalculator.svelte";
    import UuidGenerator from "./components/UuidGenerator.svelte";
    import JsonConverter from "./components/JsonConverter.svelte";
    import SqlFormatter from "./components/SqlFormatter.svelte";
    import HtmlEntity from "./components/HtmlEntity.svelte";
    import ColorConverter from "./components/ColorConverter.svelte";
    import TimestampConverter from "./components/TimestampConverter.svelte";
    import ChmodCalculator from "./components/ChmodCalculator.svelte";
    import PxConverter from "./components/PxConverter.svelte";
    import PasswordGenerator from "./components/PasswordGenerator.svelte";
    import HmacGenerator from "./components/HmacGenerator.svelte";
    import StringCaseConverter from "./components/StringCaseConverter.svelte";
    import TextDedup from "./components/TextDedup.svelte";
    import LoremIpsum from "./components/LoremIpsum.svelte";
    import RegexTester from "./components/RegexTester.svelte";
    import DiffViewer from "./components/DiffViewer.svelte";

    // Icons
    import {
        Shield,
        Type,
        Globe,
        Database,
        Settings,
        Hash,
        Key,
        FileJson,
        Calendar,
        Link,
        Code,
        Search,
    } from "lucide-svelte";

    // Valid Tab Types
    type TabId =
        | "jwt"
        | "base64"
        | "url"
        | "cron" // Existing
        | "hash"
        | "uuid"
        | "password"
        | "hmac" // Security
        | "json-ts"
        | "sql-fmt" // Data
        | "color"
        | "px-rem"
        | "qrcode"
        | "keycode" // Web
        | "chmod"
        | "timestamp"
        | "cidr"
        | "ua-parser" // System
        | "string-case"
        | "html-entity"
        | "lorem"
        | "text-dedup" // Text
        | "regex"
        | "diff";

    let activeTab = $state<TabId>("jwt");
    let searchQuery = $state("");

    // Categorized Menu Items
    const categories = [
        {
            name: "Best Practice",
            icon: Settings,
            items: [
                { id: "jwt", label: "JWT Decoder", icon: Shield },
                { id: "base64", label: "Base64 Converter", icon: FileJson },
                { id: "url", label: "URL Encoder", icon: Link },
                { id: "cron", label: "Cron Generator", icon: Calendar },
            ],
        },
        {
            name: "Security & Crypto",
            icon: Shield,
            items: [
                { id: "hash", label: "Hash Calculator", icon: Hash },
                { id: "uuid", label: "UUID Generator", icon: Key },
                { id: "password", label: "Password Generator", icon: Key },
                { id: "hmac", label: "HMAC Generator", icon: Shield },
            ],
        },
        {
            name: "Web & Frontend",
            icon: Globe,
            items: [
                { id: "color", label: "Color Converter", icon: Globe },
                { id: "qrcode", label: "QR Code Generator", icon: Code },
                { id: "px-rem", label: "PX to REM", icon: Type },
                { id: "keycode", label: "Keycode Visualizer", icon: Code },
            ],
        },
        {
            name: "Data & Format",
            icon: Database,
            items: [
                { id: "json-ts", label: "JSON to TS/Go", icon: FileJson },
                { id: "sql-fmt", label: "SQL Formatter", icon: Database },
                { id: "html-entity", label: "HTML Entity", icon: Code },
            ],
        },
        {
            name: "System & Network",
            icon: Settings,
            items: [
                { id: "timestamp", label: "Unix Timestamp", icon: Calendar },
                { id: "chmod", label: "Chmod Calculator", icon: Shield },
                { id: "cidr", label: "CIDR Calculator", icon: Globe },
                { id: "ua-parser", label: "User Agent Parser", icon: Search },
            ],
        },
        {
            name: "Text & String",
            icon: Type,
            items: [
                { id: "string-case", label: "String Format", icon: Type },
                { id: "text-dedup", label: "Text Dedup", icon: FileJson },
                { id: "lorem", label: "Lorem Ipsum", icon: FileJson },
            ],
        },
    ];

    let filteredCategories = $derived.by(() => {
        if (!searchQuery) return categories;
        const lowerQ = searchQuery.toLowerCase();

        return categories
            .map((cat) => ({
                ...cat,
                items: cat.items.filter((item) =>
                    item.label.toLowerCase().includes(lowerQ),
                ),
            }))
            .filter((cat) => cat.items.length > 0);
    });
</script>

<div
    class="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto overflow-hidden"
>
    <!-- Sidebar -->
    <aside
        class="w-full md:w-64 shrink-0 flex flex-col gap-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 h-full overflow-hidden"
    >
        <!-- Search -->
        <div class="p-4 border-b border-slate-200 dark:border-slate-800">
            <div class="relative">
                <Search
                    size={16}
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search tools..."
                    class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                />
            </div>
        </div>

        <!-- Navigation -->
        <div
            class="flex-1 overflow-y-auto px-2 py-2 space-y-6 custom-scrollbar"
        >
            {#each filteredCategories as category}
                <div class="space-y-1">
                    <div
                        class="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"
                    >
                        <!-- <category.icon size={12} /> -->
                        {category.name}
                    </div>
                    {#each category.items as item}
                        <button
                            class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group
                            {activeTab === item.id
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}"
                            onclick={() => (activeTab = item.id as TabId)}
                        >
                            <item.icon
                                size={18}
                                class={activeTab === item.id
                                    ? "text-primary-500"
                                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}
                            />
                            <span>{item.label}</span>
                        </button>
                    {/each}
                </div>
            {/each}

            {#if filteredCategories.length === 0}
                <div class="px-4 py-8 text-center text-sm text-slate-500">
                    No tools found matching "{searchQuery}"
                </div>
            {/if}
        </div>
    </aside>

    <!-- Main Content -->
    <main
        class="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
    >
        <header
            class="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm"
        >
            {#key activeTab}
                {@const activeItem = categories
                    .flatMap((c) => c.items)
                    .find((i) => i.id === activeTab)}
                <div
                    class="flex items-center gap-3"
                    in:fade={{ duration: 200 }}
                >
                    {#if activeItem}
                        <div
                            class="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        >
                            <activeItem.icon size={20} />
                        </div>
                        <h2
                            class="text-lg font-bold text-slate-800 dark:text-slate-100"
                        >
                            {activeItem.label}
                        </h2>
                    {/if}
                </div>
            {/key}
        </header>

        <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <!-- Dynamic Component Rendering -->
            {#if activeTab === "jwt"}
                <JwtDecoder />
            {:else if activeTab === "base64"}
                <Base64Converter />
            {:else if activeTab === "url"}
                <UrlConverter />
            {:else if activeTab === "cron"}
                <CronGenerator />
            {:else if activeTab === "hash"}
                <HashCalculator />
            {:else if activeTab === "uuid"}
                <UuidGenerator />
            {:else if activeTab === "json-ts"}
                <JsonConverter />
            {:else if activeTab === "sql-fmt"}
                <SqlFormatter />
            {:else if activeTab === "html-entity"}
                <HtmlEntity />
            {:else if activeTab === "color"}
                <ColorConverter />
            {:else if activeTab === "timestamp"}
                <TimestampConverter />
            {:else if activeTab === "chmod"}
                <ChmodCalculator />
            {:else if activeTab === "px-rem"}
                <PxConverter />
            {:else if activeTab === "password"}
                <PasswordGenerator />
            {:else if activeTab === "hmac"}
                <HmacGenerator />
            {:else if activeTab === "string-case"}
                <StringCaseConverter />
            {:else if activeTab === "text-dedup"}
                <TextDedup />
            {:else if activeTab === "lorem"}
                <LoremIpsum />
            {:else if activeTab === "regex"}
                <RegexTester />
            {:else if activeTab === "diff"}
                <DiffViewer />
            {:else}
                <div
                    class="h-full flex flex-col items-center justify-center text-slate-400 gap-4"
                >
                    <Settings size={48} class="opacity-20" />
                    <p>Tool under construction...</p>
                    <p
                        class="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded"
                    >
                        Component: {activeTab}
                    </p>
                </div>
            {/if}
        </div>
    </main>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.3);
        border-radius: 9999px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(156, 163, 175, 0.5);
    }
</style>
