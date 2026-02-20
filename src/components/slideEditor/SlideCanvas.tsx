import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { useSlideEditorStore } from "../../stores/slideEditorStore";

export default function SlideCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const {
    activeTool,
    activeSlideIndex,
    slidesJSON,
    updateSlideJSON,
    setSelectedObject,
    canvasBackgroundColor,
    setActiveTool,
  } = useSlideEditorStore();

  const isInternalChange = useRef(false);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1280,
      height: 720,
      backgroundColor: "#1a1a1a",
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    // Center canvas visually via CSS transform scaling to fit container later.
    // Right now, hardcode the viewport.

    const updateSelectedObj = () => {
      const activeObj = canvas.getActiveObject();
      if (!activeObj) {
        setSelectedObject(null);
        return;
      }
      setSelectedObject({
        id: activeObj.get("id"),
        type: activeObj.type || "object",
        left: activeObj.get("left") || 0,
        top: activeObj.get("top") || 0,
        width: activeObj.get("width") || 0,
        height: activeObj.get("height") || 0,
        scaleX: activeObj.get("scaleX") || 1,
        scaleY: activeObj.get("scaleY") || 1,
        angle: activeObj.get("angle") || 0,
        fill: (activeObj.get("fill") as string) || "#ffffff",
        stroke: (activeObj.get("stroke") as string) || "",
        strokeWidth: activeObj.get("strokeWidth") || 0,
        opacity:
          activeObj.get("opacity") !== undefined
            ? (activeObj.get("opacity") as number)
            : 1,
        text: (activeObj as any).text || "",
        fontFamily: (activeObj as any).fontFamily || "Arial",
        fontSize: (activeObj as any).fontSize || 40,
        fontWeight: (activeObj as any).fontWeight || "normal",
        textAlign: (activeObj as any).textAlign || "left",
      });
    };

    const saveHistory = () => {
      if (isInternalChange.current) return;
      const json = JSON.stringify((canvas as any).toJSON(["id"]));
      updateSlideJSON(useSlideEditorStore.getState().activeSlideIndex, json);
    };

    canvas.on("selection:created", updateSelectedObj);
    canvas.on("selection:updated", updateSelectedObj);
    canvas.on("selection:cleared", updateSelectedObj);
    canvas.on("object:modified", () => {
      updateSelectedObj();
      saveHistory();
    });
    canvas.on("object:added", saveHistory);
    canvas.on("object:removed", saveHistory);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []); // Run once on mount

  // Load from history when slide index changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const currentJSON = slidesJSON[activeSlideIndex];
    if (currentJSON) {
      isInternalChange.current = true;
      canvas.loadFromJSON(currentJSON, () => {
        canvas.renderAll();
        isInternalChange.current = false;
      });
    } else {
      isInternalChange.current = true;
      canvas.clear();
      canvas.backgroundColor = canvasBackgroundColor;
      canvas.renderAll();
      isInternalChange.current = false;
    }
  }, [activeSlideIndex]); // don't depend on slidesJSON so it doesn't loop

  // Draw Mode Effects
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = activeTool === "select";
    canvas.forEachObject((obj) => {
      obj.selectable = activeTool === "select";
      obj.evented = activeTool === "select";
    });

    const onMouseDown = (o: fabric.TEvent) => {
      if (activeTool === "select") return;

      const pointer = canvas.getPointer(o.e);
      let obj: fabric.Object | null = null;

      const uid = Date.now().toString();

      if (activeTool === "rect") {
        obj = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 100,
          height: 100,
          fill: "#3E9B4F",
          originX: "center",
          originY: "center",
          id: uid,
        } as any);
      } else if (activeTool === "circle") {
        obj = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 50,
          fill: "#3E9B4F",
          originX: "center",
          originY: "center",
          id: uid,
        } as any);
      } else if (activeTool === "text") {
        obj = new fabric.IText("Type here", {
          left: pointer.x,
          top: pointer.y,
          fontFamily: "Arial",
          fontSize: 80,
          fill: "#ffffff",
          originX: "center",
          originY: "center",
          id: uid,
        } as any);
      } else if (activeTool === "line") {
        obj = new fabric.Line(
          [pointer.x, pointer.y, pointer.x + 100, pointer.y],
          {
            stroke: "#3E9B4F",
            strokeWidth: 5,
            id: uid,
          } as any,
        );
      }

      if (obj) {
        canvas.add(obj);
        canvas.setActiveObject(obj);
        setActiveTool("select"); // switch back to select automatically
      }
    };

    canvas.on("mouse:down", onMouseDown);

    return () => {
      canvas.off("mouse:down", onMouseDown);
    };
  }, [activeTool, setActiveTool]);

  useEffect(() => {
    const handleForward = () => {
      const active = fabricRef.current?.getActiveObject();
      if (active && fabricRef.current) {
        fabricRef.current.bringObjectForward(active);
        updateSlideJSONAction();
      }
    };
    const handleBackward = () => {
      const active = fabricRef.current?.getActiveObject();
      if (active && fabricRef.current) {
        fabricRef.current.sendObjectBackwards(active);
        updateSlideJSONAction();
      }
    };
    const handleDelete = () => {
      const active = fabricRef.current?.getActiveObject();
      if (active && fabricRef.current) {
        fabricRef.current.remove(active);
        useSlideEditorStore.getState().setSelectedObject(null);
        updateSlideJSONAction();
      }
    };

    const updateSlideJSONAction = () => {
      if (fabricRef.current && !isInternalChange.current) {
        const json = JSON.stringify((fabricRef.current as any).toJSON(["id"]));
        updateSlideJSON(useSlideEditorStore.getState().activeSlideIndex, json);
      }
    };

    window.addEventListener(
      "slideEditor:forward",
      handleForward as EventListener,
    );
    window.addEventListener(
      "slideEditor:backward",
      handleBackward as EventListener,
    );
    window.addEventListener(
      "slideEditor:delete",
      handleDelete as EventListener,
    );

    return () => {
      window.removeEventListener(
        "slideEditor:forward",
        handleForward as EventListener,
      );
      window.removeEventListener(
        "slideEditor:backward",
        handleBackward as EventListener,
      );
      window.removeEventListener(
        "slideEditor:delete",
        handleDelete as EventListener,
      );
    };
  }, [updateSlideJSON]);

  // Handle external prop changes (from sidebar)
  useEffect(() => {
    let lastObj = useSlideEditorStore.getState().selectedObject;
    const unsubscribe = useSlideEditorStore.subscribe((state) => {
      const newObj = state.selectedObject;
      if (newObj === lastObj) return;
      lastObj = newObj;
      const canvas = fabricRef.current;
      if (!canvas || !newObj) return;

      // Compare references to prevent circular update loop
      // We only want to apply changes if the UI typed something
      // (the UI will replace the object entirely in state via set())
      const activeObj = canvas.getActiveObject();
      if (activeObj) {
        activeObj.set({
          left: newObj.left,
          top: newObj.top,
          width: newObj.width,
          height: newObj.height,
          scaleX: newObj.scaleX,
          scaleY: newObj.scaleY,
          angle: newObj.angle,
          fill: newObj.fill,
          stroke: newObj.stroke,
          strokeWidth: newObj.strokeWidth,
          opacity: newObj.opacity,
        });

        if (newObj.type === "i-text") {
          activeObj.set({
            text: newObj.text,
            fontFamily: newObj.fontFamily,
            fontSize: newObj.fontSize,
            fontWeight: newObj.fontWeight as any,
            textAlign: newObj.textAlign,
          });
        }

        canvas.renderAll();
        // We don't trigger save history here instantly unless needed, to avoid rapid keystroke lags.
        // For simplicity, do it in a small debounce if needed, or rely on activeObj blur.
      }
    });

    return () => unsubscribe();
  }, []);

  // Update background color
  useEffect(() => {
    const canvas = fabricRef.current;
    if (canvas) {
      canvas.backgroundColor = canvasBackgroundColor;
      canvas.renderAll();
    }
  }, [canvasBackgroundColor]);

  return (
    <div className="flex-1 overflow-auto bg-[#0a0a0a] flex items-center justify-center p-8 relative">
      <div
        className="shadow-2xl ring-1 ring-white/10"
        style={{
          width: 1280,
          height: 720,
          transform: "scale(0.6)",
          transformOrigin: "center",
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded text-xs font-mono text-gray-400">
        1280x720 (Live Output Size)
      </div>
    </div>
  );
}
