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
}: ComponentProps<typeof RealDrawArea>) =>
  // only the image pane edits areas; the baseline pane is left out
  deleteIgnoreArea ? (
    <div>
      <span data-testid="ignoreAreaCount">{ignoreAreas.length}</span>
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
        onClick={() => selectedRectId && deleteIgnoreArea(selectedRectId)}
      >
        Delete the selected area
      </button>
    </div>
  ) : null;
