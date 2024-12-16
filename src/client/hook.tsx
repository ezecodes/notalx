import React, {
  createContext,
  FC,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type IContext = {};

const GlobalContext = createContext<IContext | null>(null);
const Provider: FC<{ children: ReactNode }> = ({ children }) => {
  const contextValues = {};

  return (
    <GlobalContext.Provider value={contextValues}>
      {children}
    </GlobalContext.Provider>
  );
};
export { GlobalContext, Provider };
