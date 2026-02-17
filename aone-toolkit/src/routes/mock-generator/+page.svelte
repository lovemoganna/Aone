<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import { faker } from "@faker-js/faker";
    import {
        toCSV,
        toJSON,
        toSQL,
        toMarkdown,
    } from "../table-editor/lib/converters";
    import type { TableData } from "../table-editor/lib/types";
    import {
        Trash2,
        Plus,
        Play,
        Download,
        Copy,
        RefreshCw,
    } from "lucide-svelte";

    let rowCount = $state(10);
    let tableName = $state("users");

    interface FieldDefinition {
        id: string;
        name: string;
        type: string;
    }

    let fields = $state<FieldDefinition[]>([
        { id: crypto.randomUUID(), name: "id", type: "string_uuid" },
        { id: crypto.randomUUID(), name: "name", type: "person_fullName" },
        { id: crypto.randomUUID(), name: "email", type: "internet_email" },
        { id: crypto.randomUUID(), name: "company", type: "company_name" },
        { id: crypto.randomUUID(), name: "created_at", type: "date_past" },
    ]);

    let generatedData = $state<TableData>([]);
    let isGenerating = $state(false);

    const FIELD_TYPES = [
        {
            group: "Common",
            types: [
                {
                    id: "string_uuid",
                    label: "UUID",
                    fn: () => faker.string.uuid(),
                },
                {
                    id: "number_int",
                    label: "Integer",
                    fn: () => faker.number.int({ min: 1, max: 1000 }),
                },
                {
                    id: "number_float",
                    label: "Float",
                    fn: () =>
                        faker.number.float({
                            min: 0,
                            max: 1,
                            fractionDigits: 2,
                        }),
                },
                {
                    id: "boolean",
                    label: "Boolean",
                    fn: () => faker.datatype.boolean(),
                },
            ],
        },
        {
            group: "Person",
            types: [
                {
                    id: "person_fullName",
                    label: "Full Name",
                    fn: () => faker.person.fullName(),
                },
                {
                    id: "person_firstName",
                    label: "First Name",
                    fn: () => faker.person.firstName(),
                },
                {
                    id: "person_lastName",
                    label: "Last Name",
                    fn: () => faker.person.lastName(),
                },
                {
                    id: "person_jobTitle",
                    label: "Job Title",
                    fn: () => faker.person.jobTitle(),
                },
            ],
        },
        {
            group: "Contact",
            types: [
                {
                    id: "internet_email",
                    label: "Email",
                    fn: () => faker.internet.email(),
                },
                {
                    id: "phone_number",
                    label: "Phone Number",
                    fn: () => faker.phone.number(),
                },
                {
                    id: "internet_userName",
                    label: "Username",
                    fn: () => faker.internet.username(),
                },
                {
                    id: "internet_url",
                    label: "URL",
                    fn: () => faker.internet.url(),
                },
            ],
        },
        {
            group: "Company",
            types: [
                {
                    id: "company_name",
                    label: "Company Name",
                    fn: () => faker.company.name(),
                },
                {
                    id: "company_catchPhrase",
                    label: "Catch Phrase",
                    fn: () => faker.company.catchPhrase(),
                },
            ],
        },
        {
            group: "Date",
            types: [
                {
                    id: "date_past",
                    label: "Past Date",
                    fn: () => faker.date.past().toISOString(),
                },
                {
                    id: "date_future",
                    label: "Future Date",
                    fn: () => faker.date.future().toISOString(),
                },
                {
                    id: "date_any",
                    label: "Any Date",
                    fn: () => faker.date.anytime().toISOString(),
                },
            ],
        },
    ];

    function addField() {
        fields.push({
            id: crypto.randomUUID(),
            name: `field_${fields.length + 1}`,
            type: "person_fullName",
        });
    }

    function removeField(id: string) {
        fields = fields.filter((f) => f.id !== id);
    }

    function generate() {
        isGenerating = true;
        setTimeout(() => {
            const data: TableData = [];
            const header = fields.map((f) => f.name);
            data.push(header);

            for (let i = 0; i < rowCount; i++) {
                const row = fields.map((f) => {
                    const typeDef = FIELD_TYPES.flatMap((g) => g.types).find(
                        (t) => t.id === f.type,
                    );
                    return typeDef ? String(typeDef.fn()) : "";
                });
                data.push(row);
            }
            generatedData = data;
            isGenerating = false;
        }, 100);
    }

    function copyAs(format: "json" | "csv" | "sql" | "markdown") {
        let text = "";
        switch (format) {
            case "json":
                text = toJSON(generatedData);
                break;
            case "csv":
                text = toCSV(generatedData);
                break;
            case "sql":
                text = toSQL(generatedData, tableName);
                break;
            case "markdown":
                text = toMarkdown(generatedData);
                break;
        }
        navigator.clipboard.writeText(text);
    }

    function downloadAs(format: "json" | "csv" | "sql") {
        let text = "";
        let ext = "";
        switch (format) {
            case "json":
                text = toJSON(generatedData);
                ext = "json";
                break;
            case "csv":
                text = toCSV(generatedData);
                ext = "csv";
                break;
            case "sql":
                text = toSQL(generatedData, tableName);
                ext = "sql";
                break;
        }
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${tableName}_mock.${ext}`;
        a.click();
    }
</script>

<svelte:head>
    <title>Mock Data Generator - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 overflow-hidden">
    <div class="h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Configuration Side -->
        <div class="lg:col-span-4 flex flex-col min-h-0 space-y-4">
            <Panel class="flex-1 flex flex-col min-h-0 overflow-hidden">
                {#snippet header()}
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                            <div
                                class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"
                            >
                                <Plus size={16} />
                            </div>
                            <h2
                                class="font-semibold text-slate-900 dark:text-white"
                            >
                                Fields Configuration
                            </h2>
                        </div>
                        <Button variant="ghost" size="sm" onclick={addField}>
                            <Plus size={14} class="mr-1" /> Add
                        </Button>
                    </div>
                {/snippet}

                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                    {#each fields as field (field.id)}
                        <div
                            class="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg group border border-transparent hover:border-indigo-500/30 transition-all"
                        >
                            <input
                                type="text"
                                bind:value={field.name}
                                class="flex-1 bg-transparent text-sm font-medium focus:outline-none"
                                placeholder="Field name"
                            />
                            <select
                                bind:value={field.type}
                                class="form-select bg-white dark:bg-slate-700 text-xs py-1 px-2 pr-6 rounded border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {#each FIELD_TYPES as group}
                                    <optgroup label={group.group}>
                                        {#each group.types as type}
                                            <option value={type.id}
                                                >{type.label}</option
                                            >
                                        {/each}
                                    </optgroup>
                                {/each}
                            </select>
                            <button
                                class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onclick={() => removeField(field.id)}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    {/each}
                </div>

                <div
                    class="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-900"
                >
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <span
                                class="text-[10px] font-bold text-slate-400 uppercase ml-1"
                                >Table Name</span
                            >
                            <input
                                type="text"
                                bind:value={tableName}
                                class="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border rounded"
                            />
                        </div>
                        <div class="space-y-1">
                            <span
                                class="text-[10px] font-bold text-slate-400 uppercase ml-1"
                                >Rows</span
                            >
                            <input
                                type="number"
                                bind:value={rowCount}
                                min="1"
                                max="1000"
                                class="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border rounded"
                            />
                        </div>
                    </div>
                    <Button class="w-full" onclick={generate}>
                        {#if isGenerating}
                            <RefreshCw size={16} class="mr-2 animate-spin" /> Generating...
                        {:else}
                            <Play size={16} class="mr-2" /> Generate Data
                        {/if}
                    </Button>
                </div>
            </Panel>
        </div>

        <!-- Preview Side -->
        <div class="lg:col-span-8 flex flex-col min-h-0">
            <Panel class="flex-1 flex flex-col min-h-0 overflow-hidden">
                {#snippet header()}
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                            <div
                                class="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
                            >
                                <Play size={16} />
                            </div>
                            <h2
                                class="font-semibold text-slate-900 dark:text-white"
                            >
                                Generated Data Preview
                            </h2>
                        </div>
                        {#if generatedData.length > 0}
                            <div class="flex gap-2">
                                <div
                                    class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onclick={() => copyAs("json")}
                                        >JSON</Button
                                    >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onclick={() => copyAs("csv")}
                                        >CSV</Button
                                    >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onclick={() => copyAs("sql")}
                                        >SQL</Button
                                    >
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onclick={() => downloadAs("csv")}
                                >
                                    <Download size={14} class="mr-1" /> Download
                                </Button>
                            </div>
                        {/if}
                    </div>
                {/snippet}

                {#if generatedData.length > 0}
                    <div class="flex-1 overflow-auto">
                        <table class="w-full text-sm text-left font-mono">
                            <thead
                                class="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10"
                            >
                                <tr>
                                    {#each generatedData[0] as header}
                                        <th
                                            class="p-3 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase text-[10px]"
                                            >{header}</th
                                        >
                                    {/each}
                                </tr>
                            </thead>
                            <tbody
                                class="divide-y divide-slate-100 dark:divide-slate-800"
                            >
                                {#each generatedData.slice(1) as row}
                                    <tr
                                        class="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        {#each row as cell}
                                            <td
                                                class="p-3 border-b border-slate-50 dark:border-slate-900 truncate max-w-[200px]"
                                                title={cell}>{cell}</td
                                            >
                                        {/each}
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <div
                        class="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4"
                    >
                        <div
                            class="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center"
                        >
                            <Play
                                size={40}
                                class="text-slate-200 dark:text-slate-700"
                            />
                        </div>
                        <div>
                            <p
                                class="font-medium text-slate-600 dark:text-slate-300"
                            >
                                No data generated yet
                            </p>
                            <p class="text-sm">
                                Configure fields and click "Generate Data" to
                                start.
                            </p>
                        </div>
                    </div>
                {/if}
            </Panel>
        </div>
    </div>
</div>
