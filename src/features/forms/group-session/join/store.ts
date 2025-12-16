import { create } from "zustand";
import type { SessionJoinSchema } from ".";

const defaultSessionJoinData: SessionJoinSchema = {
  code: "",
};

export const useSessionJoinStore = create<{
  data: SessionJoinSchema;
  setData: (data: Partial<SessionJoinSchema>) => void;
  reset: () => void;
  defaultData: SessionJoinSchema;
}>((set) => ({
  data: defaultSessionJoinData,
  setData: (update) => set((state) => ({ data: { ...state.data, ...update } })),
  reset: () => set({ data: defaultSessionJoinData }),
  defaultData: defaultSessionJoinData,
}));
