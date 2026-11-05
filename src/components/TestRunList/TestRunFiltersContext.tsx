import { type ReactNode, createContext, useContext } from "react";
import { useNoiseAnalysisAvailable, useTestRunState } from "../../contexts";
import { useTestRunFilters } from "./useTestRunFilters";

type Filters = ReturnType<typeof useTestRunFilters>;

const TestRunFiltersContext = createContext<Filters | undefined>(undefined);

export const TestRunFiltersProvider = ({
  children,
}: Readonly<{ children: ReactNode }>) => {
  const { testRuns } = useTestRunState();
  const noiseHintAvailable = useNoiseAnalysisAvailable();
  const filters = useTestRunFilters(testRuns, noiseHintAvailable);
  return (
    <TestRunFiltersContext.Provider value={filters}>
      {children}
    </TestRunFiltersContext.Provider>
  );
};

export const useSharedTestRunFilters = (): Filters => {
  const context = useContext(TestRunFiltersContext);
  if (context === undefined) {
    throw Error("must be used within a TestRunFiltersProvider");
  }
  return context;
};
