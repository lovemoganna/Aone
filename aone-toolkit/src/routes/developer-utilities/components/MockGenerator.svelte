<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import type { TableData } from "../../table-editor/lib/types";
    import { onMount } from "svelte";
    import type {
        FieldDefinition,
        MockValue,
        PreparedField,
        ValidationError,
    } from "../../mock-generator/lib/mockData";
    import {
        validateFields,
        parseJSON,
        parseSQLDDL,
        generateMockData,
        getMockExportText,
        normalizeIdentifier,
    } from "../../mock-generator/lib/mockData";
    import {
        Trash2,
        Plus,
        Play,
        Download,
        RefreshCw,
        Settings,
        ArrowUp,
        ArrowDown,
        Copy,
        Check,
        AlertCircle,
        Save,
        Sparkles,
        Import,
        X,
        Globe,
        FileCode,
        SlidersHorizontal,
        History,
    } from "lucide-svelte";

    // Standard Preset templates
    const PRESETS = [
        {
            name: "用户信息 (Users)",
            desc: "常见系统用户基本信息，包含邮箱、手机号等",
            fields: [
                { id: "1", name: "id", type: "string_uuid", isRequired: true, isUnique: true },
                { id: "2", name: "username", type: "internet_userName", isRequired: true, isUnique: true },
                { id: "3", name: "nickname", type: "person_fullName", isRequired: true },
                { id: "4", name: "email", type: "internet_email", isRequired: true, isUnique: true },
                { id: "5", name: "phone", type: "phone_number", isRequired: false, nullPercentage: 10 },
                { id: "6", name: "address", type: "address_full", isRequired: false, nullPercentage: 15 },
                { id: "7", name: "created_at", type: "date_past", isRequired: true }
            ]
        },
        {
            name: "订单列表 (Orders)",
            desc: "电商业务核心订单数据，包含金额、订单号与状态",
            fields: [
                { id: "1", name: "order_id", type: "string_orderId", isRequired: true, isUnique: true },
                { id: "2", name: "customer_name", type: "person_fullName", isRequired: true },
                { id: "3", name: "amount", type: "number_currency", isRequired: true, min: 10, max: 2000, fractionDigits: 2 },
                { id: "4", name: "status", type: "enum", isRequired: true, enumValues: "pending, processing, completed, cancelled" },
                { id: "5", name: "order_date", type: "date_past", isRequired: true }
            ]
        },
        {
            name: "商品数据 (Products)",
            desc: "零售商品基础信息，配置价格范围及特有前缀",
            fields: [
                { id: "1", name: "product_id", type: "string_orderId", isRequired: true, isUnique: true },
                { id: "2", name: "title", type: "company_name", isRequired: true, prefix: "商品-" },
                { id: "3", name: "price", type: "number_currency", isRequired: true, min: 1, max: 800, fractionDigits: 2 },
                { id: "4", name: "in_stock", type: "boolean", isRequired: true },
                { id: "5", name: "tags", type: "array_simple", isRequired: false, nullPercentage: 20 }
            ]
        },
        {
            name: "接口响应 (API Response)",
            desc: "标准化 API 响应信封结构，包含 code、msg 与 data 对象",
            fields: [
                { id: "1", name: "code", type: "number_int", isRequired: true, min: 200, max: 200 },
                { id: "2", name: "message", type: "enum", isRequired: true, enumValues: "success" },
                { id: "3", name: "data", type: "json_object", isRequired: true },
                { id: "4", name: "timestamp", type: "date_any", isRequired: true }
            ]
        }
    ];

    const FIELD_TYPES = [
        {
            group: "常规基础 (Common)",
            types: [
                { id: "string_uuid", label: "UUID" },
                { id: "number_int", label: "整型数字 (Integer)" },
                { id: "number_float", label: "浮点数字 (Float)" },
                { id: "number_currency", label: "金额数字 (Currency)" },
                { id: "boolean", label: "布尔值 (Boolean)" },
            ],
        },
        {
            group: "人物信息 (Person)",
            types: [
                { id: "person_fullName", label: "全名 (Full Name)" },
                { id: "person_firstName", label: "名 (First Name)" },
                { id: "person_lastName", label: "姓 (Last Name)" },
                { id: "person_jobTitle", label: "职位 (Job Title)" },
            ],
        },
        {
            group: "联系方式 (Contact)",
            types: [
                { id: "internet_email", label: "邮箱 (Email)" },
                { id: "phone_number", label: "手机号 (Phone Number)" },
                { id: "internet_userName", label: "用户名 (Username)" },
                { id: "internet_url", label: "网址 (URL)" },
                { id: "address_full", label: "地址 (Address)" },
            ],
        },
        {
            group: "企业组织 (Company)",
            types: [
                { id: "company_name", label: "公司名称 (Company)" },
                { id: "company_catchPhrase", label: "口号 (Slogan)" },
            ],
        },
        {
            group: "日期时间 (Date)",
            types: [
                { id: "date_past", label: "过去日期 (Past Date)" },
                { id: "date_future", label: "未来日期 (Future Date)" },
                { id: "date_any", label: "任意日期 (Any Date)" },
            ],
        },
        {
            group: "系统与网络 (System & Network)",
            types: [
                { id: "system_filePath", label: "文件路径 (File Path)" },
                { id: "system_fileName", label: "文件名 (File Name)" },
                { id: "system_fileExt", label: "文件拓展名 (File Ext)" },
                { id: "internet_ipv4", label: "IPv4 地址 (IPv4)" },
                { id: "internet_ipv6", label: "IPv6 地址 (IPv6)" },
                { id: "internet_mac", label: "MAC 地址 (MAC)" },
            ]
        },
        {
            group: "高级/复杂 (Advanced)",
            types: [
                { id: "enum", label: "枚举值 (Enum)" },
                { id: "string_orderId", label: "订单号 (Order ID)" },
                { id: "color_hex", label: "16进制颜色 (Hex Color)" },
                { id: "color_human", label: "通用颜色名称 (Color Name)" },
                { id: "animal_type", label: "动物品类 (Animal)" },
                { id: "json_object", label: "JSON 对象 (JSON)" },
                { id: "array_simple", label: "数组 (Array)" },
            ]
        }
    ];

    // Core generator states
    let rowCount = $state(10);
    let tableName = $state("users");
    let locale = $state<"zh" | "en">("zh");
    let useSeed = $state(false);
    let seedVal = $state(42);
    let anomalyMode = $state(false); // Enable boundary/anomaly values testing

    let fields = $state<FieldDefinition[]>([
        { id: crypto.randomUUID(), name: "id", type: "string_uuid", isRequired: true, isUnique: true },
        { id: crypto.randomUUID(), name: "username", type: "internet_userName", isRequired: true },
        { id: crypto.randomUUID(), name: "email", type: "internet_email", isRequired: true },
        { id: crypto.randomUUID(), name: "phone", type: "phone_number", isRequired: false, nullPercentage: 10 },
        { id: crypto.randomUUID(), name: "created_at", type: "date_past", isRequired: true },
    ]);

    let generatedData = $state<TableData>([]);
    let generatedRecords = $state<Record<string, MockValue>[]>([]);
    let generatedFields = $state<PreparedField[]>([]);
    let isGenerating = $state(false);
    const MAX_ROWS = 1000;

    let expandedFieldId = $state<string | null>(null);

    // Validation
    let validationErrors = $derived(validateFields(fields));
    let hasValidationErrors = $derived(validationErrors.length > 0);

    // Dirty state tracking
    let lastGeneratedFieldsJson = $state("");
    let lastGeneratedRowCount = $state(10);
    let lastGeneratedTableName = $state("users");
    let lastGeneratedLocale = $state<"zh" | "en">("zh");
    let lastGeneratedSeed = $state<number | undefined>(undefined);
    let lastGeneratedAnomalyMode = $state(false);

    let isDirty = $derived(
        lastGeneratedFieldsJson !== "" &&
        (JSON.stringify(fields) !== lastGeneratedFieldsJson ||
            lastGeneratedRowCount !== rowCount ||
            lastGeneratedTableName !== tableName ||
            lastGeneratedLocale !== locale ||
            (useSeed ? seedVal : undefined) !== lastGeneratedSeed ||
            anomalyMode !== lastGeneratedAnomalyMode)
    );

    // Modals
    let showImportModal = $state(false);
    let importText = $state("");
    let importFormat = $state<"json" | "ddl">("json");
    let importError = $state("");

    let showSaveTemplateModal = $state(false);
    let newTemplateName = $state("");

    let showBulkEditorModal = $state(false);
    let bulkFieldsJson = $state("");
    let bulkEditorError = $state("");

    let showHistoryModal = $state(false);

    // LocalStorage states
    let customTemplates = $state<Array<{ name: string; fields: FieldDefinition[] }>>([]);
    let generationHistory = $state<Array<{ timestamp: string; tableName: string; rows: number; fields: FieldDefinition[] }>>([]);

    let status = $state<{ type: "idle" | "success" | "error"; text: string }>({
        type: "idle",
        text: "请配置字段，然后点击“生成数据”按钮或使用快捷键 Ctrl + Enter。",
    });

    onMount(() => {
        // Load Templates
        const saved = localStorage.getItem("aone_mock_templates");
        if (saved) {
            try {
                customTemplates = JSON.parse(saved);
            } catch (e) {
                // ignore
            }
        }
        
        // Load History
        const hist = localStorage.getItem("aone_mock_history");
        if (hist) {
            try {
                generationHistory = JSON.parse(hist);
            } catch (e) {
                // ignore
            }
        }
    });

    function addField() {
        const id = crypto.randomUUID();
        fields.push({
            id,
            name: `field_${fields.length + 1}`,
            type: "person_fullName",
            isRequired: true,
        });
        expandedFieldId = id;
    }

    function removeField(id: string) {
        if (fields.length === 1) {
            status = {
                type: "error",
                text: "请至少保留一个字段。",
            };
            return;
        }
        fields = fields.filter((f) => f.id !== id);
        if (expandedFieldId === id) {
            expandedFieldId = null;
        }
    }

    function duplicateField(field: FieldDefinition) {
        const index = fields.findIndex((f) => f.id === field.id);
        const duplicated = {
            ...JSON.parse(JSON.stringify(field)),
            id: crypto.randomUUID(),
            name: `${field.name}_copy`,
        };
        if (index !== -1) {
            fields.splice(index + 1, 0, duplicated);
        } else {
            fields.push(duplicated);
        }
        expandedFieldId = duplicated.id;
    }

    function moveField(index: number, direction: "up" | "down") {
        if (direction === "up" && index > 0) {
            const temp = fields[index];
            fields[index] = fields[index - 1];
            fields[index - 1] = temp;
        } else if (direction === "down" && index < fields.length - 1) {
            const temp = fields[index];
            fields[index] = fields[index + 1];
            fields[index + 1] = temp;
        }
    }

    function loadPreset(preset: typeof PRESETS[0]) {
        fields = JSON.parse(JSON.stringify(preset.fields));
        expandedFieldId = null;
        status = {
            type: "success",
            text: `已加载预设模板: ${preset.name}`,
        };
    }

    function loadTemplate(tpl: typeof customTemplates[0]) {
        fields = JSON.parse(JSON.stringify(tpl.fields));
        expandedFieldId = null;
        status = {
            type: "success",
            text: `已加载自定义模板: ${tpl.name}`,
        };
    }

    function clearAll() {
        fields = [
            { id: crypto.randomUUID(), name: "id", type: "string_uuid", isRequired: true, isUnique: true }
        ];
        expandedFieldId = null;
        status = {
            type: "idle",
            text: "工作台已清空。已重置为单个 UUID 主键字段。",
        };
    }

    function handleImport() {
        importError = "";
        let parsed: Partial<FieldDefinition>[] = [];

        if (importFormat === "json") {
            parsed = parseJSON(importText);
        } else {
            parsed = parseSQLDDL(importText);
        }

        if (parsed.length === 0) {
            importError = "未能识别出任何字段，请检查输入格式是否有效。";
            return;
        }

        fields = parsed.map((f) => ({
            id: crypto.randomUUID(),
            name: f.name || "field",
            type: f.type || "person_fullName",
            isRequired: f.isRequired ?? false,
            min: f.min,
            max: f.max,
            fractionDigits: f.fractionDigits,
            nullPercentage: f.nullPercentage ?? 0,
            enumValues: f.enumValues,
            isUnique: f.isUnique ?? false,
            prefix: f.prefix,
            suffix: f.suffix
        }));

        showImportModal = false;
        importText = "";
        expandedFieldId = null;
        status = {
            type: "success",
            text: `已成功解析并导入 ${fields.length} 个字段！`,
        };
    }

    function openBulkEditor() {
        bulkFieldsJson = JSON.stringify(
            fields.map((f) => ({
                name: f.name,
                type: f.type,
                isRequired: f.isRequired ?? false,
                nullPercentage: f.nullPercentage ?? 0,
                min: f.min,
                max: f.max,
                fractionDigits: f.fractionDigits,
                prefix: f.prefix,
                suffix: f.suffix,
                enumValues: f.enumValues,
                isUnique: f.isUnique ?? false
            })),
            null,
            2
        );
        bulkEditorError = "";
        showBulkEditorModal = true;
    }

    function applyBulkJson() {
        bulkEditorError = "";
        try {
            const parsed = JSON.parse(bulkFieldsJson);
            if (!Array.isArray(parsed)) {
                bulkEditorError = "JSON 数据格式不正确，最外层必须为字段配置数组。";
                return;
            }

            const mapped = parsed.map((item: any, idx: number) => {
                if (typeof item !== "object" || !item) {
                    throw new Error(`第 ${idx + 1} 个字段配置项必须是一个 JSON 对象。`);
                }
                if (typeof item.name !== "string" || !item.name.trim()) {
                    throw new Error(`第 ${idx + 1} 个字段配置缺少有效的 'name' 属性。`);
                }
                if (typeof item.type !== "string") {
                    throw new Error(`第 ${idx + 1} 个字段 '${item.name}' 缺少有效的 'type' 属性。`);
                }
                return {
                    id: crypto.randomUUID(),
                    name: item.name.trim(),
                    type: item.type,
                    isRequired: !!item.isRequired,
                    nullPercentage: typeof item.nullPercentage === "number" ? item.nullPercentage : 0,
                    min: typeof item.min === "number" ? item.min : undefined,
                    max: typeof item.max === "number" ? item.max : undefined,
                    fractionDigits: typeof item.fractionDigits === "number" ? item.fractionDigits : undefined,
                    prefix: typeof item.prefix === "string" ? item.prefix : undefined,
                    suffix: typeof item.suffix === "string" ? item.suffix : undefined,
                    enumValues: typeof item.enumValues === "string" ? item.enumValues : undefined,
                    isUnique: !!item.isUnique
                };
            });

            fields = mapped;
            showBulkEditorModal = false;
            expandedFieldId = null;
            status = {
                type: "success",
                text: `成功通过 JSON 批量载入了 ${mapped.length} 个字段配置！`
            };
        } catch (e) {
            bulkEditorError = e instanceof Error ? e.message : "JSON 解析失败，请检查格式语法是否符合要求。";
        }
    }

    function saveCustomTemplate() {
        if (!newTemplateName.trim()) return;
        const name = newTemplateName.trim();
        const newTpl = { name, fields: $state.snapshot(fields) };
        customTemplates = [...customTemplates.filter(t => t.name !== name), newTpl];
        localStorage.setItem("aone_mock_templates", JSON.stringify(customTemplates));
        newTemplateName = "";
        showSaveTemplateModal = false;
        status = {
            type: "success",
            text: `配置已保存为自定义模板: ${name}`,
        };
    }

    function removeCustomTemplate(name: string) {
        customTemplates = customTemplates.filter(t => t.name !== name);
        localStorage.setItem("aone_mock_templates", JSON.stringify(customTemplates));
    }

    function loadHistoryItem(item: typeof generationHistory[0]) {
        fields = JSON.parse(JSON.stringify(item.fields));
        rowCount = item.rows;
        tableName = item.tableName;
        expandedFieldId = null;
        showHistoryModal = false;
        status = {
            type: "success",
            text: `已恢复历史生成配置: ${item.tableName} (${item.timestamp})`,
        };
    }

    function clearHistory() {
        generationHistory = [];
        localStorage.removeItem("aone_mock_history");
    }

    async function generate() {
        if (hasValidationErrors) {
            status = {
                type: "error",
                text: `校验未通过: ${validationErrors[0].message} (共 ${validationErrors.length} 处错误)`,
            };
            return;
        }

        const rows = Math.min(Math.max(Number(rowCount) || 1, 1), MAX_ROWS);
        rowCount = rows;
        tableName = normalizeIdentifier(tableName, "mock_data");

        isGenerating = true;
        status = { type: "idle", text: "正在生成 mock 数据..." };

        await new Promise(r => setTimeout(r, 100)); // Brief pause for transition

        try {
            const seedValue = useSeed ? seedVal : undefined;
            const result = generateMockData(fields, rows, locale, seedValue, anomalyMode);
            generatedData = result.data;
            generatedRecords = result.records;
            generatedFields = result.fields;

            // Save last generated states
            lastGeneratedFieldsJson = JSON.stringify(fields);
            lastGeneratedRowCount = rows;
            lastGeneratedTableName = tableName;
            lastGeneratedLocale = locale;
            lastGeneratedSeed = seedValue;
            lastGeneratedAnomalyMode = anomalyMode;

            // Append to Generation History
            const histItem = {
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                tableName,
                rows,
                fields: $state.snapshot(fields)
            };
            const filtered = generationHistory.filter(h => JSON.stringify(h.fields) !== lastGeneratedFieldsJson);
            generationHistory = [histItem, ...filtered].slice(0, 5);
            localStorage.setItem("aone_mock_history", JSON.stringify(generationHistory));

            isGenerating = false;
            status = {
                type: "success",
                text: `成功生成 ${rows} 行数据，包含 ${result.fields.length} 个字段。`,
            };
        } catch (error) {
            isGenerating = false;
            status = {
                type: "error",
                text: error instanceof Error ? error.message : "数据生成失败，请检查配置。",
            };
        }
    }

    async function copyAs(format: "json" | "csv" | "sql" | "markdown" | "typescript") {
        if (generatedData.length === 0) {
            status = { type: "error", text: "请先生成数据再进行复制。" };
            return;
        }
        try {
            const text = await getMockExportText(format, tableName, generatedData, generatedRecords, generatedFields);
            await navigator.clipboard.writeText(text);
            status = {
                type: "success",
                text: `已成功复制 ${format.toUpperCase()} 格式到剪贴板。`,
            };
        } catch (err) {
            status = {
                type: "error",
                text: "复制失败，可能是浏览器剪贴板权限不足。",
            };
        }
    }

    async function downloadAs(format: "json" | "csv" | "sql" | "excel") {
        if (generatedData.length === 0) {
            status = { type: "error", text: "请先生成数据再进行下载。" };
            return;
        }
        try {
            if (format === "excel") {
                const { downloadExcel } = await import("../../table-editor/lib/excel");
                downloadExcel(generatedData, `${tableName}_mock.xlsx`);
                status = {
                    type: "success",
                    text: `已成功导出 Excel 文件: ${tableName}_mock.xlsx`,
                };
                return;
            }

            const text = await getMockExportText(format, tableName, generatedData, generatedRecords, generatedFields);
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${tableName}_mock.${format}`;
            a.click();
            URL.revokeObjectURL(url);
            status = {
                type: "success",
                text: `已下载文件 ${tableName}_mock.${format}`,
            };
        } catch (err) {
            status = {
                type: "error",
                text: "文件下载与导出失败。",
            };
        }
    }

    function toggleSettings(id: string) {
        expandedFieldId = expandedFieldId === id ? null : id;
    }

    function getFieldError(fieldId: string, key?: string) {
        return validationErrors.find(
            (e) => e.fieldId === fieldId && (!key || e.key === key || e.key === "min_max")
        );
    }
</script>

<svelte:window onkeydown={(e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        generate();
    }
}} />

<svelte:head>
    <title>Mock 数据生成器 - Aone Toolkit</title>
</svelte:head>

<div class="h-full p-2 sm:p-3 overflow-hidden max-w-[1600px] mx-auto flex flex-col space-y-3">
    <!-- Purpose statement & header banner -->
    <div class="bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
            <div class="flex items-center gap-2">
                <Sparkles size={16} class="text-slate-700 dark:text-slate-300" />
                <h1 class="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Mock 数据生成工作台</h1>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                用于快速生成开发联调、测试用例和演示所需的 mock 数据。支持配置字段细节、生成语言选择、固定种子、多格式导出以及从 JSON/DDL 导入架构。
            </p>
        </div>
        <div class="flex flex-wrap gap-1.5 shrink-0">
            <Button variant="outline" size="sm" class="text-xs py-1 px-2.5" onclick={() => (showImportModal = true)}>
                <Import size={12} class="mr-1" /> 导入 Schema
            </Button>
            <Button variant="outline" size="sm" class="text-xs py-1 px-2.5" onclick={openBulkEditor}>
                <SlidersHorizontal size={12} class="mr-1" /> 批量编辑 JSON
            </Button>
            <Button variant="outline" size="sm" class="text-xs py-1 px-2.5" onclick={() => (showSaveTemplateModal = true)}>
                <Save size={12} class="mr-1" /> 保存为模板
            </Button>
            {#if generationHistory.length > 0}
                <Button variant="outline" size="sm" class="text-xs py-1 px-2.5" onclick={() => (showHistoryModal = true)}>
                    <History size={12} class="mr-1" /> 生成历史
                </Button>
            {/if}
            <Button variant="danger" size="sm" class="text-xs py-1 px-2.5" onclick={clearAll}>
                清空重置
            </Button>
        </div>
    </div>

    <!-- Presets Toolbar -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
        <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-400">推荐模板预设：</span>
            <div class="flex flex-wrap gap-1.5">
                {#each PRESETS as preset}
                    <button
                        onclick={() => loadPreset(preset)}
                        class="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title={preset.desc}
                    >
                        {preset.name}
                    </button>
                {/each}
            </div>
        </div>

        {#if customTemplates.length > 0}
            <div class="flex items-center gap-2 w-full sm:w-auto">
                <span class="text-xs font-semibold text-slate-400 flex-shrink-0">自定义：</span>
                <div class="flex flex-wrap gap-1.5 max-w-[300px] overflow-x-auto">
                    {#each customTemplates as tpl}
                        <div class="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs pl-2 pr-1 py-0.5 group">
                            <button
                                onclick={() => loadTemplate(tpl)}
                                class="font-medium text-slate-700 dark:text-slate-200 mr-1 hover:text-slate-900 dark:hover:text-white"
                            >
                                {tpl.name}
                            </button>
                            <button
                                onclick={() => removeCustomTemplate(tpl.name)}
                                class="text-slate-400 hover:text-red-500 font-bold ml-1 transition-colors cursor-pointer"
                                title="删除此模板"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>

    <!-- Main Workspace Grid -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        <!-- Left Column: Fields & Database configurations -->
        <div class="lg:col-span-5 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs overflow-hidden">
            <!-- Panel Header -->
            <div class="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="font-semibold text-xs text-slate-900 dark:text-slate-100">字段结构配置</span>
                    <span class="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium px-1.5 py-0.5 rounded">
                        {fields.length} 个字段
                    </span>
                </div>
                <Button variant="ghost" size="sm" class="text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 py-1" onclick={addField}>
                    <Plus size={13} class="mr-0.5" /> 添加字段
                </Button>
            </div>

            <!-- Fields List Container -->
            <div class="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/30 dark:bg-slate-950/20">
                {#each fields as field, index (field.id)}
                    {@const hasError = getFieldError(field.id)}
                    <div
                        class="bg-white dark:bg-slate-900 rounded-lg border transition-colors flex flex-col shadow-2xs
                        {hasError ? 'border-red-300 dark:border-red-900/50 ring-1 ring-red-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}"
                    >
                        <!-- Main row -->
                        <div class="flex items-center gap-2 p-2.5">
                            <!-- Drag/move buttons -->
                            <div class="flex flex-col gap-0.5">
                                <button
                                    class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 p-0.5"
                                    onclick={() => moveField(index, "up")}
                                    disabled={index === 0}
                                    title="上移"
                                >
                                    <ArrowUp size={12} />
                                </button>
                                <button
                                    class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 p-0.5"
                                    onclick={() => moveField(index, "down")}
                                    disabled={index === fields.length - 1}
                                    title="下移"
                                >
                                    <ArrowDown size={12} />
                                </button>
                            </div>

                            <!-- Field Name input -->
                            <div class="flex-1 min-w-0">
                                <input
                                    type="text"
                                    bind:value={field.name}
                                    placeholder="字段名 (例如: user_id)"
                                    class="w-full text-xs font-mono py-1 px-2 bg-slate-50 dark:bg-slate-950 border rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400
                                    {hasError ? 'border-red-400 text-red-600' : 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'}"
                                />
                                {#if hasError}
                                    <div class="text-[10px] text-red-500 font-medium mt-0.5 px-0.5">
                                        {hasError.message}
                                    </div>
                                {/if}
                            </div>

                            <!-- Field Type select -->
                            <div class="w-36">
                                <select
                                    bind:value={field.type}
                                    class="w-full bg-slate-50 dark:bg-slate-950 text-xs py-1 px-2 pr-6 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                >
                                    {#each FIELD_TYPES as group}
                                        <optgroup label={group.group} class="text-[11px] font-bold">
                                            {#each group.types as type}
                                                <option value={type.id}>{type.label}</option>
                                            {/each}
                                        </optgroup>
                                    {/each}
                                </select>
                            </div>

                            <!-- Inline Action buttons -->
                            <div class="flex items-center gap-0.5">
                                <button
                                    class="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                    onclick={() => toggleSettings(field.id)}
                                    title="展开/折叠 高级规则"
                                >
                                    <Settings size={14} class={expandedFieldId === field.id ? "text-primary-500" : ""} />
                                </button>
                                <button
                                    class="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                    onclick={() => duplicateField(field)}
                                    title="复制字段"
                                >
                                    <Copy size={14} />
                                </button>
                                <button
                                    class="p-1 rounded text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors"
                                    onclick={() => removeField(field.id)}
                                    title="删除字段"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <!-- Collapsible Advanced Settings -->
                        {#if expandedFieldId === field.id}
                            <div class="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-700 bg-slate-50/20 dark:bg-slate-900/30 text-xs space-y-3.5 rounded-b-xl">
                                <!-- Validation error for limits -->
                                {#if getFieldError(field.id, "min_max")}
                                    <div class="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium">
                                        <AlertCircle size={12} />
                                        {getFieldError(field.id, "min_max")?.message}
                                    </div>
                                {/if}

                                <!-- Dynamic options based on field type -->
                                {#if field.type.startsWith("number_")}
                                    <div class="grid grid-cols-3 gap-2.5">
                                        <div>
                                            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">最小值 (Min)</span>
                                            <input
                                                type="number"
                                                bind:value={field.min}
                                                placeholder="默认"
                                                class="w-full text-xs p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                                            />
                                        </div>
                                        <div>
                                            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">最大值 (Max)</span>
                                            <input
                                                type="number"
                                                bind:value={field.max}
                                                placeholder="默认"
                                                class="w-full text-xs p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                                            />
                                        </div>
                                        {#if field.type !== "number_int"}
                                            <div>
                                                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">小数位数 (Decimals)</span>
                                                <input
                                                    type="number"
                                                    bind:value={field.fractionDigits}
                                                    min="0"
                                                    max="5"
                                                    placeholder="2"
                                                    class="w-full text-xs p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                                                />
                                            </div>
                                        {/if}
                                    </div>
                                {:else if field.type === "enum"}
                                    <div>
                                        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">枚举取值范围 (逗号分隔，如: pending, success, fail)</span>
                                        <input
                                            type="text"
                                            bind:value={field.enumValues}
                                            placeholder="输入逗号分隔的选项值"
                                            class="w-full text-xs p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                                        />
                                        {#if getFieldError(field.id, "enumValues")}
                                            <div class="text-[10px] text-red-500 font-semibold mt-1">
                                                {getFieldError(field.id, "enumValues")?.message}
                                            </div>
                                        {/if}
                                    </div>
                                {/if}

                                <!-- Common settings: prefix/suffix -->
                                {#if field.type !== "boolean" && field.type !== "json_object" && field.type !== "array_simple"}
                                    <div class="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">固定前缀 (Prefix)</span>
                                            <input
                                                type="text"
                                                bind:value={field.prefix}
                                                placeholder="如: USR_"
                                                class="w-full text-xs p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                                            />
                                        </div>
                                        <div>
                                            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">固定后缀 (Suffix)</span>
                                            <input
                                                type="text"
                                                bind:value={field.suffix}
                                                placeholder="如: _CN"
                                                class="w-full text-xs p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                                            />
                                        </div>
                                    </div>
                                {/if}

                                <!-- Constraints: required, unique, null ratio -->
                                <div class="flex flex-wrap items-center gap-4 bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-lg">
                                    <label class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                                        <input type="checkbox" bind:checked={field.isRequired} class="rounded text-emerald-600 focus:ring-emerald-500" />
                                        <span>必填字段 (Not Null)</span>
                                    </label>

                                    {#if field.type !== "boolean"}
                                        <label class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                                            <input type="checkbox" bind:checked={field.isUnique} class="rounded text-emerald-600 focus:ring-emerald-500" />
                                            <span>唯一值限制 (Unique)</span>
                                        </label>
                                    {/if}

                                    {#if !field.isRequired}
                                        <div class="flex items-center gap-1.5 ml-auto">
                                            <span class="text-[10px] font-bold text-slate-400 uppercase">空值比例</span>
                                            <input
                                                type="number"
                                                bind:value={field.nullPercentage}
                                                min="0"
                                                max="100"
                                                class="w-12 text-xs p-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-center"
                                            />
                                            <span class="text-slate-500">%</span>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>

            <!-- Parameters & Run Options Bottom Bar -->
            <div class="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5 mb-1">表名称 (SQL/CSV)</span>
                        <input
                            type="text"
                            bind:value={tableName}
                            class="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-100"
                        />
                    </div>
                    <div>
                        <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5 mb-1">生成行数 (Max {MAX_ROWS})</span>
                        <input
                            type="number"
                            bind:value={rowCount}
                            min="1"
                            max={MAX_ROWS}
                            class="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-100"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <!-- Generation Mode select -->
                    <div>
                        <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5 mb-1">数据生成模式</span>
                        <select
                            bind:value={anomalyMode}
                            class="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-100 font-medium"
                        >
                            <option value={false}>正常模拟数据 (Normal)</option>
                            <option value={true}>⚠️ 边界值与异常测试 (Anomaly)</option>
                        </select>
                    </div>

                    <!-- Locale controls -->
                    <div>
                        <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5 mb-1">模拟语言 (Locale)</span>
                        <div class="flex border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden h-8 bg-white dark:bg-slate-950 p-0.5">
                            <button
                                onclick={() => (locale = "zh")}
                                class="flex-1 text-xs font-medium rounded transition-colors {locale === 'zh' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}"
                            >
                                中文
                            </button>
                            <button
                                onclick={() => (locale = "en")}
                                class="flex-1 text-xs font-medium rounded transition-colors {locale === 'en' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}"
                            >
                                EN
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <!-- Seed controls -->
                    <div class="flex items-center gap-2">
                        <label class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                            <input type="checkbox" bind:checked={useSeed} class="rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-slate-400" />
                            <span>固定种子</span>
                        </label>
                        {#if useSeed}
                            <input
                                type="number"
                                bind:value={seedVal}
                                class="w-14 text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-center focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-100"
                            />
                        {/if}
                    </div>

                    <span class="text-[10px] text-slate-400 font-medium select-none">Ctrl + Enter 快捷生成</span>
                </div>

                <!-- Status indicators -->
                {#if status.text}
                    <div
                        class="rounded-md border px-2.5 py-1.5 text-xs flex items-center gap-1.5 {status.type === 'error'
                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400'
                            : status.type === 'success'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400'}"
                    >
                        <AlertCircle size={13} class="shrink-0" />
                        <span>{status.text}</span>
                    </div>
                {/if}

                <!-- Generate Trigger Button -->
                <Button
                    class="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 font-medium flex items-center justify-center py-1.5 text-xs shadow-2xs transition-colors cursor-pointer"
                    onclick={generate}
                    disabled={isGenerating}
                >
                    {#if isGenerating}
                        <RefreshCw size={13} class="mr-1.5 animate-spin" /> 正在生成 mock 数据...
                    {:else}
                        <Play size={13} class="mr-1.5" /> 生成数据 (Ctrl+Enter)
                    {/if}
                </Button>
            </div>
        </div>

        <!-- Right Column: Live Table Preview & Export panel -->
        <div class="lg:col-span-7 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs overflow-hidden">
            <!-- Header Export Controls -->
            <div class="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div class="flex items-center gap-2">
                    <span class="font-semibold text-xs text-slate-900 dark:text-slate-100">数据生成预览</span>
                </div>

                {#if generatedData.length > 0}
                    <div class="flex flex-wrap gap-1.5">
                        <!-- Clipboard exports -->
                        <div class="flex border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-800 p-0.5">
                            <button onclick={() => copyAs("json")} class="text-[10px] font-medium px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">JSON</button>
                            <button onclick={() => copyAs("csv")} class="text-[10px] font-medium px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border-l border-slate-200 dark:border-slate-700 cursor-pointer">CSV</button>
                            <button onclick={() => copyAs("sql")} class="text-[10px] font-medium px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border-l border-slate-200 dark:border-slate-700 cursor-pointer">SQL</button>
                            <button onclick={() => copyAs("markdown")} class="text-[10px] font-medium px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border-l border-slate-200 dark:border-slate-700 cursor-pointer">Markdown</button>
                            <button onclick={() => copyAs("typescript")} class="text-[10px] font-medium px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border-l border-slate-200 dark:border-slate-700 flex items-center gap-0.5 cursor-pointer" title="复制为 TypeScript Interface">
                                <FileCode size={10} /> TS
                            </button>
                        </div>

                        <!-- Downloader exports -->
                        <div class="flex border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-800 p-0.5">
                            <button onclick={() => downloadAs("json")} class="text-[10px] font-medium px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-0.5 cursor-pointer">
                                <Download size={10} /> JSON
                            </button>
                            <button onclick={() => downloadAs("csv")} class="text-[10px] font-medium px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border-l border-slate-200 dark:border-slate-700 cursor-pointer">CSV</button>
                            <button onclick={() => downloadAs("sql")} class="text-[10px] font-medium px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border-l border-slate-200 dark:border-slate-700 cursor-pointer">SQL</button>
                            <button onclick={() => downloadAs("excel")} class="text-[10px] font-medium px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border-l border-slate-200 dark:border-slate-700 flex items-center gap-0.5 cursor-pointer" title="下载为 Excel 表格">
                                <Download size={10} /> Excel
                            </button>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Out-of-sync configuration warning banner -->
            {#if isDirty}
                <div class="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle size={13} class="flex-shrink-0 animate-bounce" />
                    <span>字段配置或参数已被修改。当前预览显示为历史生成数据，请点击“生成数据”刷新预览。</span>
                </div>
            {/if}

            <!-- Preview Data Area -->
            {#if generatedData.length > 0}
                <!-- Preview Table metadata statistics header -->
                <div class="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>预览数据：共 {generatedRecords.length} 行 / {generatedFields.length} 个字段</span>
                    <span class="flex items-center gap-1.5">
                        {#if lastGeneratedAnomalyMode}
                            <span class="bg-red-500/10 text-red-650 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">⚠️ 边界异常测试数据</span>
                        {:else}
                            <span class="text-slate-500 font-bold">正常模拟数据</span>
                        {/if}
                        <span>•</span>
                        <span>{lastGeneratedLocale === 'zh' ? '中文 (ZH_CN)' : 'English (EN)'} {lastGeneratedSeed !== undefined ? `/ 种子: ${lastGeneratedSeed}` : ''}</span>
                    </span>
                </div>

                <div class="flex-1 overflow-auto bg-white dark:bg-slate-900">
                    <table class="w-full text-xs text-left font-mono text-slate-600 dark:text-slate-300 border-collapse">
                        <thead class="bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th class="p-2 border-b border-slate-200 dark:border-slate-800 text-center text-[10px] font-bold text-slate-400 w-10">#</th>
                                {#each generatedData[0] as header}
                                    <th class="p-2 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 select-all">{header}</th>
                                {/each}
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {#each generatedData.slice(1) as row, idx}
                                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors odd:bg-white dark:odd:bg-slate-900 even:bg-slate-50/30 dark:even:bg-slate-800/10">
                                    <td class="p-2 border-b border-slate-100 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 text-center select-none">{idx + 1}</td>
                                    {#each row as cell}
                                        <td class="p-2 border-b border-slate-100 dark:border-slate-800/40 truncate max-w-[200px]" title={cell || "NULL (空值)"}>
                                            {#if cell === ""}
                                                <span class="text-slate-400 dark:text-slate-500 italic select-none">null</span>
                                            {:else}
                                                {cell}
                                            {/if}
                                        </td>
                                    {/each}
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
                <!-- Elegant Empty State when no data generated -->
                <div class="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4 bg-slate-50/20 dark:bg-slate-950/10">
                    <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Play size={28} class="text-slate-400 dark:text-slate-600 ml-1" />
                    </div>
                    <div class="max-w-md">
                        <p class="font-bold text-sm text-slate-700 dark:text-slate-200">未生成预览数据</p>
                        <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            请在左侧配置字段类型、字段命名、数值范围等限制条件，完成配置后，点击左下角“生成数据”按钮或使用 Ctrl + Enter 快捷键在此预览结果。
                        </p>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- Modal: Import Schema -->
{#if showImportModal}
    <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-2xl w-full shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <Import size={15} class="text-slate-700 dark:text-slate-300" />
                    <span class="font-semibold text-xs text-slate-900 dark:text-slate-100">导入架构 (Import Schema)</span>
                </div>
                <button onclick={() => (showImportModal = false)} class="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 flex-1 overflow-y-auto space-y-3.5">
                <div class="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>架构格式：</span>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" bind:group={importFormat} value="json" class="rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-slate-400" />
                        <span>JSON / JSON Schema</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" bind:group={importFormat} value="ddl" class="rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-slate-400" />
                        <span>SQL DDL (CREATE TABLE)</span>
                    </label>
                </div>

                <div class="space-y-1">
                    <label for="import-schema-textarea" class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">在下方输入或粘贴 Schema 内容：</label>
                    <textarea
                        id="import-schema-textarea"
                        bind:value={importText}
                        rows="8"
                        class="w-full text-xs font-mono p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-200"
                        placeholder={importFormat === 'json'
                            ? '{\n  "id": 1,\n  "name": "张三",\n  "email": "zhangsan@example.com",\n  "created_at": "2026-06-27"\n}'
                            : 'CREATE TABLE users (\n  id INT PRIMARY KEY,\n  username VARCHAR(50) NOT NULL,\n  email VARCHAR(100) UNIQUE,\n  created_at DATE\n);'}
                    ></textarea>
                </div>

                {#if importError}
                    <div class="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium">
                        <AlertCircle size={14} />
                        <span>{importError}</span>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-2">
                <Button variant="ghost" size="sm" class="text-xs" onclick={() => (showImportModal = false)}>
                    取消
                </Button>
                <Button variant="primary" size="sm" class="text-xs font-semibold px-3.5" onclick={handleImport}>
                    解析并导入字段
                </Button>
            </div>
        </div>
    </div>
{/if}

<!-- Modal: Save Custom Template -->
{#if showSaveTemplateModal}
    <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-sm w-full shadow-xl overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <Save size={15} class="text-slate-700 dark:text-slate-300" />
                    <span class="font-semibold text-xs text-slate-900 dark:text-slate-100">保存模板</span>
                </div>
                <button onclick={() => (showSaveTemplateModal = false)} class="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 space-y-2.5">
                <div class="space-y-1">
                    <label for="template-name-input" class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">自定义模板名称：</label>
                    <input
                        id="template-name-input"
                        type="text"
                        bind:value={newTemplateName}
                        placeholder="例如: 我的用户接口-V1"
                        class="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-200"
                    />
                </div>
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-2">
                <Button variant="ghost" size="sm" class="text-xs" onclick={() => (showSaveTemplateModal = false)}>
                    取消
                </Button>
                <Button variant="primary" size="sm" class="text-xs font-semibold px-3.5" onclick={saveCustomTemplate}>
                    保存模板
                </Button>
            </div>
        </div>
    </div>
{/if}

<!-- Modal: Bulk JSON Schema Editor -->
{#if showBulkEditorModal}
    <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-2xl w-full shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <SlidersHorizontal size={15} class="text-slate-700 dark:text-slate-300" />
                    <span class="font-semibold text-xs text-slate-900 dark:text-slate-100">批量编辑字段 JSON 结构</span>
                </div>
                <button onclick={() => (showBulkEditorModal = false)} class="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 flex-1 overflow-y-auto space-y-3.5">
                <div class="space-y-1">
                    <label for="bulk-json-textarea" class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">在下方修改字段数组配置 JSON：</label>
                    <textarea
                        id="bulk-json-textarea"
                        bind:value={bulkFieldsJson}
                        rows="12"
                        class="w-full text-xs font-mono p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-200"
                        placeholder={'[\n  {\n    "name": "id",\n    "type": "string_uuid",\n    "isRequired": true\n  }\n]'}
                    ></textarea>
                </div>

                {#if bulkEditorError}
                    <div class="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium">
                        <AlertCircle size={14} />
                        <span>{bulkEditorError}</span>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-2">
                <Button variant="ghost" size="sm" class="text-xs" onclick={() => (showBulkEditorModal = false)}>
                    取消
                </Button>
                <Button variant="primary" size="sm" class="text-xs font-semibold px-3.5" onclick={applyBulkJson}>
                    应用配置
                </Button>
            </div>
        </div>
    </div>
{/if}

<!-- Modal: Generation History -->
{#if showHistoryModal}
    <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <History size={15} class="text-slate-700 dark:text-slate-300" />
                    <span class="font-semibold text-xs text-slate-900 dark:text-slate-100">历史生成配置记录 (最近 5 次)</span>
                </div>
                <button onclick={() => (showHistoryModal = false)} class="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 flex-1 overflow-y-auto space-y-2.5">
                {#each generationHistory as hist, idx}
                    <div class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                        <div class="space-y-0.5">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-xs text-slate-800 dark:text-slate-200">{hist.tableName}</span>
                                <span class="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                                    {hist.rows} 行 / {hist.fields.length} 字段
                                </span>
                            </div>
                            <p class="text-[10px] text-slate-400 font-medium">生成时间: {hist.timestamp}</p>
                        </div>
                        <Button variant="outline" size="sm" class="text-xs py-0.5 px-2" onclick={() => loadHistoryItem(hist)}>
                            载入配置
                        </Button>
                    </div>
                {/each}
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between gap-2">
                <Button variant="ghost-danger" size="sm" class="text-xs" onclick={clearHistory}>
                    清除历史记录
                </Button>
                <Button variant="ghost" size="sm" class="text-xs" onclick={() => (showHistoryModal = false)}>
                    关闭
                </Button>
            </div>
        </div>
    </div>
{/if}
