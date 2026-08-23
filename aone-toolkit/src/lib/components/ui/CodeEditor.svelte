<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { theme } from "$lib/stores";
    import { EditorView, basicSetup } from "codemirror";
    import { EditorState, Compartment, StateField, StateEffect, RangeSet } from "@codemirror/state";
    import { oneDark } from "@codemirror/theme-one-dark";
    import { keymap, Decoration } from "@codemirror/view";
    import { defaultKeymap } from "@codemirror/commands";
    import { search, searchKeymap } from "@codemirror/search";

    interface Props {
        value: string;
        language?: string; // 'json' | 'yaml' | 'html' | 'css' | 'sql' | 'javascript' | 'typescript' | 'cpp' | 'java' | 'text'
        readOnly?: boolean;
        placeholder?: string;
        errorLine?: number | null;
        onChange?: (newValue: string) => void;
    }

    let {
        value = $bindable(),
        language = "text",
        readOnly = false,
        placeholder = "",
        errorLine = null,
        onChange
    }: Props = $props();

    let editorElement = $state<HTMLElement | null>(null);
    let view: EditorView | null = null;

    const themeCompartment = new Compartment();
    const languageCompartment = new Compartment();
    const readOnlyCompartment = new Compartment();
    const setErrorLine = StateEffect.define<number | null>();

    const errorLineField = StateField.define({
        create() { return Decoration.none; },
        update(under, tr) {
            under = under.map(tr.changes);
            for (let e of tr.effects) {
                if (e.is(setErrorLine)) {
                    const lineNum = e.value;
                    if (lineNum !== null && lineNum > 0 && lineNum <= tr.state.doc.lines) {
                        const line = tr.state.doc.line(lineNum);
                        const deco = Decoration.line({ class: "cm-errorLine" });
                        under = RangeSet.of([deco.range(line.from)]);
                    } else {
                        under = Decoration.none;
                    }
                }
            }
            return under;
        },
        provide: f => EditorView.decorations.from(f)
    });

    // Track state to avoid double updates
    let isInternalUpdate = false;

    // Effect to update value from outside
    $effect(() => {
        const currentValue = value;
        if (view && !isInternalUpdate) {
            const docString = view.state.doc.toString();
            if (currentValue !== docString) {
                view.dispatch({
                    changes: {
                        from: 0,
                        to: view.state.doc.length,
                        insert: currentValue || "",
                    },
                });
            }
        }
    });

    // Effect to update theme dynamically when store changes
    $effect(() => {
        const currentTheme = $theme; // Auto-subscribes in Svelte 5
        if (view) {
            view.dispatch({
                effects: themeCompartment.reconfigure(currentTheme === "dark" ? oneDark : []),
            });
        }
    });

    // Effect to update read-only state dynamically
    $effect(() => {
        const isReadOnly = readOnly;
        if (view) {
            view.dispatch({
                effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(isReadOnly)),
            });
        }
    });

    // Effect to update error line dynamically
    $effect(() => {
        const errLine = errorLine;
        if (view) {
            if (errLine !== null && errLine > 0 && errLine <= view.state.doc.lines) {
                view.dispatch({
                    effects: setErrorLine.of(errLine),
                    scrollIntoView: true,
                });
            } else {
                view.dispatch({
                    effects: setErrorLine.of(null),
                });
            }
        }
    });

    // Module-level cache for CodeMirror language extensions to prevent repeated dynamic imports
    const langExtCache = new Map<string, any>();

    // Function to dynamically load CodeMirror language extensions
    async function loadLanguageExtension(lang: string) {
        const key = lang.toLowerCase();
        if (langExtCache.has(key)) {
            return langExtCache.get(key);
        }
        try {
            let ext: any = [];
            switch (key) {
                case "json": {
                    const { json } = await import("@codemirror/lang-json");
                    ext = json();
                    break;
                }
                case "yaml": {
                    const { yaml } = await import("@codemirror/lang-yaml");
                    ext = yaml();
                    break;
                }
                case "html": {
                    const { html } = await import("@codemirror/lang-html");
                    ext = html();
                    break;
                }
                case "css": {
                    const { css } = await import("@codemirror/lang-css");
                    ext = css();
                    break;
                }
                case "sql": {
                    const { sql } = await import("@codemirror/lang-sql");
                    ext = sql();
                    break;
                }
                case "javascript":
                case "js": {
                    const { javascript } = await import("@codemirror/lang-javascript");
                    ext = javascript();
                    break;
                }
                case "typescript":
                case "ts": {
                    const { javascript } = await import("@codemirror/lang-javascript");
                    ext = javascript({ typescript: true });
                    break;
                }
                case "cpp":
                case "c++": {
                    const { cpp } = await import("@codemirror/lang-cpp");
                    ext = cpp();
                    break;
                }
                case "java": {
                    const { java } = await import("@codemirror/lang-java");
                    ext = java();
                    break;
                }
                case "python":
                case "py": {
                    const { python } = await import("@codemirror/lang-python");
                    ext = python();
                    break;
                }
                default:
                    ext = [];
            }
            langExtCache.set(key, ext);
            return ext;
        } catch (e) {
            console.error(`Failed to load CodeMirror language extension for ${lang}:`, e);
            return [];
        }
    }

    let previousLang: string | null = null;

    // Effect to handle language switching dynamically
    $effect(() => {
        const currentLang = language;
        if (view && currentLang !== previousLang) {
            previousLang = currentLang;
            loadLanguageExtension(currentLang).then((ext) => {
                if (view) {
                    view.dispatch({
                        effects: languageCompartment.reconfigure(ext),
                    });
                }
            });
        }
    });

    onMount(async () => {
        if (!editorElement) return;

        previousLang = language;
        const initialLangExt = await loadLanguageExtension(language);
        const currentTheme = $theme;

        const state = EditorState.create({
            doc: value || "",
            extensions: [
                basicSetup,
                keymap.of([...defaultKeymap, ...searchKeymap]),
                search(),
                languageCompartment.of(initialLangExt),
                themeCompartment.of(currentTheme === "dark" ? oneDark : []),
                readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
                errorLineField,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const newValue = update.state.doc.toString();
                        if (newValue !== value) {
                            isInternalUpdate = true;
                            value = newValue;
                            onChange?.(newValue);
                            isInternalUpdate = false;
                        }
                    }
                }),
                EditorView.theme({
                    "&": { 
                        height: "100%",
                        fontSize: "14px",
                        fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace"
                    },
                    ".cm-scroller": { overflow: "auto" },
                    ".cm-content": { padding: "10px 0" },
                    "&.cm-focused": { outline: "none" },
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
    class="h-full w-full bg-white dark:bg-[#0A0A0A] overflow-hidden"
    class:cm-dark={$theme === "dark"}
></div>

<style>
    /* Custom styling for matching design tokens */
    :global(.cm-editor) {
        height: 100%;
        max-width: 100%;
        background-color: transparent !important;
    }
    :global(.cm-gutters) {
        background-color: rgba(248, 250, 252, 0.5) !important;
        border-right: 1px solid rgba(226, 232, 240, 0.8) !important;
        color: #94a3b8 !important;
    }
    :global(.dark .cm-gutters) {
        background-color: rgba(15, 23, 42, 0.3) !important;
        border-right: 1px solid rgba(51, 65, 85, 0.5) !important;
        color: #64748b !important;
    }
    :global(.cm-activeLineGutter) {
        background-color: rgba(239, 246, 255, 0.8) !important;
        color: #3b82f6 !important;
    }
    :global(.dark .cm-activeLineGutter) {
        background-color: rgba(30, 41, 59, 0.5) !important;
        color: #60a5fa !important;
    }
    :global(.cm-activeLine) {
        background-color: rgba(248, 250, 252, 0.4) !important;
    }
    :global(.dark .cm-activeLine) {
        background-color: rgba(30, 41, 59, 0.2) !important;
    }
    :global(.cm-errorLine) {
        background-color: rgba(239, 68, 68, 0.12) !important;
        border-left: 3px solid #ef4444 !important;
    }
</style>
