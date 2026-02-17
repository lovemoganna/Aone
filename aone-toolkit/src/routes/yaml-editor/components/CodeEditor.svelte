<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { EditorView, basicSetup } from "codemirror";
    import { EditorState } from "@codemirror/state";
    import { yaml } from "@codemirror/lang-yaml";
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

    // Effect to update value from outside
    // Explicitly track `value` and update CodeMirror when it differs from doc
    $effect(() => {
        const currentValue = value; // Capture in closure
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
            const theme = isDark ? oneDark : [];
            // Theme switching in CM6 usually requires reconfiguring the extension
            // For simplicity, we might just recreate or use a Compartment (if we want to be fancy)
            // Let's try Compartment later if needed, for now just basic init handles initial state
            // But valid dynamic switching is needed.
            // Let's use dispatch/reconfigure for theme.

            // Actually, simplest is just toggling the theme extension.
            // But extensions are immutable in setup.
            // We need a Compartment.
        }
    });

    // Theme Compartment Logic
    import { Compartment } from "@codemirror/state";
    const themeCompartment = new Compartment();

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
                yaml(),
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
                    "&": { height: "100%" },
                    ".cm-scroller": { overflow: "auto" },
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
    class="h-full w-full text-base"
    class:cm-dark={isDark}
></div>

<style>
    /* Ensure container takes full height */
    :global(.cm-editor) {
        height: 100%;
    }
</style>
