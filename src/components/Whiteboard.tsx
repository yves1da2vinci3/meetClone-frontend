import { Button } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

interface WhiteboardProps {
  strokes: Stroke[];
  onStroke: (stroke: Stroke) => void;
  onClear: () => void;
  onUndo: () => void;
}

const COLORS = ["#1877f3", "#e03131", "#2f9e44", "#111111", "#f59f00"];
const WIDTHS = [1, 3, 8];
const ERASER_COLOR = "#ffffff";
const ERASER_WIDTH = 20;

function Whiteboard({ strokes, onStroke, onClear, onUndo }: WhiteboardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const drawing = useRef(false);
  const current = useRef<StrokePoint[]>([]);
  const strokesRef = useRef(strokes);
  const toolRef = useRef({ color: COLORS[0], width: 3 });

  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(3);
  const [eraser, setEraser] = useState(false);

  toolRef.current = {
    color: eraser ? ERASER_COLOR : color,
    width: eraser ? ERASER_WIDTH : width,
  };
  strokesRef.current = strokes;

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = dprRef.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);
    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      redraw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const posFromClient = (clientX: number, clientY: number): StrokePoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const drawSegment = (a: StrokePoint, b: StrokePoint) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const dpr = dprRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = toolRef.current.color;
    ctx.lineWidth = toolRef.current.width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };

  const startDraw = (clientX: number, clientY: number) => {
    drawing.current = true;
    current.current = [posFromClient(clientX, clientY)];
  };

  const moveDraw = (clientX: number, clientY: number) => {
    if (!drawing.current) return;
    const next = posFromClient(clientX, clientY);
    const prev = current.current[current.current.length - 1];
    current.current.push(next);
    if (prev) drawSegment(prev, next);
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (current.current.length > 1) {
      onStroke({
        points: current.current,
        color: toolRef.current.color,
        width: toolRef.current.width,
      });
    }
    current.current = [];
  };

  return (
    <div className="flex flex-col gap-2 h-[85vh]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold mr-1">Tableau blanc</p>
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => {
              setEraser(false);
              setColor(c);
            }}
            className={`h-6 w-6 rounded-full border ${
              !eraser && color === c ? "ring-2 ring-offset-1 ring-blue-500" : ""
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <button
          type="button"
          onClick={() => setEraser(true)}
          className={`text-xs px-2 py-1 border rounded ${
            eraser ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          Gomme
        </button>
        {WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => {
              setEraser(false);
              setWidth(w);
            }}
            className={`text-xs px-2 py-1 border rounded ${
              !eraser && width === w ? "bg-blue-600 text-white" : "bg-white"
            }`}
          >
            {w === 1 ? "Fin" : w === 3 ? "Normal" : "Gros"}
          </button>
        ))}
        <Button size="xs" variant="outline" onClick={onUndo}>
          Undo
        </Button>
        <Button size="xs" color="red" variant="outline" onClick={onClear}>
          Effacer tout
        </Button>
      </div>
      <div ref={wrapperRef} className="flex-1 min-h-0 border rounded bg-white">
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair touch-none"
          onMouseDown={(e) => startDraw(e.clientX, e.clientY)}
          onMouseMove={(e) => moveDraw(e.clientX, e.clientY)}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (!t) return;
            e.preventDefault();
            startDraw(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (!t) return;
            e.preventDefault();
            moveDraw(t.clientX, t.clientY);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            endDraw();
          }}
        />
      </div>
    </div>
  );
}

export default Whiteboard;
