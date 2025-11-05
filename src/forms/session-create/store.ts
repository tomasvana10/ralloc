import { create } from "zustand";
import type { SessionCreateSchemaType } from ".";

export const defaultSessionCreateData: SessionCreateSchemaType = {
  groupSeed: "",
  groupSize: 2,
  name: "",
  description: "",
  locked: false,
};

export const useSessionCreateStore = create<{
  data: SessionCreateSchemaType;
  setData: (data: Partial<SessionCreateSchemaType>) => void;
  reset: () => void;
  defaultData: SessionCreateSchemaType;
}>(set => ({
  data: defaultSessionCreateData,
  setData: update => set(state => ({ data: { ...state.data, ...update } })),
  reset: () => set({ data: defaultSessionCreateData }),
  defaultData: defaultSessionCreateData,
}));
