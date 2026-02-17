export interface YamlNode {
    [key: string]: any;
}

export type NodePath = string[];

export type EditorEvent =
    | { type: 'add' | 'edit' | 'delete' | 'up' | 'down' | 'duplicate' | 'copyPath'; path: NodePath; payload?: any }
    | { type: 'select'; path: NodePath; payload?: any };
