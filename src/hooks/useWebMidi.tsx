import { useEffect, useState } from "react";
import { WebMidi, Input } from "webmidi";
import { useAppStore } from "../stores/appStore";

export function useWebMidi() {
  const [midiStatus, setMidiStatus] = useState<string>("Disconnected");
  const [midiInputs, setMidiInputs] = useState<Input[]>([]);

  useEffect(() => {
    // Enable WebMidi system
    WebMidi.enable()
      .then(() => {
        setMidiStatus("Connected");
        setMidiInputs(WebMidi.inputs);

        // Bind global MIDI actions
        WebMidi.inputs.forEach((input) => {
          registerMidiListeners(input);
        });

        // Handle hot-swapping cables
        WebMidi.addListener("connected", (e) => {
          setMidiInputs(WebMidi.inputs);
          if (e.port.type === "input") {
            registerMidiListeners(e.port as Input);
          }
        });

        WebMidi.addListener("disconnected", () => {
          setMidiInputs(WebMidi.inputs);
        });
      })
      .catch((err) => {
        setMidiStatus("Failed to access MIDI: " + err.message);
      });

    return () => {
      // Disconnect all listeners on unmount
      if (WebMidi.enabled) {
        WebMidi.inputs.forEach((input) => {
          input.removeListener();
        });
        WebMidi.disable();
      }
    };
  }, []);

  function registerMidiListeners(input: Input) {
    // Clear old listeners for this input just in case
    input.removeListener();

    input.addListener("noteon", (e) => {
      const note = e.note.identifier;
      const velocity = e.note.attack;
      console.log(`MIDI Note On: ${note} (Velocity: ${velocity})`);
      routeMidiToActions(note, "noteon");
    });

    input.addListener("controlchange", (e) => {
      const controller = e.controller.number;
      const value = (e.value as number) || 0;
      console.log(`MIDI CC: ${controller} (Value: ${value})`);
      routeMidiToActions(controller.toString(), "cc", value);
    });
  }

  function routeMidiToActions(
    identifier: string,
    type: "noteon" | "cc",
    value?: number,
  ) {
    // Example logic map. Ideally this would be configurable in a Settings UI window.
    const { pushPreviewToLive, clearLiveText } = useAppStore.getState();

    if (type === "noteon") {
      switch (identifier) {
        case "C3": // Middle C
          // Example: Push to Live
          pushPreviewToLive();
          break;
        case "C#3":
          // Example: Clear Live Text
          clearLiveText();
          break;
      }
    }
  }

  return { midiStatus, midiInputs };
}
