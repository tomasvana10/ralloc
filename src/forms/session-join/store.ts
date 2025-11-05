import { create } from "zustand";
import type { SessionJoinSchemaType } from ".";

const defaultSessionJoinData: SessionJoinSchemaType = {
  code: "",
};

export const useSessionJoinStore = create<{
  data: SessionJoinSchemaType;
  setData: (data: Partial<SessionJoinSchemaType>) => void;
  reset: () => void;
  defaultData: SessionJoinSchemaType;
}>(set => ({
  data: defaultSessionJoinData,
  setData: update => set(state => ({ data: { ...state.data, ...update } })),
  reset: () => set({ data: defaultSessionJoinData }),
  defaultData: defaultSessionJoinData,
}));
