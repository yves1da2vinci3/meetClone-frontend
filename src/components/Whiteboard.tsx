import { Button } from "@mantine/core";
import { useEffect, useRef } from "react";

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
  onClearLocal: () => void;
}

function Whiteboard({ strokes, onStroke, onClearLocal }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const current = useRef<StrokePoint[]>([]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
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
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const pos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  return (
    <div className="flex flex-col gap-2 h-[85vh]">
      <div className="flex justify-between items-center">
        <p className="font-semibold">Tableau blanc</p>
        <Button size="xs" variant="outline" onClick={onClearLocal}>
          Effacer local
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={360}
        height={480}
        className="border rounded bg-white cursor-crosshair w-full"
        onMouseDown={(e) => {
          drawing.current = true;
          current.current = [pos(e)];
        }}
        onMouseMove={(e) => {
          if (!drawing.current) return;
          current.current.push(pos(e));
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!ctx || current.current.length < 2) return;
          const a = current.current[current.current.length - 2];
          const b = current.current[current.current.length - 1];
          ctx.strokeStyle = "#1877f3";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }}
        onMouseUp={() => {
          if (!drawing.current) return;
          drawing.current = false;
          if (current.current.length > 1) {
            onStroke({
              points: current.current,
              color: "#1877f3",
              width: 2,
            });
          }
          current.current = [];
        }}
        onMouseLeave={() => {
          if (drawing.current) {
            drawing.current = false;
            if (current.current.length > 1) {
              onStroke({
                points: current.current,
                color: "#1877f3",
                width: 2,
              });
            }
            current.current = [];
          }
        }}
      />
    </div>
  );
}

export default Whiteboard;
