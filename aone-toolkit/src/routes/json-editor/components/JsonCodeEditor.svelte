<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { EditorView, basicSetup } from "codemirror";
    import { EditorState, Compartment } from "@codemirror/state";
    import { json } from "@codemirror/lang-json";
    import { oneDark } from "@codemirror/theme-one-dark";
    import { keymap } from "@codemirror/view";
    import { defaultKeymap } from "@codemirror/commands";
    import { search, searchKeymap } from "@codemirror/search";

    interface Props {
        value: string;
        isDark: boolean;
        onChange?: (newValue: string) => void;
    }

    let { value = $bindable(), isDark, onChange }: Props = $props();

    let editorElement: HTMLElement;
    let view: EditorView;
    const themeCompartment = new Compartment();

    // Effect to update value from outside
    $effect(() => {
        const currentValue = value;
        if (view) {
            const docString = view.state.doc.toString();
            if (currentValue !== docString) {
                view.dispatch({
                    changes: {
                        from: 0,
                        to: view.state.doc.length,
                        insert: currentValue,
                    },
                });
            }
        }
    });

    // Effect to update theme
    $effect(() => {
        if (view) {
            view.dispatch({
                effects: themeCompartment.reconfigure(isDark ? oneDark : []),
            });
        }
    });

    onMount(() => {
        const state = EditorState.create({
            doc: value,
            extensions: [
                basicSetup,
                keymap.of([...defaultKeymap, ...searchKeymap]),
                json(), // Using JSON language
                search(),
                themeCompartment.of(isDark ? oneDark : []),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const newValue = update.state.doc.toString();
                        if (newValue !== value) {
                            value = newValue; // Update bindable
                            onChange?.(newValue);
                        }
                    }
                }),
                EditorView.theme({
                    "&": { height: "100%", fontSize: "12px" },
                    ".cm-scroller": {
                        overflow: "auto",
                        fontFamily: "var(--font-mono, 'JetBrains Mono', 'Noto Sans SC', monospace)",
                        lineHeight: "1.55",
                    },
                    ".cm-gutters": {
                        fontSize: "11px",
                    },
                }),
            ],
        });

        view = new EditorView({
            state,
            parent: editorElement,
        });
    });

    onDestroy(() => {
        view?.destroy();
    });
</script>

<div
    bind:this={editorElement}
    class="h-full w-full font-mono text-xs"
    class:cm-dark={isDark}
></div>

<style>
    /* Ensure container takes full height */
    :global(.cm-editor) {
        height: 100%;
        outline: none;
        font-size: 12px;
    }
</style>
