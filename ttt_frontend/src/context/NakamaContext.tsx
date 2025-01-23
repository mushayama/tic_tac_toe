import { createContext, useContext } from "react";
import { NakamaContextInterface } from "../types/NakamaContextInterface";

export const NakamaContext = createContext<NakamaContextInterface | undefined>(
  undefined
);

export const useNakama = (): NakamaContextInterface => {
  const context = useContext(NakamaContext);
  if (!context) {
    throw new Error("useNakama must be used within a NakamaProvider");
  }
  return context;
};
