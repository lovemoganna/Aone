import { WidgetType } from "@codemirror/view";

export class GhostWidget extends WidgetType {
    constructor(readonly text: string) {
        super();
    }

    eq(other: WidgetType) {
        return (other as any).text === this.text;
    }

    toDOM() {
        let span = document.createElement("span");
        span.className = "cm-ghost-suggestion";
        span.textContent = this.text;
        return span;
    }
}
