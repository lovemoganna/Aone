<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { EditorState, Compartment } from "@codemirror/state";
    import {
        EditorView,
        keymap,
        lineNumbers,
        highlightActiveLineGutter,
        highlightSpecialChars,
        drawSelection,
        dropCursor,
        rectangularSelection,
        crosshairCursor,
        highlightActiveLine,
        Decoration,
        type DecorationSet,
        WidgetType,
    } from "@codemirror/view";
    import {
        defaultKeymap,
        history,
        historyKeymap,
    } from "@codemirror/commands";
    import {
        bracketMatching,
        foldGutter,
        foldKeymap,
        indentOnInput,
        syntaxHighlighting,
        HighlightStyle,
    } from "@codemirror/language";
    import { GhostWidget } from "./GhostWidget";
    import { tags } from "@lezer/highlight";
    import {
        searchKeymap,
        highlightSelectionMatches,
    } from "@codemirror/search";
    import {
        closeBrackets,
        closeBracketsKeymap,
        autocompletion,
    } from "@codemirror/autocomplete";
    import { diagramCompletion } from "../lib/completion";
    import {
        lintKeymap,
        linter,
        lintGutter,
        type Diagnostic,
    } from "@codemirror/lint";
    // import { java } from "@codemirror/lang-java"; // Removed
    // import { cpp } from "@codemirror/lang-cpp";   // Removed
    import { plantUmlLanguage, dotLanguage } from "../lib/syntax";
    import { StateField, StateEffect } from "@codemirror/state";
    import { intelligenceService } from "../lib/intelligence.svelte";
    import { yCollab } from "y-codemirror.next";
    import { collabService } from "../lib/collaboration";
    import { lintingService } from "../lib/lintingService.svelte";
    import { formatDiagramCode } from "../lib/formatter";
    import {
        detectArrows,
        replaceAllArrows,
        type ArrowMatch,
        type Direction,
    } from "../lib/arrows";
    import EditorToolbar from "./EditorToolbar.svelte";

    import { diagramStore } from "../lib/store.svelte";

    let {
        code = $bindable(""),
        mode = "plantuml",
        onRender,
        onCursorChange,
    } = $props<{
        code: string;
        mode?: string;
        onRender: () => void;
        onCursorChange?: (line: number, col: number) => void;
    }>();

    let editorContainer: HTMLElement;
    let editorView: EditorView;
    const languageConf = new Compartment();
    const themeConf = new Compartment();
    const completionConf = new Compartment();

    // Context menu state
    // Toolbar state
    let activeArrows = $state<ArrowMatch[]>([]);
    let activeDirection = $state<Direction | null>(null);

    // Ghost Suggestion CM logic
    const setGhostSuggestion = StateEffect.define<string | null>();
    const ghostField = StateField.define<DecorationSet>({
        create() {
            return Decoration.none;
        },
        update(ghosts, tr) {
            ghosts = ghosts.map(tr.changes);
            for (let e of tr.effects) {
                if (e.is(setGhostSuggestion)) {
                    if (e.value) {
                        const deco = Decoration.widget({
                            widget: new GhostWidget(e.value!),
                            side: 1,
                        });
                        ghosts = Decoration.set([
                            deco.range(tr.state.selection.main.head),
                        ]);
                    } else {
                        ghosts = Decoration.none;
                    }
                }
            }
            return ghosts;
        },
        provide: (f) => EditorView.decorations.from(f),
    });

    // ... imports ...

    const collabConf = new Compartment();

    $effect(() => {
        if (!editorView) return;

        const isCollab = diagramStore.isCollaborating;
        const extension = isCollab
            ? yCollab(
                  collabService.doc.getText("code"),
                  collabService.awareness,
              )
            : [];

        editorView.dispatch({
            effects: collabConf.reconfigure(extension),
        });
    });

    onMount(() => {
        const diagramHighlightStyle = HighlightStyle.define([
            {
                tag: tags.keyword,
                color: "var(--cm-keyword)",
                fontWeight: "bold",
            },
            {
                tag: tags.meta,
                color: "var(--cm-directive)",
                fontWeight: "bold",
            },
            { tag: tags.special(tags.string), color: "var(--cm-arrow)" },
            { tag: tags.typeName, color: "var(--cm-participant)" },
            { tag: tags.string, color: "var(--cm-string)" },
            {
                tag: tags.comment,
                color: "var(--cm-comment)",
                fontStyle: "italic",
            },
            { tag: tags.attributeName, color: "var(--cm-attribute)" },
            { tag: tags.variableName, color: "var(--cm-node)" },
            { tag: tags.operator, color: "var(--cm-operator)" },
            { tag: tags.atom, color: "var(--cm-atom)" },
            {
                tag: [tags.bracket, tags.punctuation],
                color: "var(--cm-bracket)",
            },
        ]);

        const syntaxTheme = syntaxHighlighting(diagramHighlightStyle);

        const startState = EditorState.create({
            doc: code,
            extensions: [
                // ...
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightSpecialChars(),
                history(),
                foldGutter(),
                drawSelection(),
                dropCursor(),
                EditorState.allowMultipleSelections.of(true),
                indentOnInput(),
                bracketMatching(),
                closeBrackets(),
                rectangularSelection(),
                crosshairCursor(),
                highlightActiveLine(),
                highlightSelectionMatches(),
                lintGutter(),
                linter((view) => {
                    const diagnostics: Diagnostic[] = [];
                    const currentCode = view.state.doc.toString();

                    // 1. Reactive Linting via Guardian Service
                    const results = lintingService.lint(
                        currentCode,
                        mode as "plantuml" | "graphviz",
                    );

                    results.forEach((r) => {
                        const totalLines = view.state.doc.lines;
                        const lineNo = Math.min(
                            Math.max(1, r.line),
                            totalLines,
                        );
                        const line = view.state.doc.line(lineNo);

                        diagnostics.push({
                            from: line.from,
                            to: line.to,
                            severity: r.severity as
                                | "error"
                                | "warning"
                                | "info",
                            message: r.message,
                            actions: r.actions?.map((a: any) => ({
                                name: a.label,
                                apply: (view: EditorView) => {
                                    const code = view.state.doc.toString();
                                    const newCode = a.apply(code);
                                    view.dispatch({
                                        changes: {
                                            from: 0,
                                            to: code.length,
                                            insert: newCode,
                                        },
                                    });
                                },
                            })),
                        });
                    });

                    // 2. Render Error Fallback
                    if (diagramStore.error && diagnostics.length === 0) {
                        const lineMatch =
                            diagramStore.error.match(/line (\d+)/i) ||
                            diagramStore.error.match(/:(\d+):/);
                        const lineNo = lineMatch ? parseInt(lineMatch[1]) : 1;
                        const line = view.state.doc.line(
                            Math.min(lineNo, view.state.doc.lines),
                        );

                        diagnostics.push({
                            from: line.from,
                            to: line.to,
                            severity: "error",
                            message: diagramStore.error,
                        });
                    }
                    return diagnostics;
                }),
                languageConf.of(
                    mode === "plantuml" ? plantUmlLanguage : dotLanguage,
                ),
                completionConf.of(
                    autocompletion({
                        override: [diagramCompletion(mode as any)],
                    }),
                ),
                themeConf.of(
                    EditorView.theme({
                        "&": {
                            height: "100%",
                            fontSize: `${diagramStore.fontSize}px`,
                            fontFamily: diagramStore.fontFamily,
                        },
                        ".cm-scroller": { overflow: "auto" },
                    }),
                ),
                syntaxTheme,
                collabConf.of([]),
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...searchKeymap,
                    ...historyKeymap,
                    ...foldKeymap,
                    ...lintKeymap,
                    {
                        key: "Mod-Enter",
                        run: () => {
                            onRender();
                            return true;
                        },
                    },
                    {
                        key: "Shift-Alt-f",
                        run: () => {
                            const currentCode = editorView.state.doc.toString();
                            const formatted = formatDiagramCode(
                                currentCode,
                                diagramStore.mode as any,
                            );
                            editorView.dispatch({
                                changes: {
                                    from: 0,
                                    to: currentCode.length,
                                    insert: formatted,
                                },
                            });
                            return true;
                        },
                    },
                    {
                        key: "Tab",
                        run: () => {
                            if (intelligenceService.currentSuggestion) {
                                const text =
                                    intelligenceService.currentSuggestion.text;
                                editorView.dispatch({
                                    changes: {
                                        from: editorView.state.selection.main
                                            .head,
                                        insert: text,
                                    },
                                    selection: {
                                        anchor:
                                            editorView.state.selection.main
                                                .head + text.length,
                                    },
                                    effects: setGhostSuggestion.of(null),
                                });
                                intelligenceService.clear();
                                return true;
                            }
                            return false;
                        },
                    },
                ]),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        code = update.state.doc.toString();
                    }
                    if (update.selectionSet || update.docChanged) {
                        const state = update.state;
                        const range = state.selection.main;
                        const line = state.doc.lineAt(range.head);
                        onCursorChange?.(
                            line.number,
                            range.head - line.from + 1,
                        );

                        // Check for arrows in current line
                        const arrows = detectArrows(
                            line.text,
                            diagramStore.mode as "plantuml" | "graphviz",
                        );

                        // Adjust arrow positions to document coordinates
                        activeArrows = arrows.map((a) => ({
                            ...a,
                            start: a.start + line.from,
                            end: a.end + line.from,
                        }));

                        activeDirection =
                            activeArrows.length > 0
                                ? activeArrows[0].direction
                                : null;

                        // Fetch ghost suggestion
                        intelligenceService
                            .getGhostSuggestion(
                                state.doc.toString(),
                                line.number,
                                range.head - line.from + 1,
                            )
                            .then((suggestion) => {
                                if (editorView) {
                                    editorView.dispatch({
                                        effects: setGhostSuggestion.of(
                                            suggestion?.text || null,
                                        ),
                                    });
                                }
                            });
                    }
                }),
                ghostField,
            ],
        });

        editorView = new EditorView({
            state: startState,
            parent: editorContainer,
        });
    });

    onDestroy(() => {
        if (editorView) editorView.destroy();
    });

    $effect(() => {
        if (editorView && code !== editorView.state.doc.toString()) {
            editorView.dispatch({
                changes: {
                    from: 0,
                    to: editorView.state.doc.length,
                    insert: code,
                },
            });
        }
    });

    // Language Sync
    $effect(() => {
        if (editorView) {
            editorView.dispatch({
                effects: [
                    languageConf.reconfigure(
                        mode === "plantuml" ? plantUmlLanguage : dotLanguage,
                    ),
                    completionConf.reconfigure(
                        autocompletion({
                            override: [diagramCompletion(mode as any)],
                        }),
                    ),
                ],
            });
        }
    });

    // Settings Sync
    $effect(() => {
        if (editorView) {
            editorView.dispatch({
                effects: themeConf.reconfigure(
                    EditorView.theme({
                        "&": {
                            height: "100%",
                            fontSize: `${diagramStore.fontSize}px`,
                            fontFamily: diagramStore.fontFamily,
                        },
                        ".cm-scroller": { overflow: "auto" },
                    }),
                ),
            });
        }
    });

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        const code = event.dataTransfer?.getData("text/plain");
        if (code && editorView) {
            const pos = editorView.posAtCoords({
                x: event.clientX,
                y: event.clientY,
            });
            if (pos) {
                editorView.dispatch({
                    changes: { from: pos, insert: code },
                    selection: { anchor: pos + code.length },
                });
                editorView.focus();
            }
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "copy";
        }
    }

    function handleDirectionChange(direction: Direction) {
        if (!editorView || activeArrows.length === 0) return;

        const doc = editorView.state.doc.toString();
        const newDoc = replaceAllArrows(doc, activeArrows, direction);

        editorView.dispatch({
            changes: { from: 0, to: doc.length, insert: newDoc },
        });

        code = newDoc;
        activeDirection = direction;

        code = newDoc;
        activeDirection = direction;

        // Auto-render after direction change
        onRender();
    }

    export function scrollToLine(line: number) {
        if (!editorView) return;

        // Ensure line is valid (parser returns 0-indexed, CM uses 1-indexed)
        const totalLines = editorView.state.doc.lines;
        const targetLine = Math.min(Math.max(1, line + 1), totalLines);

        const docLine = editorView.state.doc.line(targetLine);

        editorView.dispatch({
            selection: { anchor: docLine.from },
            effects: [
                EditorView.scrollIntoView(docLine.from, {
                    y: "center",
                }),
            ],
        });
        editorView.focus();
    }
