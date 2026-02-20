import { useCallback } from "react";
import Toolbar from "../slideEditor/Toolbar";
import SlideCanvas from "../slideEditor/SlideCanvas";
import PropertyPanel from "../slideEditor/PropertyPanel";
import SlideStrip from "../slideEditor/SlideStrip";
import { useSlideEditorStore } from "../../stores/slideEditorStore";

export default function SlideEditorTab() {
  const { selectedObject, setSelectedObject, setCanvasBackgroundColor } =
    useSlideEditorStore();

  const handlePropertyChange = useCallback(
    (key: string, value: any) => {
      if (selectedObject) {
        setSelectedObject({ ...selectedObject, [key]: value });
      }
    },
    [selectedObject, setSelectedObject],
  );

  const handleCanvasColorChange = useCallback(
    (color: string) => {
      setCanvasBackgroundColor(color);
    },
    [setCanvasBackgroundColor],
  );

  const handleDeleteLayer = useCallback(() => {
    // We emit an event to Canvas component?
    // A slightly hacky way to delete is to trigger via window event, or a flag in store.
    // For now, let's use a CustomEvent.
    window.dispatchEvent(new CustomEvent("slideEditor:delete"));
  }, []);

  const handleBringForward = useCallback(() => {
    window.dispatchEvent(new CustomEvent("slideEditor:forward"));
  }, []);

  const handleSendBackward = useCallback(() => {
    window.dispatchEvent(new CustomEvent("slideEditor:backward"));
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0A]">
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <SlideCanvas />
        <PropertyPanel
          onPropertyChange={handlePropertyChange}
          onCanvasColorChange={handleCanvasColorChange}
          onDeleteLayer={handleDeleteLayer}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
        />
      </div>
      <SlideStrip />
    </div>
  );
}
