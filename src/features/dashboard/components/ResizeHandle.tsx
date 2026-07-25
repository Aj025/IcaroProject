import { useCallback, useEffect, useRef, useState } from 'react';
import { CornerDownRight } from 'lucide-react';
import {
  COL_STEP,
  GRID_COLUMN_COUNT,
  GRID_ROW_HEIGHT_PX,
  MAX_COL_SPAN,
  MAX_ROW_SPAN,
  MIN_COL_SPAN,
  MIN_ROW_SPAN,
  ROW_STEP,
  type WidgetSpan,
} from '../data/widgetCatalog';

interface ResizeHandleProps {
  widgetId: string;
  current: WidgetSpan;
  onResize: (next: WidgetSpan) => void;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
}

interface DragState {
  startClientX: number;
  startClientY: number;
  startColSpan: number;
  startRowSpan: number;
  colWidth: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function snapStep(deltaUnits: number, step: number): number {
  return Math.round(deltaUnits / step) * step;
}

export function ResizeHandle({
  current,
  onResize,
  gridContainerRef,
}: ResizeHandleProps) {
  const dragRef = useRef<DragState | null>(null);
  const [active, setActive] = useState(false);
  const [preview, setPreview] = useState<WidgetSpan | null>(null);

  const onMove = useCallback(
    (e: MouseEvent) => {
      const drag = dragRef.current;
      const container = gridContainerRef.current;
      if (!drag || !container) return;

      const deltaX = e.clientX - drag.startClientX;
      const deltaY = e.clientY - drag.startClientY;

      if (drag.colWidth <= 0) return;

      const colDelta = snapStep(deltaX / drag.colWidth, COL_STEP);
      const rowDelta = snapStep(deltaY / GRID_ROW_HEIGHT_PX, ROW_STEP);

      const nextColSpan = Math.round(
        clamp(drag.startColSpan + colDelta, MIN_COL_SPAN, MAX_COL_SPAN),
      );
      const nextRowSpan = Math.round(
        clamp(drag.startRowSpan + rowDelta, MIN_ROW_SPAN, MAX_ROW_SPAN),
      );

      if (nextColSpan !== current.colSpan || nextRowSpan !== current.rowSpan) {
        onResize({ colSpan: nextColSpan, rowSpan: nextRowSpan });
      }
      setPreview({ colSpan: nextColSpan, rowSpan: nextRowSpan });
    },
    [current.colSpan, current.rowSpan, gridContainerRef, onResize],
  );

  const onUp = useCallback(() => {
    dragRef.current = null;
    setActive(false);
    setPreview(null);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }, [onMove]);

  useEffect(() => {
    if (!active) return;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onMove, onUp, active]);

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const container = gridContainerRef.current;
    if (!container) return;
    const containerWidth = container.getBoundingClientRect().width;
    const colWidth = containerWidth / GRID_COLUMN_COUNT;
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startColSpan: current.colSpan,
      startRowSpan: current.rowSpan,
      colWidth,
    };
    setActive(true);
    setPreview({ colSpan: current.colSpan, rowSpan: current.rowSpan });
  }

  return (
    <div
      role="slider"
      aria-label="Resize widget"
      aria-valuemin={MIN_COL_SPAN}
      aria-valuemax={MAX_COL_SPAN}
      aria-valuenow={current.colSpan}
      title="Drag to resize"
      onMouseDown={onMouseDown}
      className={`hidden md:flex absolute bottom-0 right-0 w-6 h-6 items-center justify-center cursor-nwse-resize select-none z-10 ${
        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}
    >
      <CornerDownRight size={14} className="text-text-muted" />
      {active && preview && (
        <div className="absolute bottom-5 right-0 rounded-md px-2 py-1 text-[10.5px] font-mono tabular-nums bg-bg-panel-hover border border-border-strong text-text-primary whitespace-nowrap pointer-events-none">
          {preview.colSpan} × {preview.rowSpan}
        </div>
      )}
    </div>
  );
}
