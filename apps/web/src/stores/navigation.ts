'use client';

import { create } from 'zustand';

interface NavigationStore {
  pendingTaskId: string | null;
  setPendingTaskId: (taskId: string | null) => void;
  clearPendingTaskId: () => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  pendingTaskId: null,
  setPendingTaskId: (taskId) => set({ pendingTaskId: taskId }),
  clearPendingTaskId: () => set({ pendingTaskId: null }),
}));
