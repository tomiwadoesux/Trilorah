import React, { useEffect, useRef } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TabDeck } from "./components/layout/TabDeck";
import MonitorBar from "./components/monitors/MonitorBar";
import { useAppStore } from "./stores/appStore";
import { useScriptureStore } from "./stores/scriptureStore";
import { useAsrStore } from "./stores/asrStore";
import { useSongStore } from "./stores/songStore";
import { useWhisperTranscription } from "./useWhisperTranscription";
import { BOOK_NAMES } from "./utils/constants";
import NotificationTray from "./components/ui/NotificationTray";
import {
  normalizeLyrics,
  getSlideWordSet,
  getLastLine,
  shouldAutoAdvance,
  calculateCoverageRatio,
  shouldCatchUp,
} from "./utils/lyricMatcher";
import { usePresentationStore } from "./stores/presentationStore";
import { useWebMidi } from "./hooks/useWebMidi";

export default function App() {
  useWebMidi();

  // Load persisted presentations on startup
  useEffect(() => {
    usePresentationStore.getState().loadPresentations();
  }, []);

  const {
    activeTab,
    incrementElapsedTime,
    setLiveVerse,
    setPreviewVerse,
    setShowLiveText,
  } = useAppStore();

  const {
    currentBook,
    currentChapter,
    selectedDeckId,
    setChapterVerses,
    setIsLoading,
    setCurrentBook,
    setCurrentChapter,
    setSelectedDeckId,
    addToHistory,
    chapterVerses,
  } = useScriptureStore();

  const {
    selectedDeviceId,
    isListening,
    setAvailableDevices,
    setAudioLevel,
    setCurrentTranscript,
    setDetectedReference,
    setWhisperStatus,
  } = useAsrStore();

  const {
    selectedSong,
    selectedSlideIndex,
    setSelectedSlideIndex,
    listeningMode,
    slidePhase,
    setSlidePhase,
    setIsAutoAdvancing,
  } = useSongStore();

  // Unused presentation store, removed destructured vars

  const heardWordsRef = useRef<Set<string>>(new Set());
  const autoAdvanceLockedRef = useRef(false);
  const pendingAdvanceRef = useRef(false);
  const catchUpCooldownRef = useRef(false);

  // Effect: Cursor blink CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .cursor-blink {
        animation: blink 1s step-end infinite;
        display: inline-block;
        width: 1ch;
        background-color: currentColor;
        vertical-align: text-bottom;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Effect: Service timer
  useEffect(() => {
    const interval = setInterval(() => {
      incrementElapsedTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [incrementElapsedTime]);

  // Effect: Listen to API Webhooks
  useEffect(() => {
    if (!window.api?.onExternalCommand) return;
    const cleanup = window.api.onExternalCommand((data: any) => {
      if (data.command === "start-listening") {
        useAsrStore.setState({ isListening: true });
      } else if (data.command === "stop-listening") {
        useAsrStore.setState({ isListening: false });
      } else if (data.command === "clear-screen") {
        useAppStore.setState({ showLiveText: false });
      } else if (data.command === "push-preview") {
        useAppStore.getState().pushPreviewToLive();
      } else if (data.command === "set-mode") {
        useAppStore.setState({ mode: data.value as any });
      }
    });
    return cleanup;
  }, []);

  // Effect: Fetch chapter from database
  useEffect(() => {
    async function loadChapter() {
      setIsLoading(true);
      try {
        let verses: any[] = [];
        const result = await window.api.getChapter(currentBook, currentChapter);
        if (result.success && result.data) {
          verses = result.data;
        }
        setChapterVerses(verses);

        const targetVerse =
          verses.find((v: any) => v.id === selectedDeckId) || verses[0];
        if (targetVerse) {
          setPreviewVerse({ ref: targetVerse.ref, text: targetVerse.text });
          // Force live verse update if it says 'Loading...' (using functional update safely here)
          useAppStore.setState((prev) =>
            prev.liveVerse.text === "Loading..."
              ? {
                  ...prev,
                  liveVerse: { ref: targetVerse.ref, text: targetVerse.text },
                }
              : prev,
          );
        }
      } catch (error) {
        setChapterVerses([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadChapter();
  }, [
    currentBook,
    currentChapter,
    selectedDeckId,
    setChapterVerses,
    setIsLoading,
    setPreviewVerse,
  ]);

  // Effect: Update preview on verse selection
  useEffect(() => {
    const verse = chapterVerses.find((v) => v.id === selectedDeckId);
    if (verse) {
      setPreviewVerse({ ref: verse.ref, text: verse.text });
    }
  }, [selectedDeckId, chapterVerses, setPreviewVerse]);

  // Function: Detect verse from transcript
  const detectVerseFromTranscript = (text: string) => {
    const VERSE_REGEX =
      /(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts?|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s*(?:chapter\s*)?(\d+)(?:\s*(?:verse|:|\s)\s*(\d+))?/i;
    const match = text.match(VERSE_REGEX);
    if (match) {
      const [, bookName, chapterStr, verseStr] = match;
      const chapter = parseInt(chapterStr);
      const verse = verseStr ? parseInt(verseStr) : 1;
      const ref = `${bookName} ${chapter}:${verse}`;

      setDetectedReference(ref);
      const bookId = Object.entries(BOOK_NAMES).find(
        ([, name]) => name.toLowerCase() === bookName.toLowerCase(),
      )?.[0];

      if (bookId !== undefined && listeningMode === "scripture") {
        setCurrentBook(parseInt(bookId));
        setCurrentChapter(chapter);
        setSelectedDeckId(verse);
        addToHistory(ref, "Detected");
        setTimeout(() => setDetectedReference(null), 3000);
      }
    }
  };

  // Reset lyric matching when song or slide changes
  useEffect(() => {
    heardWordsRef.current.clear();
    autoAdvanceLockedRef.current = false;
    pendingAdvanceRef.current = false;
    catchUpCooldownRef.current = false;
    setIsAutoAdvancing(false);
    setSlidePhase("start");
  }, [selectedSong?.id, selectedSlideIndex, setSlidePhase, setIsAutoAdvancing]);

  const handleWhisperTranscript = (text: string) => {
    setCurrentTranscript(text);

    if (
      activeTab === "songs" &&
      selectedSong &&
      listeningMode === "lyrics" &&
      !autoAdvanceLockedRef.current
    ) {
      const newWords = normalizeLyrics(text);
      newWords.forEach((w) => heardWordsRef.current.add(w));

      const currentSlideText = selectedSong.slides[selectedSlideIndex];
      const slideWords = getSlideWordSet(currentSlideText);
      const lastLine = getLastLine(currentSlideText);

      const coverage = calculateCoverageRatio(
        slideWords,
        heardWordsRef.current,
      );
      let shouldAdvanceNow = false;
      let isCatchUp = false;

      if (slidePhase === "start" && coverage >= 0.25) {
        setSlidePhase("middle");
      } else if (slidePhase === "middle" && coverage >= 0.55) {
        setSlidePhase("end");
      }

      if (
        shouldAutoAdvance(
          slideWords,
          heardWordsRef.current,
          lastLine,
          slidePhase,
        )
      ) {
        shouldAdvanceNow = true;
      } else if (
        !catchUpCooldownRef.current &&
        slidePhase !== "start" &&
        selectedSlideIndex < selectedSong.slides.length - 1
      ) {
        const nextSlideText = selectedSong.slides[selectedSlideIndex + 1];
        const nextSlideWords = getSlideWordSet(nextSlideText);
        if (shouldCatchUp(nextSlideWords, heardWordsRef.current)) {
          shouldAdvanceNow = true;
          isCatchUp = true;
        }
      }

      if (
        shouldAdvanceNow &&
        selectedSlideIndex < selectedSong.slides.length - 1
      ) {
        if (!pendingAdvanceRef.current) {
          pendingAdvanceRef.current = true;
          setTimeout(() => {
            if (!autoAdvanceLockedRef.current) {
              autoAdvanceLockedRef.current = true;
              setIsAutoAdvancing(true);

              if (isCatchUp) {
                catchUpCooldownRef.current = true;
                setTimeout(() => {
                  catchUpCooldownRef.current = false;
                }, 1500);
              }

              const nextIndex = selectedSlideIndex + 1;
              setSelectedSlideIndex(nextIndex);

              const newVerse = {
                ref: selectedSong.title,
                text: selectedSong.slides[nextIndex],
              };
              setPreviewVerse(newVerse);
              setLiveVerse(newVerse);
              setShowLiveText(true);

              setTimeout(() => setIsAutoAdvancing(false), 2000);
            }
            pendingAdvanceRef.current = false;
          }, 400);
        }
      }
    }
  };

  const {
    startRecording: startWhisperRecording,
    stopRecording: stopWhisperRecording,
  } = useWhisperTranscription({
    onTranscript: handleWhisperTranscript,
    onStatusChange: setWhisperStatus,
    deviceId: selectedDeviceId,
  });

  // Effect: Listen for AI Verse Detections
  useEffect(() => {
    if (!window.api?.onVerseDetected) return;
    const cleanup = window.api.onVerseDetected((data: any) => {
      if (listeningMode !== "scripture") return;

      const ref =
        data.endVerse && data.endVerse !== data.verse
          ? `${data.book} ${data.chapter}:${data.verse}-${data.endVerse}`
          : `${data.book} ${data.chapter}:${data.verse}`;
      const text =
        data.verses?.map((v: any) => v.text).join(" ") || data.text || "";

      if (
        !data.isPreview &&
        activeTab !== "songs" &&
        activeTab !== "presentations"
      ) {
        setLiveVerse({ ref, text });
        addToHistory(ref, text.slice(0, 50) + (text.length > 50 ? "..." : ""));
      }
    });
    return cleanup;
  }, [activeTab, listeningMode, setLiveVerse, addToHistory]);

  // Effect: Listen for AI Verse PREVIEW
  useEffect(() => {
    if (!window.api?.onVersePreview) return;
    const cleanup = window.api.onVersePreview((data: any) => {
      if (listeningMode !== "scripture") return;

      const ref =
        data.endVerse && data.endVerse !== data.verse
          ? `${data.book} ${data.chapter}:${data.verse}-${data.endVerse}`
          : `${data.book} ${data.chapter}:${data.verse}`;

      const text =
        data.verses?.map((v: any) => v.text).join(" ") ||
        data.text ||
        "Loading...";
      let progress = undefined;

      if (data.rangeEnd) {
        const currentEnd = data.endVerse || data.verse;
        progress = `v${data.verse}–${currentEnd} of ${data.rangeEnd}`;
      }

      if (activeTab !== "songs" && activeTab !== "presentations") {
        setPreviewVerse({ ref, text, progress });
      }
      setDetectedReference(ref);

      const bookId = Object.entries(BOOK_NAMES).find(
        ([, name]) => name.toLowerCase() === data.book.toLowerCase(),
      )?.[0];

      if (bookId !== undefined) {
        setCurrentBook(parseInt(bookId));
        setCurrentChapter(data.chapter);
        setSelectedDeckId(data.verse ?? 1);
      }
      setTimeout(() => setDetectedReference(null), 5000);
    });
    return cleanup;
  }, [
    activeTab,
    listeningMode,
    setPreviewVerse,
    setDetectedReference,
    setCurrentBook,
    setCurrentChapter,
    setSelectedDeckId,
  ]);

  // Effect: Enumerate Audio Devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput",
        );
        setAvailableDevices(audioInputs);
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    };
    getDevices();
  }, [setAvailableDevices]);

  // Effect: Listen for Transcript Updates
  const transcriptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!window.api?.onTranscriptUpdate) return;
    const cleanup = window.api.onTranscriptUpdate((text: string) => {
      if (transcriptTimerRef.current) clearTimeout(transcriptTimerRef.current);
      setCurrentTranscript(text);
      transcriptTimerRef.current = setTimeout(() => {
        setCurrentTranscript("");
      }, 8000);
    });
    return () => {
      cleanup?.();
      if (transcriptTimerRef.current) clearTimeout(transcriptTimerRef.current);
    };
  }, [setCurrentTranscript]);

  // Effect: Microphone + Web Speech Recognition
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let stream: MediaStream | null = null;
    let animationId: number;
    let recognition: any = null;
    let currentDb = -60;

    const lerp = (start: number, end: number, amt: number) =>
      (1 - amt) * start + amt * end;

    const startRealMic = async () => {
      try {
        const constraints = {
          audio:
            selectedDeviceId === "default"
              ? true
              : { deviceId: { exact: selectedDeviceId } },
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();

        if (audioContext.state === "suspended") await audioContext.resume();

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.fftSize);

        const updateLevel = () => {
          if (!analyser) return;
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const amplitude = (dataArray[i] - 128) / 128;
            sum += amplitude * amplitude;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          let targetDb = rms > 0 ? 20 * Math.log10(rms) : -60;
          targetDb = Math.max(-60, Math.min(0, targetDb));
          currentDb = lerp(currentDb, targetDb, 0.3);
          setAudioLevel(currentDb);
          animationId = requestAnimationFrame(updateLevel);
        };
        updateLevel();

        const SpeechRecognition =
          (window as any).webkitSpeechRecognition ||
          (window as any).SpeechRecognition;
        if (SpeechRecognition) {
          recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: any) => {
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcriptChunk = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                window.api?.sendText(transcriptChunk);
                setCurrentTranscript(transcriptChunk);
                detectVerseFromTranscript(transcriptChunk);
              } else {
                interimTranscript += transcriptChunk;
                setCurrentTranscript(interimTranscript);
              }
            }
          };

          recognition.onerror = (event: any) => {
            if (event.error !== "no-speech" && isListening) {
              try {
                recognition.start();
              } catch (e) {}
            }
          };

          recognition.onend = () => {
            if (isListening) {
              try {
                recognition.start();
              } catch (e) {}
            }
          };

          recognition.start();
        }
      } catch (err) {
        console.error("Microphone access denied or error:", err);
      }
    };

    if (isListening) {
      startRealMic();
      window.api?.startListening();
    } else {
      window.api?.stopListening();
      setAudioLevel(-60);
      if (stream)
        (stream as MediaStream).getTracks().forEach((track) => track.stop());
      if (audioContext) (audioContext as AudioContext).close();
      if (recognition) recognition.stop();
    }

    return () => {
      cancelAnimationFrame(animationId);
      if (stream)
        (stream as MediaStream).getTracks().forEach((track) => track.stop());
      if (audioContext) (audioContext as AudioContext).close();
      if (recognition) recognition.stop();
    };
  }, [isListening, selectedDeviceId, setAudioLevel, setCurrentTranscript]);

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-white font-sans overflow-hidden">
      <NotificationTray />
      <Sidebar
        startWhisperRecording={startWhisperRecording}
        stopWhisperRecording={stopWhisperRecording}
        detectVerseFromTranscript={detectVerseFromTranscript}
      />
      <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
        <MonitorBar
          startWhisperRecording={startWhisperRecording}
          stopWhisperRecording={stopWhisperRecording}
        />
        <div className="flex-1 flex min-h-0">
          <TabDeck />
        </div>
      </div>
    </div>
  );
}
