import type { ComponentProps } from "react";
import { IgnoreArea } from "../types/ignoreArea";
import type { DrawArea as RealDrawArea } from "../components/TestDetailsDialog/DrawArea";

// Konva needs the native canvas package, which jsdom lacks; use as vi.mock("./DrawArea", async () => import("../../_test/FakeDrawArea"))
export const DrawArea = ({
  ignoreAreas,
  setIgnoreAreas,
  selectedRectId,
  setSelectedRectId,
  deleteIgnoreArea,
  hintAreas,
}: ComponentProps<typeof RealDrawArea>) =>
  // only the checkpoint pane takes hint areas; the baseline pane is left out
  hintAreas ? (
    <div>
      <span data-testid="ignoreAreaCount">{ignoreAreas.length}</span>
      <span data-testid="hintAreas">{JSON.stringify(hintAreas ?? [])}</span>
      <button
        onClick={() => {
          const area: IgnoreArea = {
            id: `drawn-${ignoreAreas.length}`,
            x: 1,
            y: 2,
            width: 30,
            height: 40,
          };
          setIgnoreAreas([...ignoreAreas, area]);
          setSelectedRectId(area.id);
        }}
      >
        Draw an area
      </button>
      <button
        onClick={() => selectedRectId && deleteIgnoreArea?.(selectedRectId)}
      >
        Delete the selected area
      </button>
    </div>
  ) : null;
