<script lang="ts">
    import {
        CodeFormatterService,
        type FormatterOptions,
    } from "$lib/services/formatter/CodeFormatterService";
    import { DiffStats } from "$lib/services/formatter/ux/DiffStats";
    import { CodeBlock } from "$lib/components/ui";

    // 交互式参数调优台 (Feature 17)
    // 这里是一个基础的 Svelte DEMO，展示所见即所得的参数映射

    let { initialSql = "select id from users where status=1" } = $props<{
        initialSql?: string;
    }>();

    let options: FormatterOptions = {
        tabWidth: 4,
        keywordCase: "upper",
        linesBetweenQueries: 2,
        useAliasInference: false,
    };

    let formattedSql = $state("");
    let intensity = $state({ intensityScore: 0, whitespaceOnly: true });
    let debounceTimer: ReturnType<typeof setTimeout>;

    // 响应式监听 options 和 initialSql 变化
    $effect(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            try {
                formattedSql = CodeFormatterService.format(initialSql, options).result;
                intensity = DiffStats.calculateIntensity(
                    initialSql,
                    formattedSql,
                );
            } catch (e) {
                formattedSql = "Formatting error";
            }
        }, 200); // Feature 17: 200ms 防抖
    });


    function toggleCase() {
        options.keywordCase =
            options.keywordCase === "upper" ? "lower" : "upper";
    }
</script>

<div class="tuner-panel">
    <h3>Formatter Setting Tuner</h3>

    <div class="controls">
        <label>
            Tab Width: {options.tabWidth}
            <input
                type="range"
                min="2"
                max="8"
                step="2"
                bind:value={options.tabWidth}
            />
        </label>

        <label>
            Keyword Case: {options.keywordCase}
            <button onclick={toggleCase}>Toggle Case</button>
        </label>

        <label>
            <input type="checkbox" bind:checked={options.useAliasInference} />
            Use Alias Inference
        </label>

        <div class="intensity-stats">
            Formatting Intensity:
            <span
                class="score"
                style="color: {intensity.intensityScore > 50 ? 'red' : 'green'}"
            >
                {intensity.intensityScore}%
            </span>
            {#if intensity.whitespaceOnly}
                (Purely whitespace)
            {:else}
                (Structural changes!)
            {/if}
        </div>
    </div>

    <div class="preview mt-3">
        <h4 class="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Preview</h4>
        <CodeBlock
            code={formattedSql}
            language="sql"
            showHeader={false}
            showLineNumbers={true}
            wrapLines={true}
            class="!my-0"
        />
    </div>
</div>

<style>
    .tuner-panel {
        border: 1px solid #ccc;
        padding: 1rem;
        border-radius: 8px;
    }
    .controls label {
        display: block;
        margin-bottom: 0.5rem;
    }
</style>
