import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface VariationCrumb {
  projectId: string;
  name: string;
}

type Setter = (crumb: VariationCrumb | undefined) => void;

const CrumbContext = createContext<VariationCrumb | undefined>(undefined);
const SetCrumbContext = createContext<Setter | undefined>(undefined);

export function CrumbProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [crumb, setCrumb] = useState<VariationCrumb>();

  return (
    <CrumbContext.Provider value={crumb}>
      <SetCrumbContext.Provider value={setCrumb}>
        {children}
      </SetCrumbContext.Provider>
    </CrumbContext.Provider>
  );
}

export function useVariationCrumb() {
  return useContext(CrumbContext);
}

export function useSetVariationCrumb(crumb: VariationCrumb | undefined) {
  const set = useContext(SetCrumbContext);
  const projectId = crumb?.projectId;
  const name = crumb?.name;
  const value = useMemo(
    () => (projectId && name ? { projectId, name } : undefined),
    [projectId, name],
  );

  useEffect(() => {
    set?.(value);
    return () => set?.(undefined);
  }, [set, value]);
}
