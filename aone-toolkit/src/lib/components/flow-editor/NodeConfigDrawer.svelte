<script lang="ts">
    import {
        X,
        GripVertical,
        ChevronRight,
        Settings,
        Save,
        RotateCcw,
        GitBranch,
        Undo2,
        AlertCircle,
        Play,
        CheckCircle,
        Clock,
    } from "lucide-svelte";
    import { CodeBlock } from "$lib/components/ui";
    import type { FlowNode } from "./types";
    import { slide } from "svelte/transition";

    // Node configuration interface
    interface NodeConfigSection {
        id: string;
        title: string;
        fields: NodeConfigField[];
        expanded?: boolean;
    }

    interface NodeConfigField {
        id: string;
        label: string;
        type: "text" | "number" | "select" | "textarea" | "toggle" | "color";
        value: any;
        options?: { value: string; label: string }[];
        placeholder?: string;
        description?: string;
    }

    let {
        node = $bindable<FlowNode | null>(null),
        isOpen = $bindable(false),
        width = $bindable(320),
        onClose = () => {},
        onSave = (updatedNode: FlowNode) => {},
    } = $props<{
        node: FlowNode | null;
        isOpen?: boolean;
        width?: number;
        onClose?: () => void;
        onSave?: (node: FlowNode) => void;
    }>();

    // P2-11: Isolated Node Test Runner
    let mockInput = $state('{\n  "input": "test query",\n  "data": {}\n}');
    let isTesting = $state(false);
    let testResult = $state<{ success: boolean; duration: number; output?: any; error?: string } | null>(null);

    async function runIsolatedTest() {
        if (!node) return;
        isTesting = true;
        testResult = null;
        const start = performance.now();
        try {
            let parsedVariables: any = {};
            try {
                parsedVariables = JSON.parse(mockInput);
            } catch {
                parsedVariables = { input: mockInput };
            }
            
            await new Promise(r => setTimeout(r, 350));
            const duration = Math.round(performance.now() - start);
            
            testResult = {
                success: true,
                duration,
                output: {
                    status: 'success',
                    nodeId: node.id,
                    nodeType: node.type,
                    processedAt: new Date().toISOString(),
                    payload: {
                        ...parsedVariables,
                        result: `Simulated output for ${node.data?.label || node.id}`
                    }
                }
            };
        } catch (err: any) {
            testResult = {
                success: false,
                duration: Math.round(performance.now() - start),
                error: err.message || 'Execution failed'
            };
        } finally {
            isTesting = false;
        }
    }

    // Config sections
    let sections = $state<NodeConfigSection[]>([
        {
            id: "basic",
            title: "Basic Settings",
            expanded: true,
            fields: [
                {
                    id: "label",
                    label: "Name",
                    type: "text",
                    value: "",
                    placeholder: "Node name",
                },
                {
                    id: "description",
                    label: "Description",
                    type: "textarea",
                    value: "",
                    placeholder: "Optional description",
                },
            ],
        },
        {
            id: "style",
            title: "Style",
            expanded: false,
            fields: [
                {
                    id: "nodeColor",
                    label: "Color",
                    type: "color",
                    value: "#3b82f6",
                },
            ],
        },
        {
            id: "execution",
            title: "Execution",
            expanded: false,
            fields: [
                {
                    id: "isBreakpoint",
                    label: "Enable Breakpoint",
                    type: "toggle",
                    value: false,
                },
                {
                    id: "onError",
                    label: "Error Handler",
                    type: "toggle",
                    value: false,
                },
            ],
        },
    ]);

    // Condition builder state (P0-2: Visual Condition Builder)
    let conditionBuilder = $state({
        variable: "",
        operator: "==",
        value: "",
    });

    // Available operators
    const operators = [
        { value: "==", label: "等于 (==)" },
        { value: "!=", label: "不等于 (!=)" },
        { value: ">", label: "大于 (>)" },
        { value: ">=", label: "大于等于 (>=)" },
        { value: "<", label: "小于 (<)" },
        { value: "<=", label: "小于等于 (<=)" },
        { value: "contains", label: "包含" },
        { value: "notContains", label: "不包含" },
        { value: "startsWith", label: "开头是" },
        { value: "endsWith", label: "结尾是" },
        { value: "isEmpty", label: "为空" },
        { value: "isNotEmpty", label: "不为空" },
    ];

    // Check if current node is a condition node
    let isConditionNode = $derived(node?.type === "condition");

    // P0-3: Check if node supports dynamic ports
    let supportsDynamicPorts = $derived(
        node?.type === "router" ||
            node?.type === "parallel" ||
            node?.type === "switch",
    );

    // P0-3: Dynamic ports management
    let dynamicPorts = $state({
        inputs: [] as { id: string; label: string }[],
        outputs: [] as { id: string; label: string }[],
    });

    // P0-3: Initialize dynamic ports from node data
    $effect(() => {
        if (node && supportsDynamicPorts) {
            dynamicPorts = {
                inputs: node.data?.dynamicInputs || [],
                outputs: node.data?.dynamicOutputs || [
                    { id: "output_true", label: "True" },
                    { id: "output_false", label: "False" },
                ],
            };
        }
    });

    // P0-3: Add new port
    function addPort(type: "inputs" | "outputs") {
        const newPort = {
            id: `port_${Date.now()}`,
            label:
                type === "outputs"
                    ? `Case ${dynamicPorts[type].length + 1}`
                    : `Input ${dynamicPorts[type].length + 1}`,
        };
        dynamicPorts[type] = [...dynamicPorts[type], newPort];
    }

    // P0-3: Remove port
    function removePort(type: "inputs" | "outputs", index: number) {
        dynamicPorts[type] = dynamicPorts[type].filter((_, i) => i !== index);
    }

    // P0-3: Update port label
    function updatePortLabel(
        type: "inputs" | "outputs",
        index: number,
        label: string,
    ) {
        dynamicPorts[type] = dynamicPorts[type].map((p, i) =>
            i === index ? { ...p, label } : p,
        );
    }

    // Generate expression from condition builder
    let generatedExpression = $derived(() => {
        if (!conditionBuilder.variable) return "";
        const varRef = `{{${conditionBuilder.variable}}}`;
        switch (conditionBuilder.operator) {
            case "==":
                return `${varRef} == ${conditionBuilder.value}`;
            case "!=":
                return `${varRef} != ${conditionBuilder.value}`;
            case ">":
                return `${varRef} > ${conditionBuilder.value}`;
            case ">=":
                return `${varRef} >= ${conditionBuilder.value}`;
            case "<":
                return `${varRef} < ${conditionBuilder.value}`;
            case "<=":
                return `${varRef} <= ${conditionBuilder.value}`;
            case "contains":
                return `${varRef}.includes("${conditionBuilder.value}")`;
            case "notContains":
                return `!${varRef}.includes("${conditionBuilder.value}")`;
            case "startsWith":
                return `${varRef}.startsWith("${conditionBuilder.value}")`;
            case "endsWith":
                return `${varRef}.endsWith("${conditionBuilder.value}")`;
            case "isEmpty":
                return `!${varRef} || ${varRef}.length === 0`;
            case "isNotEmpty":
                return `${varRef} && ${varRef}.length > 0`;
            default:
                return "";
        }
    });

    // P1 #7: Condition expression validation
    let conditionErrors = $derived.by(() => {
        const errors: string[] = [];
        if (!isConditionNode) return errors;
        if (!conditionBuilder.variable.trim()) {
            errors.push("变量名不能为空");
        } else if (
            !/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(conditionBuilder.variable)
        ) {
            errors.push("变量名格式无效 (仅允许字母、数字、下划线和点)");
        }
        if (
            !["isEmpty", "isNotEmpty"].includes(conditionBuilder.operator) &&
            !conditionBuilder.value.trim()
        ) {
            errors.push("比较值不能为空");
        }
        return errors;
    });

    // P1 #4: Undo stack for config changes
    let nodeSnapshot: string | null = $state(null);

    $effect(() => {
        if (node && isOpen) {
            // Capture snapshot when drawer opens
            nodeSnapshot = JSON.stringify(node);
        }
    });

    function undoChanges() {
        if (!nodeSnapshot || !node) return;
        const original = JSON.parse(nodeSnapshot) as FlowNode;
        onSave(original);
        // Force re-sync sections
        sections = [...sections];
    }

    // Drag resize state
    let isResizing = $state(false);
    let startX = 0;
    let startWidth = 0;

    // Update fields when node changes
    $effect(() => {
        if (node) {
            // Sync basic fields
            const basicSection = sections.find((s) => s.id === "basic");
            if (basicSection) {
                const labelField = basicSection.fields.find(
                    (f) => f.id === "label",
                );
                if (labelField) labelField.value = node.data?.label || "";

                const descField = basicSection.fields.find(
                    (f) => f.id === "description",
                );
                if (descField) descField.value = node.data?.description || "";
            }

            // Sync style fields
            const styleSection = sections.find((s) => s.id === "style");
            if (styleSection) {
                const colorField = styleSection.fields.find(
                    (f) => f.id === "nodeColor",
                );
                if (colorField)
                    colorField.value = node.data?.color || "#3b82f6";
            }

            // Sync execution fields
            const execSection = sections.find((s) => s.id === "execution");
            if (execSection) {
                const bpField = execSection.fields.find(
                    (f) => f.id === "isBreakpoint",
                );
                if (bpField) bpField.value = node.isBreakpoint || false;

                const errField = execSection.fields.find(
                    (f) => f.id === "onError",
                );
                if (errField) errField.value = node.data?.onError || false;
            }

            // P0-2: Sync condition builder
            if (node.type === "condition" && node.data?.condition) {
                conditionBuilder = {
                    variable: node.data.condition.variable || "",
                    operator: node.data.condition.operator || "==",
                    value: node.data.condition.value || "",
                };
            }
        }
    });

    // Toggle section expansion
    function toggleSection(sectionId: string) {
        const section = sections.find((s) => s.id === sectionId);
        if (section) {
            section.expanded = !section.expanded;
        }
    }

    // Update field value
    function updateField(sectionId: string, fieldId: string, value: any) {
        const section = sections.find((s) => s.id === sectionId);
        if (section) {
            const field = section.fields.find((f) => f.id === fieldId);
            if (field) {
                field.value = value;
            }
        }
    }

    // Handle resize drag
    function startResize(e: MouseEvent) {
        isResizing = true;
        startX = e.clientX;
        startWidth = width;

        window.addEventListener("mousemove", handleResize);
        window.addEventListener("mouseup", stopResize);
    }

    function handleResize(e: MouseEvent) {
        if (!isResizing) return;
        const delta = startX - e.clientX;
        const newWidth = Math.max(280, Math.min(600, startWidth + delta));
        width = newWidth;
    }

    function stopResize() {
        isResizing = false;
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", stopResize);
    }

    // Save configuration
    function handleSave() {
        if (!node) return;

        const updatedNode = { ...node };

        // Apply basic settings
        const basicSection = sections.find((s) => s.id === "basic");
        if (basicSection) {
            const labelField = basicSection.fields.find(
                (f) => f.id === "label",
            );
            const descField = basicSection.fields.find(
                (f) => f.id === "description",
            );

            updatedNode.data = {
                ...updatedNode.data,
                label: labelField?.value || "",
                description: descField?.value || "",
            };
        }

        // Apply style settings
        const styleSection = sections.find((s) => s.id === "style");
        if (styleSection) {
            const colorField = styleSection.fields.find(
                (f) => f.id === "nodeColor",
            );
            if (colorField) {
                updatedNode.data = {
                    ...updatedNode.data,
                    color: colorField.value,
                };
            }
        }

        // Apply execution settings
        const execSection = sections.find((s) => s.id === "execution");
        if (execSection) {
            const bpField = execSection.fields.find(
                (f) => f.id === "isBreakpoint",
            );
            const errField = execSection.fields.find((f) => f.id === "onError");

            if (bpField) updatedNode.isBreakpoint = bpField.value;
            if (errField) {
                updatedNode.data = {
                    ...updatedNode.data,
                    onError: errField.value,
                };
            }
        }

        // P0-2: Apply condition builder settings
        if (node?.type === "condition") {
            updatedNode.data = {
                ...updatedNode.data,
                condition: {
                    variable: conditionBuilder.variable,
                    operator: conditionBuilder.operator,
                    value: conditionBuilder.value,
                },
            };
        }

        // P0-3: Apply dynamic ports settings
        if (
            node?.type === "router" ||
            node?.type === "parallel" ||
            node?.type === "switch"
        ) {
            updatedNode.data = {
                ...updatedNode.data,
                useDynamicPorts: true,
                dynamicInputs: dynamicPorts.inputs,
                dynamicOutputs: dynamicPorts.outputs,
            };
        }

        onSave(updatedNode);
    }

    // Reset to original values
    function handleReset() {
        if (!node) return;
        // Force re-sync by triggering effect
        sections = [...sections];
    }
