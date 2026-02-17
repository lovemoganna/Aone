import { StreamLanguage, type StreamParser } from "@codemirror/language";

// Types for Simple Mode
interface Rule {
    regex: RegExp;
    token?: string | null;
    next?: string;
}

interface ModeSpec {
    [state: string]: Rule[];
    meta?: any;
}

// Helper to create a CM6 StreamLanguage from CM5-style simple mode rules
function createSimpleMode(spec: ModeSpec): StreamLanguage<any> {
    const parser: StreamParser<{ state: string; pending: string | null }> = {
        startState() {
            return { state: "start", pending: null };
        },
        token(stream, state) {
            if (state.pending) {
                const style = state.pending;
                state.pending = null;
                return style;
            }

            const rules = spec[state.state];
            if (!rules) {
                stream.next();
                return null;
            }

            for (const rule of rules) {
                const matches = stream.match(rule.regex);
                if (matches) {
                    if (rule.next) {
                        state.state = rule.next;
                    }
                    return rule.token || null;
                }
            }

            stream.next();
            return null;
        }
    };
    return StreamLanguage.define(parser);
}

// PlantUML Syntax
const plantUmlRules: ModeSpec = {
    start: [
        { regex: /'.*/, token: 'comment' },
        { regex: /\/\*/, token: 'comment', next: 'comment' },
        { regex: /@startuml|@enduml|@startmindmap|@endmindmap|@startsalt|@endsalt|@startjson|@endjson|@startyaml|@endyaml/, token: 'meta' },
        { regex: /\b(participant|actor|boundary|control|entity|database|collections|queue|usecase|class|interface|enum|abstract|annotation|package|namespace|node|folder|frame|cloud|rectangle|component|agent|artifact|file|card|stack|storage|label|hexagon|person)\b/, token: 'keyword' },
        { regex: /\b(as|is|of|on|if|then|else|endif|elseif|while|endwhile|repeat|endrepeat|fork|again|end|kill|stop|start|detach|note|end note|rnote|hnote|legend|end legend|title|header|footer|newpage|autonumber|activate|deactivate|destroy|create|box|end box|alt|opt|loop|par|break|critical|group|ref|return|partition|skinparam|hide|show|top|bottom|left|right|up|down|over|of)\b/, token: 'keyword' },
        { regex: /\b(true|false|null)\b/, token: 'atom' },
        { regex: /(?:<\|?|[ox*+#])?(?:-+(?:>|\|>)?|-+(?:\[#\w+\])?-+(?:>|\|>)?|\.+(?:>|\|>)?|={2,}(?:>|\|>)?)/, token: 'string-2' }, // 'builtin' -> 'string-2' (Arrow)
        { regex: /"(?:[^"\\]|\\.)*"/, token: 'string' },
        { regex: /:.*?[;|<>/\]}]/, token: 'string' },
        { regex: /\b[A-Z][a-zA-Z0-9_]*\b/, token: 'type' },
        { regex: /[{}\[\]()]/, token: 'operator' }, // 'bracket' -> 'operator' (Pink)
        { regex: /[+\-#~]/, token: 'operator' },
    ],
    comment: [
        { regex: /.*?\*\//, token: 'comment', next: 'start' },
        { regex: /.*/, token: 'comment' }
    ]
};

// Graphviz (DOT) Syntax
const dotRules: ModeSpec = {
    start: [
        { regex: /\/\/.*/, token: 'comment' },
        { regex: /#.*/, token: 'comment' },
        { regex: /\/\*/, token: 'comment', next: 'comment' },
        { regex: /\b(strict|graph|digraph|subgraph|node|edge)\b/i, token: 'keyword' },
        { regex: /\b(label|color|fillcolor|fontcolor|fontname|fontsize|shape|style|width|height|size|rankdir|rank|splines|overlap|compound|bgcolor|margin|arrowhead|arrowtail|dir|penwidth)\b/i, token: 'attribute' },
        { regex: /\b(box|polygon|ellipse|oval|circle|point|diamond|rect|rectangle|square|cylinder|note|folder|box3d|component|record)\b/i, token: 'atom' },
        { regex: /->|--/, token: 'string-2' }, // 'builtin' -> 'string-2'
        { regex: /"(?:[^"\\]|\\.)*"/, token: 'string' },
        { regex: /<[^>]*>/, token: 'string' },
        { regex: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/, token: 'variable' },
        { regex: /[{}\[\]();,]/, token: 'operator' },
        { regex: /=/, token: 'operator' },
    ],
    comment: [
        { regex: /.*?\*\//, token: 'comment', next: 'start' },
        { regex: /.*/, token: 'comment' }
    ]
};

export const plantUmlLanguage = createSimpleMode(plantUmlRules);
export const dotLanguage = createSimpleMode(dotRules);
