import { useState } from "react";
import { Upload, Loader2, ImageIcon, Trash2, Sparkles, X } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { usePresentationStore } from "../../stores/presentationStore";
import { useServiceFlowStore } from "../../stores/serviceFlowStore";
import { useNotificationStore } from "../../stores/notificationStore";
import type { ServiceItem } from "../../types";
import LocalSlideImage from "../ui/LocalSlideImage";

interface QuickSlidesFormState {
  slideCount: number;
  presentationTitle: string;
  largeTitle: string;
  subtitle: string;
  bulletPoints: string;
  bodyText: string;
  backgroundImageDataUrl: string;
  backgroundImageName: string;
  imageDataUrl: string;
  imageName: string;
}

const QUICK_SLIDES_DEFAULTS: QuickSlidesFormState = {
  slideCount: 3,
  presentationTitle: "Quick Slides",
  largeTitle: "",
  subtitle: "",
  bulletPoints: "",
  bodyText: "",
  backgroundImageDataUrl: "",
  backgroundImageName: "",
  imageDataUrl: "",
  imageName: "",
};

const TITLE_POOL = [
  "Sunday Service",
  "Faith In Action",
  "Hope And Courage",
  "Grace For Today",
  "Walk In Purpose",
  "Called To Serve",
];

const SUBTITLE_POOL = [
  "A focused moment for your congregation",
  "Prepared with clarity and confidence",
  "Message-driven visual support",
  "Designed for worship and teaching",
];

const BODY_POOL = [
  "This slide was generated to help you move quickly from idea to presentation while keeping a clean and readable layout.",
  "Use this area for scripture context, teaching notes, or practical next steps that support your sermon flow.",
  "Keep the message simple, memorable, and anchored in the main point for stronger audience retention.",
  "Add short paragraphs here to create visual rhythm and guide the congregation through each section naturally.",
];

const BULLET_POOL = [
  ["Key scripture focus", "Main talking point", "Practical takeaway"],
  ["Opening thought", "Core message", "Closing call to action"],
  ["Context", "Interpretation", "Application"],
  ["Observation", "Reflection", "Response"],
];

const COLOR_PALETTE = [
  { bg: "0F172A", title: "FFFFFF", subtitle: "BFDBFE", body: "E2E8F0" },
  { bg: "1F2937", title: "FFFFFF", subtitle: "A7F3D0", body: "E5E7EB" },
  { bg: "111827", title: "FFFFFF", subtitle: "FDE68A", body: "E5E7EB" },
  { bg: "0B132B", title: "FFFFFF", subtitle: "C7D2FE", body: "E2E8F0" },
];

type PptxGenCtor = new () => any;

let cachedPptxGenCtor: PptxGenCtor | null = null;
let loadingPptxGen: Promise<PptxGenCtor> | null = null;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
}

function loadExternalScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-quick-slides-src="${src}"]`,
    ) as HTMLScriptElement | null;

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error(`Failed to load ${src}`)),
          { once: true },
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.quickSlidesSrc = src;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function loadPptxGenCtor(): Promise<PptxGenCtor> {
  if (cachedPptxGenCtor) return cachedPptxGenCtor;
  if (loadingPptxGen) return loadingPptxGen;

  loadingPptxGen = (async () => {
    const failures: string[] = [];

    try {
      const esmModule = await import(
        /* @vite-ignore */ "https://esm.sh/pptxgenjs@3.12.0"
      );
      const ctor = (esmModule as any).default ?? esmModule;
      cachedPptxGenCtor = ctor as PptxGenCtor;
      return cachedPptxGenCtor;
    } catch (error) {
      failures.push(`esm.sh import: ${getErrorMessage(error)}`);
    }

    try {
      await loadExternalScript(
        "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
      );
      const ctor = (window as any).PptxGenJS ?? (window as any).pptxgen;
      if (typeof ctor !== "function") {
        throw new Error("PptxGenJS global was not found after script load");
      }
      cachedPptxGenCtor = ctor as PptxGenCtor;
      return cachedPptxGenCtor;
    } catch (error) {
      failures.push(`jsdelivr script: ${getErrorMessage(error)}`);
    }

    throw new Error(failures.join(" | "));
  })()
    .finally(() => {
      loadingPptxGen = null;
    });

  return loadingPptxGen;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function toArrayBuffer(data: unknown): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;

  if (data instanceof Uint8Array) {
    return data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer;
  }

  throw new Error("Unexpected PPTX output format");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32768;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read selected image"));
    reader.readAsDataURL(file);
  });
}

export default function PresentationsTab() {
  const { setPreviewVerse } = useAppStore();
  const [isQuickSlidesOpen, setIsQuickSlidesOpen] = useState(false);
  const [isGeneratingQuickSlides, setIsGeneratingQuickSlides] = useState(false);
  const [isImportingPptx, setIsImportingPptx] = useState(false);
  const [quickSlidesError, setQuickSlidesError] = useState("");
  const [quickSlidesForm, setQuickSlidesForm] =
    useState<QuickSlidesFormState>(QUICK_SLIDES_DEFAULTS);

  const {
    presentations,
    selectedPresentation,
    selectedPresentationSlide,
    isImportingPresentation,
    setIsImportingPresentation,
    setSelectedPresentation,
    setSelectedPresentationSlide,
    addPresentation,
    deletePresentation,
  } = usePresentationStore();

  const { selectedItems, handleMultiSelectClick } = useServiceFlowStore();
  const pushNotification = useNotificationStore(
    (state) => state.pushNotification,
  );
  const dismissNotification = useNotificationStore(
    (state) => state.dismissNotification,
  );

  const updateQuickSlidesField = <K extends keyof QuickSlidesFormState>(
    key: K,
    value: QuickSlidesFormState[K],
  ) => {
    setQuickSlidesForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (
    file: File | undefined,
    dataKey: "backgroundImageDataUrl" | "imageDataUrl",
    nameKey: "backgroundImageName" | "imageName",
  ) => {
    if (!file) {
      updateQuickSlidesField(dataKey, "");
      updateQuickSlidesField(nameKey, "");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateQuickSlidesField(dataKey, dataUrl);
      updateQuickSlidesField(nameKey, file.name);
    } catch (error) {
      console.error(error);
      setQuickSlidesError("Could not load image file.");
    }
  };

  const generateQuickSlides = async () => {
    setQuickSlidesError("");

    const slideCount = Math.floor(Number(quickSlidesForm.slideCount));
    if (!Number.isFinite(slideCount) || slideCount < 1 || slideCount > 50) {
      setQuickSlidesError("Slide count must be between 1 and 50.");
      return;
    }

    setIsQuickSlidesOpen(false);
    setIsGeneratingQuickSlides(true);
    const generationNoticeId = pushNotification({
      title: "Quick Slides",
      message: "Generating PPTX presentation...",
      status: "info",
      durationMs: 0,
    });

    try {
      const PptxGenJS = await loadPptxGenCtor();
      const pptx = new PptxGenJS();
      const titleBase =
        quickSlidesForm.largeTitle.trim() || pickRandom(TITLE_POOL);
      const subtitleBase =
        quickSlidesForm.subtitle.trim() || pickRandom(SUBTITLE_POOL);
      const bodyParagraphs = splitParagraphs(quickSlidesForm.bodyText);
      const bulletLines = splitLines(quickSlidesForm.bulletPoints);
      const presentationTitle =
        quickSlidesForm.presentationTitle.trim() || "Quick Slides";

      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "AI Preacher Assistant";
      pptx.subject = "Quick Slides";
      pptx.title = presentationTitle;

      for (let i = 0; i < slideCount; i++) {
        const slide = pptx.addSlide();
        const palette = COLOR_PALETTE[i % COLOR_PALETTE.length];
        const slideTitle =
          slideCount > 1 ? `${titleBase} ${i + 1}` : `${titleBase}`;
        const slideSubtitle =
          slideCount > 1 ? `${subtitleBase} • Part ${i + 1}` : subtitleBase;
        const bodyText =
          bodyParagraphs.length > 0
            ? bodyParagraphs[i % bodyParagraphs.length]
            : pickRandom(BODY_POOL);
        const bullets =
          bulletLines.length > 0 ? bulletLines : pickRandom(BULLET_POOL);
        const hasImage = Boolean(quickSlidesForm.imageDataUrl);
        const textWidth = hasImage ? 7.5 : 11.7;

        if (quickSlidesForm.backgroundImageDataUrl) {
          slide.addImage({
            data: quickSlidesForm.backgroundImageDataUrl,
            x: 0,
            y: 0,
            w: 13.333,
            h: 7.5,
          });
          slide.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 13.333,
            h: 7.5,
            line: { color: "000000", transparency: 100 },
            fill: { color: "000000", transparency: 55 },
          });
        } else {
          slide.background = { color: palette.bg };
        }

        slide.addText(slideTitle, {
          x: 0.7,
          y: 0.45,
          w: textWidth,
          h: 0.8,
          fontFace: "Aptos Display",
          fontSize: 38,
          bold: true,
          color: palette.title,
        });

        slide.addText(slideSubtitle, {
          x: 0.7,
          y: 1.25,
          w: textWidth,
          h: 0.45,
          fontFace: "Aptos",
          fontSize: 17,
          color: palette.subtitle,
        });

        slide.addText(bodyText, {
          x: 0.7,
          y: 2,
          w: textWidth,
          h: 1.7,
          fontFace: "Aptos",
          fontSize: 18,
          color: palette.body,
          valign: "top",
          breakLine: true,
        });

        slide.addText(
          bullets.map((line) => `• ${line}`).join("\n"),
          {
            x: 0.7,
            y: 4.05,
            w: textWidth,
            h: 2.35,
            fontFace: "Aptos",
            fontSize: 18,
            color: palette.body,
            breakLine: true,
            valign: "top",
          },
        );

        if (hasImage) {
          slide.addImage({
            data: quickSlidesForm.imageDataUrl,
            x: 8.55,
            y: 1.35,
            w: 4.1,
            h: 4.6,
          });
        }

        slide.addText(`Slide ${i + 1}`, {
          x: 11.8,
          y: 6.95,
          w: 1.3,
          h: 0.3,
          fontFace: "Aptos",
          fontSize: 10,
          color: "D1D5DB",
          align: "right",
        });
      }

      const data = await pptx.write({ outputType: "arraybuffer" });
      const pptxBase64 = arrayBufferToBase64(toArrayBuffer(data));
      const result = await window.api.importGeneratedPresentation({
        title: presentationTitle,
        pptxBase64,
      });

      if (!result.success || !result.data) {
        dismissNotification(generationNoticeId);
        pushNotification({
          title: "Quick Slides Failed",
          message: result.error || "Failed to import generated presentation.",
          status: "error",
        });
        return;
      }

      addPresentation({
        id: `pres-${Date.now()}`,
        title: result.data.title,
        slides: result.data.slides,
        sourcePptx: result.data.pptxPath,
      });

      dismissNotification(generationNoticeId);
      pushNotification({
        title: "Quick Slides Ready",
        message: `${result.data.title} added to Presentations.`,
        status: "success",
      });
      setQuickSlidesForm(QUICK_SLIDES_DEFAULTS);
    } catch (error) {
      console.error(error);
      const details = getErrorMessage(error);
      dismissNotification(generationNoticeId);
      if (
        details.includes(
          "No handler registered for 'import-generated-presentation'",
        )
      ) {
        pushNotification({
          title: "Quick Slides Failed",
          message:
            "Backend is out of date. Restart Electron (or run `npm run dev`) and try again.",
          status: "error",
        });
      } else {
        pushNotification({
          title: "Quick Slides Failed",
          message: details,
          status: "error",
        });
      }
    } finally {
      setIsGeneratingQuickSlides(false);
    }
  };

  const handleImportPresentation = async () => {
    setIsImportingPptx(true);
    setIsImportingPresentation(true);
    const importNoticeId = pushNotification({
      title: "Importing PPTX",
      message: "Converting presentation to slides...",
      status: "info",
      durationMs: 0,
    });

    try {
      const result = await window.api.importPresentation();
      dismissNotification(importNoticeId);

      if (!result.success || !result.data) {
        if (result.error && result.error !== "Cancelled") {
          pushNotification({
            title: "Import Failed",
            message: result.error,
            status: "error",
          });
        }
        return;
      }

      addPresentation({
        id: `pres-${Date.now()}`,
        title: result.data.title,
        slides: result.data.slides,
        sourcePptx: result.data.pptxPath,
      });

      pushNotification({
        title: "Import Complete",
        message: `${result.data.title} added to Presentations.`,
        status: "success",
      });
    } catch (error) {
      dismissNotification(importNoticeId);
      pushNotification({
        title: "Import Failed",
        message: getErrorMessage(error),
        status: "error",
      });
    } finally {
      setIsImportingPptx(false);
      setIsImportingPresentation(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#0a0a0a]">
      {/* Presentations Header */}
      <div className="min-h-14 bg-[#151515] border-b border-white/10 flex items-center px-4 gap-3 relative py-2">
        <span className="text-sm font-medium text-white">Presentations</span>
        <div className="flex-1" />
        <button
          onClick={() => {
            setQuickSlidesError("");
            setIsQuickSlidesOpen(true);
          }}
          disabled={isGeneratingQuickSlides}
          className="flex items-center gap-2 px-4 py-2 bg-[#1f2937] hover:bg-[#374151] disabled:bg-gray-700 rounded-lg text-sm font-medium text-white transition-colors"
        >
          {isGeneratingQuickSlides ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          Quick Slides
        </button>
        <button
          onClick={handleImportPresentation}
          disabled={isImportingPresentation || isImportingPptx}
          className="flex items-center gap-2 px-4 py-2 bg-[#3E9B4F] hover:bg-[#4fb85f] disabled:bg-gray-700 rounded-lg text-sm font-medium text-white transition-colors"
        >
          {isImportingPresentation || isImportingPptx ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Upload size={16} />
          )}
          Import PPTX
        </button>
      </div>

      {/* Presentation List + Slides View */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        {/* Presentation List */}
        <div className="w-64 min-h-0 border-r border-white/10 overflow-y-auto">
          {presentations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <ImageIcon className="text-gray-600 mb-3" size={32} />
              <p className="text-sm text-gray-500">No presentations yet</p>
              <p className="text-xs text-gray-600 mt-1">
                Click "Import PPTX" to get started
              </p>
            </div>
          ) : (
            presentations.map((pres) => (
              <div
                key={pres.id}
                draggable
                onDragStart={(e) => {
                  let itemsToDrag: ServiceItem[] = [];
                  if (selectedItems.has(pres.id)) {
                    itemsToDrag = presentations
                      .filter((p) => selectedItems.has(p.id))
                      .map((p) => ({
                        id: p.id,
                        type: "presentation",
                        title: p.title,
                        subtitle: `${p.slides.length} slides`,
                        data: p,
                      }));
                  } else {
                    itemsToDrag = [
                      {
                        id: pres.id,
                        type: "presentation",
                        title: pres.title,
                        subtitle: `${pres.slides.length} slides`,
                        data: pres,
                      },
                    ];
                  }
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify(itemsToDrag)
                  );
                }}
                className={`flex items-center border-b border-white/5 transition-colors ${
                  selectedItems.has(pres.id) ||
                  selectedPresentation?.id === pres.id
                    ? "bg-[#3E9B4F]/20"
                    : "hover:bg-white/5"
                }`}
              >
                <button
                  onClick={(e) => {
                    const allIds = presentations.map((p) => p.id);
                    const shouldPlay = handleMultiSelectClick(pres.id, allIds, e);
                    if (shouldPlay) {
                      setSelectedPresentation(pres);
                      setSelectedPresentationSlide(0);
                      if (pres.slides.length > 0) {
                        setPreviewVerse({
                          ref: `${pres.title} - Slide 1`,
                          text: `[SLIDE:${pres.slides[0]}]`,
                        });
                      }
                    }
                  }}
                  className={`flex-1 p-3 text-left ${
                    selectedItems.has(pres.id) ||
                    selectedPresentation?.id === pres.id
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  <div className="font-medium text-sm truncate">{pres.title}</div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    {pres.slides.length} slides
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePresentation(pres.id);
                  }}
                  className="p-2 mr-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Slides Grid */}
        <div className="flex-1 min-h-0 p-4 overflow-hidden flex flex-col">
          <div
            className="flex-1 min-h-0 overflow-y-auto pr-1"
            onWheel={(e) => {
              const el = e.currentTarget;
              el.scrollTop += e.deltaY;
            }}
          >
            {selectedPresentation ? (
              <div className="grid grid-cols-3 gap-3 pb-4">
                {selectedPresentation.slides.map((slide, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedPresentationSlide(index);
                      setPreviewVerse({
                        ref: `${selectedPresentation.title} - Slide ${index + 1}`,
                        text: `[SLIDE:${slide}]`,
                      });
                    }}
                    className={`aspect-video rounded-lg border-2 overflow-hidden relative ${
                      selectedPresentationSlide === index
                        ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <LocalSlideImage
                      path={slide}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                      mode="data"
                    />
                    <div className="absolute bottom-1 left-1 text-[10px] text-white bg-black/60 px-1 rounded">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ImageIcon className="text-gray-600 mb-3" size={40} />
                <p className="text-sm text-gray-500">
                  Select a presentation to view slides
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isQuickSlidesOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[88vh] bg-[#111111] border border-white/10 rounded-xl flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              <Sparkles size={16} className="text-[#3E9B4F]" />
              <div className="text-sm font-semibold text-white">
                Quick Slides
              </div>
              <div className="text-xs text-gray-400">
                Generate a PPTX and import instantly
              </div>
              <div className="flex-1" />
              <button
                onClick={() => {
                  if (!isGeneratingQuickSlides) setIsQuickSlidesOpen(false);
                }}
                className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs text-gray-300 space-y-2">
                  <div>
                    Number of slides <span className="text-red-400">*</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={quickSlidesForm.slideCount}
                    onChange={(e) =>
                      updateQuickSlidesField(
                        "slideCount",
                        Number(e.target.value || 1),
                      )
                    }
                    className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/60"
                  />
                </label>
                <label className="text-xs text-gray-300 space-y-2">
                  <div>Presentation title</div>
                  <input
                    type="text"
                    value={quickSlidesForm.presentationTitle}
                    onChange={(e) =>
                      updateQuickSlidesField("presentationTitle", e.target.value)
                    }
                    placeholder="Quick Slides"
                    className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/60"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs text-gray-300 space-y-2">
                  <div>Large title (optional)</div>
                  <input
                    type="text"
                    value={quickSlidesForm.largeTitle}
                    onChange={(e) =>
                      updateQuickSlidesField("largeTitle", e.target.value)
                    }
                    placeholder="Grace For Today"
                    className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/60"
                  />
                </label>
                <label className="text-xs text-gray-300 space-y-2">
                  <div>Subtitle (optional)</div>
                  <input
                    type="text"
                    value={quickSlidesForm.subtitle}
                    onChange={(e) =>
                      updateQuickSlidesField("subtitle", e.target.value)
                    }
                    placeholder="A focused moment for your congregation"
                    className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/60"
                  />
                </label>
              </div>

              <label className="block text-xs text-gray-300 space-y-2">
                <div>Body text / paragraphs (optional)</div>
                <textarea
                  rows={4}
                  value={quickSlidesForm.bodyText}
                  onChange={(e) =>
                    updateQuickSlidesField("bodyText", e.target.value)
                  }
                  placeholder={
                    "Paragraph one...\n\nParagraph two...\n\nLeave blank to auto-generate."
                  }
                  className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/60"
                />
              </label>

              <label className="block text-xs text-gray-300 space-y-2">
                <div>Bullet points (optional, one per line)</div>
                <textarea
                  rows={4}
                  value={quickSlidesForm.bulletPoints}
                  onChange={(e) =>
                    updateQuickSlidesField("bulletPoints", e.target.value)
                  }
                  placeholder={
                    "Opening thought\nMain scripture\nPractical application"
                  }
                  className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/60"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs text-gray-300 space-y-2">
                  <div>Background image (optional)</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(
                        e.target.files?.[0],
                        "backgroundImageDataUrl",
                        "backgroundImageName",
                      )
                    }
                    className="w-full text-xs text-gray-400 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-[#1f2937] file:text-gray-200 hover:file:bg-[#374151]"
                  />
                  {quickSlidesForm.backgroundImageName && (
                    <div className="text-[11px] text-gray-500 truncate">
                      {quickSlidesForm.backgroundImageName}
                    </div>
                  )}
                </label>
                <label className="text-xs text-gray-300 space-y-2">
                  <div>Slide image (optional)</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(
                        e.target.files?.[0],
                        "imageDataUrl",
                        "imageName",
                      )
                    }
                    className="w-full text-xs text-gray-400 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-[#1f2937] file:text-gray-200 hover:file:bg-[#374151]"
                  />
                  {quickSlidesForm.imageName && (
                    <div className="text-[11px] text-gray-500 truncate">
                      {quickSlidesForm.imageName}
                    </div>
                  )}
                </label>
              </div>

              {quickSlidesError && (
                <div className="text-xs text-red-300 bg-red-500/15 border border-red-500/25 rounded-lg p-3">
                  {quickSlidesError}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={() => setIsQuickSlidesOpen(false)}
                disabled={isGeneratingQuickSlides}
                className="px-4 py-2 rounded-lg bg-[#1f2937] hover:bg-[#374151] disabled:bg-gray-700 text-sm text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateQuickSlides}
                disabled={isGeneratingQuickSlides}
                className="px-4 py-2 rounded-lg bg-[#3E9B4F] hover:bg-[#4fb85f] disabled:bg-gray-700 text-sm text-white font-medium transition-colors flex items-center gap-2"
              >
                {isGeneratingQuickSlides ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate Quick Slides
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
