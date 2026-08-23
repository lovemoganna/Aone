import { writable, get } from 'svelte/store';

export interface HistoryCommand {
  execute: () => void;
  undo: () => void;
}

export interface HistoryState {
  past: HistoryCommand[];
  future: HistoryCommand[];
}

// 最大历史记录数量（扩展到50步）
const MAX_HISTORY_SIZE = 50;

function createHistoryStore() {
  const { subscribe, update, set } = writable<HistoryState>({
    past: [],
    future: []
  });

  return {
    subscribe,

    // 获取当前可撤销步数
    getUndoCount: () => {
      return get({ subscribe }).past.length;
    },

    // 获取当前可重做步数
    getRedoCount: () => {
      return get({ subscribe }).future.length;
    },

    // Add a new command to history
    push: (command: HistoryCommand) => {
      update(state => {
        let newPast = [...state.past, command];
        
        // 超过最大数量时，移除最旧的记录
        if (newPast.length > MAX_HISTORY_SIZE) {
          newPast = newPast.slice(-MAX_HISTORY_SIZE);
        }
        
        return {
          past: newPast,
          future: [] // Clear redo stack on new action
        };
      });
    },

    // Undo the last action
    undo: () => {
      update(state => {
        if (state.past.length === 0) return state;

        const newPast = [...state.past];
        const command = newPast.pop()!;

        command.undo();

        return {
          past: newPast,
          future: [command, ...state.future]
        };
      });
    },

    // Redo the last undone action
    redo: () => {
      update(state => {
        if (state.future.length === 0) return state;

        const newFuture = [...state.future];
        const command = newFuture.shift()!;

        command.execute();

        return {
          past: [...state.past, command],
          future: newFuture
        };
      });
    },

    // 批量撤销（支持多次撤销）
    undoSteps: (steps: number) => {
      update(state => {
        if (state.past.length === 0) return state;
        
        let newPast = [...state.past];
        const undoneCommands: HistoryCommand[] = [];
        
        for (let i = 0; i < steps && newPast.length > 0; i++) {
          const command = newPast.pop()!;
          command.undo();
          undoneCommands.unshift(command); // 反向添加，保持顺序
        }

        return {
          past: newPast,
          future: [...undoneCommands, ...state.future]
        };
      });
    },

    // 批量重做
    redoSteps: (steps: number) => {
      update(state => {
        if (state.future.length === 0) return state;
        
        let newFuture = [...state.future];
        const redoneCommands: HistoryCommand[] = [];
        
        for (let i = 0; i < steps && newFuture.length > 0; i++) {
          const command = newFuture.shift()!;
          command.execute();
          redoneCommands.push(command);
        }

        return {
          past: [...state.past, ...redoneCommands],
          future: newFuture
        };
      });
    },

    // Clear history
    clear: () => {
      set({ past: [], future: [] });
    }
  };
}

import { toastStore } from './toastStore';

export const historyStore = createHistoryStore();

// Wrap with toast
const originalUndo = historyStore.undo;
historyStore.undo = () => {
  originalUndo();
  toastStore.add('Undo', 'info', 1000);
};

const originalRedo = historyStore.redo;
historyStore.redo = () => {
  originalRedo();
  toastStore.add('Redo', 'info', 1000);
};
