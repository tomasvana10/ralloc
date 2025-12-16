import { create } from "zustand";
import type { SessionCreateSchema } from ".";

export const defaultSessionCreateData: SessionCreateSchema = {
  groupSeed: "",
  groupSize: 2,
  name: "",
  description: "",
  frozen: false,
};

export const useSessionCreateStore = create<{
  data: SessionCreateSchema;
  setData: (data: Partial<SessionCreateSchema>) => void;
  reset: () => void;
  defaultData: SessionCreateSchema;
}>((set) => ({
  data: defaultSessionCreateData,
  setData: (update) => set((state) => ({ data: { ...state.data, ...update } })),
  reset: () => set({ data: defaultSessionCreateData }),
  defaultData: defaultSessionCreateData,
}));