</script>

<!-- Drawer -->
{#if isOpen && node}
    <div
        class="fixed right-0 top-0 h-full bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700 transition-all duration-200"
        style="width: {width}px; transform: translateX({isOpen ? 0 : 100}%);"
        transition:slide={{ axis: "x", duration: 200 }}
    >
        <!-- Header -->
        <div
            class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700"
        >
            <div>
                <h2
                    class="text-lg font-semibold text-slate-900 dark:text-white"
                >
                    Node Config
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                    {node.type} • {node.id.slice(0, 8)}...
                </p>
            </div>
            <button
                class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                onclick={onClose}
            >
                <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#each sections as section (section.id)}
                <!-- Section Header -->
                <div
                    class="flex items-center justify-between cursor-pointer select-none"
                    onclick={() => toggleSection(section.id)}
                    onkeydown={(e) =>
                        e.key === "Enter" && toggleSection(section.id)}
                    role="button"
                    tabindex="0"
                >
                    <div class="flex items-center gap-2">
                        <Settings class="w-4 h-4 text-slate-400" />
                        <span
                            class="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            {section.title}
                        </span>
                    </div>
                    <ChevronRight
                        class="w-4 h-4 text-slate-400 transition-transform {section.expanded
                            ? 'rotate-90'
                            : ''}"
                    />
                </div>

                <!-- Section Fields -->
                {#if section.expanded}
                    <div
                        class="pl-6 space-y-3 mt-2"
                        transition:slide={{ duration: 150 }}
                    >
                        {#each section.fields as field (field.id)}
                            {@const fieldControlId = `node-config-${section.id}-${field.id}`}
                            <div class="space-y-1">
                                <label
                                    for={fieldControlId}
                                    class="block text-xs font-medium text-slate-600 dark:text-slate-400"
                                >
                                    {field.label}
                                </label>

                                {#if field.type === "text"}
                                    <input
                                        id={fieldControlId}
                                        type="text"
                                        value={field.value}
                                        oninput={(e) =>
                                            updateField(
                                                section.id,
                                                field.id,
                                                e.currentTarget.value,
                                            )}
                                        placeholder={field.placeholder}
                                        class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                {:else if field.type === "textarea"}
                                    <textarea
                                        id={fieldControlId}
                                        value={field.value}
                                        oninput={(e) =>
                                            updateField(
                                                section.id,
                                                field.id,
                                                e.currentTarget.value,
                                            )}
                                        placeholder={field.placeholder}
                                        rows="3"
                                        class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    ></textarea>
                                {:else if field.type === "number"}
                                    <input
                                        id={fieldControlId}
                                        type="number"
                                        value={field.value}
                                        oninput={(e) =>
                                            updateField(
                                                section.id,
                                                field.id,
                                                parseInt(e.currentTarget.value),
                                            )}
                                        class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                {:else if field.type === "select"}
                                    <select
                                        id={fieldControlId}
                                        value={field.value}
                                        onchange={(e) =>
                                            updateField(
                                                section.id,
                                                field.id,
                                                e.currentTarget.value,
                                            )}
                                        class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {#each field.options || [] as option}
                                            <option value={option.value}
                                                >{option.label}</option
                                            >
                                        {/each}
                                    </select>
                                {:else if field.type === "toggle"}
                                    <button
                                        class="w-12 h-6 rounded-full transition-colors relative {field.value
                                            ? 'bg-blue-500'
                                            : 'bg-slate-300 dark:bg-slate-600'}"
                                        title={`Toggle ${field.label}`}
                                        aria-label={`Toggle ${field.label}`}
                                        aria-pressed={!!field.value}
                                        onclick={() =>
                                            updateField(
                                                section.id,
                                                field.id,
                                                !field.value,
                                            )}
                                    >
                                        <span
                                            class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform {field.value
                                                ? 'left-7'
                                                : 'left-1'}"
                                        ></span>
                                    </button>
                                {:else if field.type === "color"}
                                    <div class="flex items-center gap-2">
                                        <input
                                            id={fieldControlId}
                                            type="color"
                                            value={field.value}
                                            oninput={(e) =>
                                                updateField(
                                                    section.id,
                                                    field.id,
                                                    e.currentTarget.value,
                                                )}
                                            class="w-10 h-10 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={field.value}
                                            oninput={(e) =>
                                                updateField(
                                                    section.id,
                                                    field.id,
                                                    e.currentTarget.value,
                                                )}
                                            class="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        />
                                    </div>
                                {/if}

                                {#if field.description}
                                    <p class="text-xs text-slate-400">
                                        {field.description}
                                    </p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            {/each}

            <!-- P0-2: Condition Builder UI -->
            {#if isConditionNode}
                <div
                    class="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4"
                >
                    <div class="flex items-center gap-2 mb-3">
                        <GitBranch class="w-4 h-4 text-amber-500" />
                        <span
                            class="text-sm font-medium text-slate-700 dark:text-slate-200"
                            >Condition Builder</span
                        >
                    </div>

                    <div class="space-y-3">
                        <!-- Variable Input -->
                        <div class="space-y-1">
                            <label
                                for="condition-builder-variable"
                                class="block text-xs font-medium text-slate-600 dark:text-slate-400"
                            >
                                Variable (变量)
                            </label>
                            <input
                                id="condition-builder-variable"
                                type="text"
                                value={conditionBuilder.variable}
                                oninput={(e) =>
                                    (conditionBuilder.variable =
                                        e.currentTarget.value)}
                                placeholder="e.g., step1.output.score"
                                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                            />
                        </div>

                        <!-- Operator Select -->
                        <div class="space-y-1">
                            <label
                                for="condition-builder-operator"
                                class="block text-xs font-medium text-slate-600 dark:text-slate-400"
                            >
                                Operator (运算符)
                            </label>
                            <select
                                id="condition-builder-operator"
                                value={conditionBuilder.operator}
                                onchange={(e) =>
                                    (conditionBuilder.operator =
                                        e.currentTarget.value)}
                                class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                {#each operators as op}
                                    <option value={op.value}>{op.label}</option>
                                {/each}
                            </select>
                        </div>

                        <!-- Value Input (hide for isEmpty/isNotEmpty) -->
                        {#if !["isEmpty", "isNotEmpty"].includes(conditionBuilder.operator)}
                            <div class="space-y-1">
                                <label
                                    for="condition-builder-value"
                                    class="block text-xs font-medium text-slate-600 dark:text-slate-400"
                                >
                                    Value (值)
                                </label>
                                <input
                                    id="condition-builder-value"
                                    type="text"
                                    value={conditionBuilder.value}
                                    oninput={(e) =>
                                        (conditionBuilder.value =
                                            e.currentTarget.value)}
                                    placeholder="e.g., 10 or true or hello"
                                    class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        {/if}

                        <!-- Generated Expression Preview -->
                        <div
                            class="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
                        >
                            <div
                                class="block text-xs font-medium text-slate-500 mb-1"
                            >
                                Generated Expression (生成表达式)
                            </div>
                            <code
                                class="text-xs text-amber-600 dark:text-amber-400 break-all"
                            >
                                {generatedExpression() ||
                                    "// Fill above fields"}
                            </code>
                        </div>

                        <!-- P1 #7: Validation Errors -->
                        {#if conditionErrors.length > 0}
                            <div class="mt-2 space-y-1">
                                {#each conditionErrors as err}
                                    <div
                                        class="flex items-center gap-1.5 text-xs text-red-500"
                                    >
                                        <AlertCircle
                                            class="w-3 h-3 flex-shrink-0"
                                        />
                                        <span>{err}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- P0-3: Dynamic Ports Manager -->
            {#if supportsDynamicPorts}
                <div
                    class="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4"
                >
                    <div class="flex items-center gap-2 mb-3">
                        <GitBranch class="w-4 h-4 text-blue-500" />
                        <span
                            class="text-sm font-medium text-slate-700 dark:text-slate-200"
                            >Dynamic Ports (动态端口)</span
                        >
                    </div>

                    <!-- Output Ports -->
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center justify-between">
                            <div
                                class="text-xs font-medium text-slate-600 dark:text-slate-400"
                            >
                                Output Ports (输出端口)
                            </div>
                            <button
                                class="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                onclick={() => addPort("outputs")}
                            >
                                + Add Port
                            </button>
                        </div>
                        {#each dynamicPorts.outputs as port, index}
                            <div class="flex items-center gap-2">
                                <input
                                    aria-label={`Output port ${index + 1} label`}
                                    type="text"
                                    value={port.label}
                                    oninput={(e) =>
                                        updatePortLabel(
                                            "outputs",
                                            index,
                                            e.currentTarget.value,
                                        )}
                                    class="flex-1 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                                    placeholder="Port label"
                                />
                                <button
                                    class="text-red-500 hover:text-red-600 p-1"
                                    onclick={() => removePort("outputs", index)}
                                    title="Remove port"
                                    aria-label={`Remove output port ${index + 1}`}
                                >
                                    <X class="w-3 h-3" />
                                </button>
                            </div>
                        {/each}
                    </div>

                    <!-- Input Ports -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <div
                                class="text-xs font-medium text-slate-600 dark:text-slate-400"
                            >
                                Input Ports (输入端口)
                            </div>
                            <button
                                class="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                onclick={() => addPort("inputs")}
                            >
                                + Add Port
                            </button>
                        </div>
                        {#each dynamicPorts.inputs as port, index}
                            <div class="flex items-center gap-2">
                                <input
                                    aria-label={`Input port ${index + 1} label`}
                                    type="text"
                                    value={port.label}
                                    oninput={(e) =>
                                        updatePortLabel(
                                            "inputs",
                                            index,
                                            e.currentTarget.value,
                                        )}
                                    class="flex-1 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                                    placeholder="Port label"
                                />
                                <button
                                    class="text-red-500 hover:text-red-600 p-1"
                                    onclick={() => removePort("inputs", index)}
                                    title="Remove port"
                                    aria-label={`Remove input port ${index + 1}`}
                                >
                                    <X class="w-3 h-3" />
                                </button>
                            </div>
                        {/each}
                        {#if dynamicPorts.inputs.length === 0}
                            <p class="text-xs text-slate-400 italic">
                                No additional input ports
                            </p>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- P2-11: Single Node Test Runner Panel -->
            <div class="border-t border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Play class="w-3.5 h-3.5 text-emerald-500" />
                        单节点隔离试跑 (Mock Runner)
                    </span>
                    <button
                        type="button"
                        class="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                        disabled={isTesting}
                        onclick={runIsolatedTest}
                    >
                        {#if isTesting}
                            <Clock class="w-3 h-3 animate-spin" />
                            运行中...
                        {:else}
                            <Play class="w-3 h-3" />
                            就地测试
                        {/if}
                    </button>
                </div>

                <div>
                    <label for="mock-input-drawer" class="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                        Mock 上游输入变量 (JSON):
                    </label>
                    <textarea
                        id="mock-input-drawer"
                        bind:value={mockInput}
                        rows="3"
                        class="w-full text-xs font-mono p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none text-slate-800 dark:text-slate-200"
                        placeholder="输入 Mock 输入参数..."
                    ></textarea>
                </div>

                {#if testResult}
                    <div class="p-2.5 rounded-md border text-xs font-mono {testResult.success ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' : 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'}">
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-bold flex items-center gap-1">
                                <CheckCircle class="w-3 h-3" />
                                {testResult.success ? '执行成功' : '执行失败'}
                            </span>
                            <span class="text-[10px] opacity-75">{testResult.duration}ms</span>
                        </div>
                        {#if testResult.output}
                            <CodeBlock
                                code={JSON.stringify(testResult.output, null, 2)}
                                language="json"
                                showHeader={false}
                                wrapLines={true}
                                maxHeight="120px"
                                class="!my-1"
                            />
                        {:else if testResult.error}
                            <div class="text-[10px] text-red-600 dark:text-red-400">{testResult.error}</div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Footer Actions -->
        <div
            class="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2"
        >
            <button
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                onclick={handleSave}
            >
                <Save class="w-4 h-4" />
                Save
            </button>
            <button
                class="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                onclick={handleReset}
                title="Reset"
            >
                <RotateCcw class="w-4 h-4" />
            </button>
            <!-- P1 #4: Undo button -->
            <button
                class="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                onclick={undoChanges}
                title="Undo to original (撤销至初始)"
            >
                <Undo2 class="w-4 h-4" />
            </button>
        </div>

        <!-- Resize Handle -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 transition-colors"
            onmousedown={startResize}
            role="separator"
            aria-orientation="vertical"
        ></div>
    </div>

    <!-- Backdrop -->
    {#if isOpen}
        <button
            class="fixed inset-0 bg-black/20 z-40"
            onclick={onClose}
            aria-label="Close drawer"
        ></button>
    {/if}
{/if}
