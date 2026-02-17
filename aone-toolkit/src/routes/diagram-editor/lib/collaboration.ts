import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { diagramStore } from './store.svelte';

export class CollaborationService {
    public doc: Y.Doc;
    private provider: WebrtcProvider | null = null;
    public awareness: any = null;

    constructor() {
        this.doc = new Y.Doc();

        // Sync Yjs text with store code
        const yText = this.doc.getText('code');

        yText.observe(event => {
            // Update store when remote changes arrive
            const newCode = yText.toString();
            if (newCode !== diagramStore.code) {
                diagramStore.applyRemoteUpdate(newCode);
            }
        });
    }

    async host() {
        // For P2P, host/join are effectively the same discovery-wise
        // but we'll generate a fresh room ID
        const roomId = `aone-poly-${Math.random().toString(36).substring(7)}`;
        this.connect(roomId);
        return roomId;
    }

    async join(roomId: string) {
        this.connect(roomId);
    }

    private connect(roomId: string) {
        if (this.provider) this.provider.destroy();

        // Initialize WebRTC provider
        // Using public signaling server as default
        this.provider = new WebrtcProvider(roomId, this.doc, {
            signaling: ['wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com']
        });

        this.awareness = this.provider.awareness;

        // Set local awareness state
        this.awareness.setLocalStateField('user', {
            name: `User ${Math.floor(Math.random() * 1000)}`,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16)
        });

        // Track remote users
        this.awareness.on('change', () => {
            const states = Array.from(this.awareness.getStates().values());
            diagramStore.collaborators = states
                .map((s: any) => s.user)
                .filter(u => !!u);
        });

        console.log(`Collaborating on room: ${roomId}`);
    }

    updateCode(newCode: string) {
        const yText = this.doc.getText('code');
        if (yText.toString() !== newCode) {
            this.doc.transact(() => {
                yText.delete(0, yText.length);
                yText.insert(0, newCode);
            });
        }
    }

    destroy() {
        if (this.provider) {
            this.provider.destroy();
            this.provider = null;
        }
    }
}

export const collabService = new CollaborationService();
