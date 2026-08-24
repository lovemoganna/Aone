<script lang="ts">
    import { Button, CodeBlock } from "$lib/components/ui";

    interface Props {
        isOpen: boolean;
        jsonData: any;
        onClose: () => void;
    }

    let { isOpen, jsonData, onClose }: Props = $props();

    let interfaceName = $state("RootObject");
    let tsOutput = $derived(isOpen && jsonData ? jsonToTs(jsonData, interfaceName) : "");

    function jsonToTs(obj: any, name: string): string {
        try {
            if (typeof obj !== "object" || obj === null) {
                return `type ${name} = ${typeof obj};`;
            }

            if (Array.isArray(obj)) {
                if (obj.length === 0) return `type ${name} = any[];`;
                const firstType = typeof obj[0];
                // Simplification: assume array is homogeneous or mixed
                // Better implementation would distinct types
                if (typeof obj[0] === "object" && obj[0] !== null) {
                    const subtypeName = name.endsWith("[]")
                        ? name.slice(0, -2)
                        : name + "Item";
                    const sub = jsonToTs(obj[0], subtypeName);
                    return `${sub}\n\ntype ${name} = ${subtypeName}[];`;
                }
                return `type ${name} = ${firstType}[];`;
            }

            let lines = [`interface ${name} {`];
            const children: string[] = [];

            for (const key in obj) {
                const value = obj[key];
                const keyName =
                    key.includes("-") || key.includes(" ") ? `"${key}"` : key;
                let typeStr = "any";

                if (value === null) {
                    typeStr = "null";
                } else if (Array.isArray(value)) {
                    if (value.length > 0) {
                        const first = value[0];
                        if (typeof first === "object" && first !== null) {
                            const subName = capitalize(key) + "Item";
                            children.push(jsonToTs(first, subName));
                            typeStr = `${subName}[]`;
                        } else {
                            typeStr = `${typeof first}[]`;
                        }
                    } else {
                        typeStr = "any[]";
                    }
                } else if (typeof value === "object") {
                    const subName = capitalize(key);
                    children.push(jsonToTs(value, subName));
                    typeStr = subName;
                } else {
                    typeStr = typeof value;
                }

                lines.push(`  ${keyName}: ${typeStr};`);
            }

            lines.push("}");

            return (
                children.join("\n\n") +
                (children.length > 0 ? "\n\n" : "") +
                lines.join("\n")
            );
        } catch (e) {
            return "// Error generating types";
        }
    }

    function capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    function copyToClipboard() {
        navigator.clipboard.writeText(tsOutput);
        onClose();
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
        <div
            class="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        >
            <div
                class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
                <h3
                    class="text-lg font-semibold text-slate-900 dark:text-white"
                >
                    生成 TypeScript 接口
                </h3>
                <button
                    onclick={onClose}
                    class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="关闭类型生成器"
                    aria-label="关闭类型生成器"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-x"
                        ><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg
                    >
                </button>
            </div>

            <div class="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
                <div class="flex items-center gap-2">
                    <label for="typegen-root-interface" class="text-sm font-medium"
                        >根接口名称：</label
                    >
                    <input
                        id="typegen-root-interface"
                        bind:value={interfaceName}
                        oninput={() =>
                            (tsOutput = jsonToTs(jsonData, interfaceName))}
                        class="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div
                    class="flex-1 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 p-2 overflow-y-auto"
                >
                    <CodeBlock
                        code={tsOutput}
                        language="typescript"
                        showLineNumbers={true}
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0"
                    />
                </div>
            </div>

            <div
                class="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2"
            >
                <Button variant="secondary" onclick={onClose}>关闭</Button>
                <Button onclick={copyToClipboard}>复制并关闭</Button>
            </div>
        </div>
    </div>
{/if}