</script>

<div
    class="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 spatial-tilt"
>
    <EditorToolbar
        mode={diagramStore.mode}
        {activeDirection}
        onDirectionChange={handleDirectionChange}
        hasArrows={activeArrows.length > 0}
    />

    <div
        class="flex-1 w-full overflow-hidden outline-none"
        bind:this={editorContainer}
        ondrop={handleDrop}
        ondragover={handleDragOver}
        role="textbox"
        tabindex="0"
    ></div>
</div>

<style>
    :global(:root) {
        --cm-keyword: #d63384;
        --cm-directive: #6f42c1;
        --cm-arrow: #198754;
        --cm-participant: #0d6efd;
        --cm-string: #fd7e14;
        --cm-comment: #6c757d;
        --cm-attribute: #dc3545;
        --cm-node: #0d6efd;
        --cm-operator: #d63384;
        --cm-atom: #0d6efd;
        --cm-bracket: #1e293b;
    }
    :global(.dark) {
        --cm-keyword: #ff79c6;
        --cm-directive: #bd93f9;
        --cm-arrow: #50fa7b;
        --cm-participant: #8be9fd;
        --cm-string: #f1fa8c;
        --cm-comment: #6272a4;
        --cm-attribute: #ffb86c;
        --cm-node: #8be9fd;
        --cm-operator: #ff79c6;
        --cm-atom: #8be9fd;
        --cm-bracket: #f8fafc;
    }
    :global(.cm-ghost-suggestion) {
        @apply text-gray-400/50 dark:text-gray-500/50 italic pointer-events-none;
    }
</style>
