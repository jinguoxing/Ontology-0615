import {create} from 'zustand';

/**
 * UI store — the "Zustand" layer of the three-tier state model.
 *
 * Holds client-side UI state that is consumed across many components
 * (navigation, selection, edit-lock, global search, drawer visibility),
 * eliminating prop drilling from App down into each page component.
 *
 * NOTE: Server/domain data (objectTypes, changeSets, ...) is intentionally
 * NOT here — that moves to React Query in a later phase.
 */

export type ViewId = string;

interface UiState {
  /** Currently active navigation view id, e.g. 'knowledge_network'. */
  activeView: ViewId;
  /** Selected Object Type id for ObjectModel / CapabilityBinding views. */
  selectedObjectId: string;
  /**
   * Palantir-style transaction edit lock. true = model locked (publishing),
   * false = editing sandbox open. Toggled by changeset create/submit flows.
   */
  isLocked: boolean;
  /** Global semantic search query + dropdown visibility. */
  globalSearch: string;
  showSearchResults: boolean;
  /** Create-changeset drawer visibility. */
  isCreateDrawerOpen: boolean;

  // Actions
  /** Navigate to a view, optionally preselecting a target object. */
  navigate: (view: ViewId, targetId?: string) => void;
  setActiveView: (view: ViewId) => void;
  setSelectedObjectId: (id: string) => void;
  setLocked: (locked: boolean) => void;
  setGlobalSearch: (query: string) => void;
  setShowSearchResults: (show: boolean) => void;
  setCreateDrawerOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'knowledge_network',
  selectedObjectId: 'Field',
  isLocked: true, // initially locked to simulate transaction edit locking
  globalSearch: '',
  showSearchResults: false,
  isCreateDrawerOpen: false,

  navigate: (view, targetId) =>
    set((s) => ({
      activeView: view,
      ...(targetId ? {selectedObjectId: targetId} : {}),
    })),
  setActiveView: (view) => set({activeView: view}),
  setSelectedObjectId: (id) => set({selectedObjectId: id}),
  setLocked: (locked) => set({isLocked: locked}),
  setGlobalSearch: (query) => set({globalSearch: query}),
  setShowSearchResults: (show) => set({showSearchResults: show}),
  setCreateDrawerOpen: (open) => set({isCreateDrawerOpen: open}),
}));
