import { createContext, useContext } from 'react';

export type InkNodeStatus = 'ok' | 'warning' | 'error';

export const InkStatusContext = createContext<Record<string, InkNodeStatus>>({});

export const useInkStatus = (): Record<string, InkNodeStatus> => useContext(InkStatusContext);
