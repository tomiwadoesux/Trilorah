import { create } from "zustand";

interface AsrState {
  isListening: boolean;
  audioLevel: number;
  currentTranscript: string;
  detectedReference: string | null;
  whisperStatus: string;
  availableDevices: MediaDeviceInfo[];
  selectedDeviceId: string;

  // Actions
  setIsListening: (listening: boolean) => void;
  setAudioLevel: (level: number) => void;
  setCurrentTranscript: (transcript: string) => void;
  setDetectedReference: (ref: string | null) => void;
  setWhisperStatus: (status: string) => void;
  setAvailableDevices: (devices: MediaDeviceInfo[]) => void;
  setSelectedDeviceId: (id: string) => void;
}

export const useAsrStore = create<AsrState>((set) => ({
  isListening: false,
  audioLevel: -60,
  currentTranscript: "",
  detectedReference: null,
  whisperStatus: "Initializing...",
  availableDevices: [],
  selectedDeviceId: "default",

  setIsListening: (isListening) => set({ isListening }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setCurrentTranscript: (currentTranscript) => set({ currentTranscript }),
  setDetectedReference: (detectedReference) => set({ detectedReference }),
  setWhisperStatus: (whisperStatus) => set({ whisperStatus }),
  setAvailableDevices: (availableDevices) => set({ availableDevices }),
  setSelectedDeviceId: (selectedDeviceId) => set({ selectedDeviceId }),
}));
