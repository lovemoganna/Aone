<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { theme } from "$lib/stores";
    import { EditorView, basicSetup } from "codemirror";
    import { EditorState, Compartment, StateField, RangeSetBuilder } from "@codemirror/state";
    import { oneDark } from "@codemirror/theme-one-dark";
    import { keymap, Decoration, type DecorationSet } from "@codemirror/view";
    import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
    import { searchKeymap } from "@codemirror/search";

    interface Props {
        value: string;
        placeholder?: string;
        onChange?: (newValue: string) => void;
    }

    let {
        value = $bindable(),
        placeholder = "在此输入 Prompt 核心指令...使用 {{变量名}} 定义动态参数",
        onChange
    }: Props = $props();

    let editorContainer = $state<HTMLDivElement | null>(null);
    let view = $state<EditorView | null>(null);

    const themeCompartment = new Compartment();

    // Variable highlighting decoration mark
    const varDecoration = Decoration.mark({
        class: "cm-prompt-variable"
    });

    // CodeMirror state field for highlighting {{variable}} patterns
    const variableHighlightField = StateField.define<DecorationSet>({
        create(state) {
            return buildVariableDecorations(state);
        },
        update(decorations, tr) {
            if (tr.docChanged || tr.selection) {
                return buildVariableDecorations(tr.state);
            }
            return decorations.map(tr.changes);
        },
        provide: f => EditorView.decorations.from(f)
    });

    function buildVariableDecorations(state: EditorState): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const regex = /\{\{\s*[\u4e00-\u9fa5\w-]+\s*\}\}/g;
        const text = state.doc.toString();
        let match;

        while ((match = regex.exec(text)) !== null) {
            const from = match.index;
            const to = from + match[0].length;
            if (from < to && to <= state.doc.length) {
                builder.add(from, to, varDecoration);
            }
        }

        return builder.finish();
    }

    // Studio custom theme
    const studioEditorTheme = EditorView.theme({
        "&": {
            height: "100%",
            fontSize: "13px",
            fontFamily: "var(--font-mono, 'JetBrains Mono', 'Noto Sans SC', monospace)",
            backgroundColor: "transparent",
        },
        ".cm-scroller": {
            overflow: "auto",
            fontFamily: "inherit",
            lineHeight: "1.65",
            padding: "8px 0",
        },
        ".cm-content": {
            padding: "0 12px",
            caretColor: "#6366f1",
        },
        "&.cm-focused": {
            outline: "none",
        },
        ".cm-gutters": {
            backgroundColor: "transparent",
            borderRight: "1px solid rgba(148, 163, 184, 0.15)",
            color: "rgba(148, 163, 184, 0.6)",
            fontSize: "11px",
            paddingRight: "8px",
        },
        ".cm-activeLineGutter": {
            backgroundColor: "rgba(99, 102, 241, 0.08)",
            color: "#6366f1",
            fontWeight: "bold",
        },
        ".cm-activeLine": {
            backgroundColor: "rgba(99, 102, 241, 0.04)",
        },
        ".cm-selectionBackground, ::selection": {
            backgroundColor: "rgba(99, 102, 241, 0.2) !important",
        },
        ".cm-placeholder": {
            color: "rgba(148, 163, 184, 0.6)",
            fontStyle: "italic",
        },
        ".cm-prompt-variable": {
            backgroundColor: "rgba(99, 102, 241, 0.15)",
            color: "#4f46e5",
            fontWeight: "600",
            borderRadius: "4px",
            padding: "1px 4px",
            border: "1px solid rgba(99, 102, 241, 0.3)",
        },
        "&.cm-dark .cm-prompt-variable": {
            backgroundColor: "rgba(99, 102, 241, 0.25)",
            color: "#a5b4fc",
            border: "1px solid rgba(99, 102, 241, 0.45)",
        }
    });

    let isInternalUpdate = false;

    // Sync outward value changes to CodeMirror
    $effect(() => {
        const val = value || "";
        if (view && !isInternalUpdate) {
            const currentDoc = view.state.doc.toString();
            if (val !== currentDoc) {
                view.dispatch({
                    changes: {
                        from: 0,
                        to: currentDoc.length,
                        insert: val,
                    },
                });
            }
        }
    });

    // Theme sync
    $effect(() => {
        const currentTheme = $theme;
        if (view) {
            view.dispatch({
                effects: themeCompartment.reconfigure(currentTheme === "dark" ? oneDark : []),
            });
        }
    });

    onMount(() => {
        if (!editorContainer) return;

        const startState = EditorState.create({
            doc: value || "",
            extensions: [
                basicSetup,
                history(),
                keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
                EditorView.lineWrapping,
                variableHighlightField,
                studioEditorTheme,
                themeCompartment.of($theme === "dark" ? oneDark : []),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        isInternalUpdate = true;
                        const docStr = update.state.doc.toString();
                        value = docStr;
                        if (onChange) onChange(docStr);
                        isInternalUpdate = false;
                    }
                }),
            ],
        });

        view = new EditorView({
            state: startState,
            parent: editorContainer,
        });
    });

    onDestroy(() => {
        if (view) {
            view.destroy();
            view = null;
        }
    });

    // Exported function to insert variable at current cursor
    export function insertAtCursor(textToInsert: string) {
        if (!view) return;
        const state = view.state;
        const range = state.selection.main;
        view.dispatch({
            changes: {
                from: range.from,
                to: range.to,
                insert: textToInsert,
            },
            selection: {
                anchor: range.from + textToInsert.length,
            },
            scrollIntoView: true,
        });
        view.focus();
    }

    export function focus() {
        if (view) view.focus();
    }
</script>

<div
    bind:this={editorContainer}
    class="w-full h-full min-h-[160px] overflow-hidden rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 focus-within:border-indigo-500/80 dark:focus-within:border-indigo-500/80 transition-colors"
></div>

<style>
    :global(.cm-editor) {
        height: 100%;
    }
    :global(.cm-scroller) {
        overflow: auto;
    }
</style>
