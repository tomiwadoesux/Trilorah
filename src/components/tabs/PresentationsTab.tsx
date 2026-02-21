import { useState } from "react";
import {
  Upload,
  Loader2,
  ImageIcon,
  Trash2,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { usePresentationStore } from "../../stores/presentationStore";
import { useServiceFlowStore } from "../../stores/serviceFlowStore";
import { useNotificationStore } from "../../stores/notificationStore";
import type { ServiceItem } from "../../types";
import LocalSlideImage from "../ui/LocalSlideImage";

/* ── button style constants ─────────────────────────────── */

const BTN =
  "rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed";
const BTN_PRIMARY = `${BTN} bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border-2 border-[#3E9B4F]/30 hover:border-[#3E9B4F]/60 text-[#3E9B4F]`;
const BTN_MUTED = `${BTN} bg-gradient-to-br from-gray-400/10 to-gray-400/5 border-2 border-gray-400/20 hover:border-gray-400/40 text-gray-300`;
const BTN_DANGER =
  "p-2 mr-2 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors";

/* ── per-slide content ──────────────────────────────────── */

interface PerSlideContent {
  largeTitle: string;
  subtitle: string;
  bodyText: string;
  bulletPoints: string;
  imageDataUrl: string;
  imageName: string;
}

const PER_SLIDE_DEFAULTS: PerSlideContent = {
  largeTitle: "",
  subtitle: "",
  bodyText: "",
  bulletPoints: "",
  imageDataUrl: "",
  imageName: "",
};

/* ── global form state ──────────────────────────────────── */

interface QuickSlidesFormState {
  slideCount: number;
  presentationTitle: string;
  bgColor1: string;
  bgColor2: string;
  gradientType: "none" | "linear-down" | "linear-right" | "linear-diagonal" | "radial";
  backgroundImageDataUrl: string;
  backgroundImageName: string;
}

const QUICK_SLIDES_DEFAULTS: QuickSlidesFormState = {
  slideCount: 3,
  presentationTitle: "Quick Slides",
  bgColor1: "#ffffff",
  bgColor2: "#000000",
  gradientType: "linear-down",
  backgroundImageDataUrl: "",
  backgroundImageName: "",
};

/* ── content pools ──────────────────────────────────────── */

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

/* ── layout templates ───────────────────────────────────── */

interface LayoutTemplate {
  leftInset: number;
  rightInset: number;
  titleAlign: "left" | "center" | "right";
  titleSize: number;
  titleY: number;
  subtitleY: number;
  subtitleSize: number;
  bodyY: number;
  bodyH: number;
  bulletsY: number;
  bulletsH: number;
  font: string;
  bodyFont: string;
  subtitleItalic: boolean;
  imageSide: "right" | "left";
}

const SLIDE_LAYOUTS: LayoutTemplate[] = [
  {
    // Classic Left
    leftInset: 0.7,
    rightInset: 0.7,
    titleAlign: "left",
    titleSize: 38,
    titleY: 0.5,
    subtitleY: 1.35,
    subtitleSize: 17,
    bodyY: 2.2,
    bodyH: 1.6,
    bulletsY: 4.1,
    bulletsH: 2.4,
    font: "Aptos Display",
    bodyFont: "Aptos",
    subtitleItalic: false,
    imageSide: "right",
  },
  {
    // Centered Clean
    leftInset: 1.2,
    rightInset: 1.2,
    titleAlign: "center",
    titleSize: 42,
    titleY: 0.35,
    subtitleY: 1.4,
    subtitleSize: 18,
    bodyY: 2.4,
    bodyH: 1.5,
    bulletsY: 4.2,
    bulletsH: 2.3,
    font: "Calibri",
    bodyFont: "Calibri",
    subtitleItalic: true,
    imageSide: "right",
  },
  {
    // Right Aligned
    leftInset: 0.7,
    rightInset: 0.7,
    titleAlign: "right",
    titleSize: 38,
    titleY: 0.5,
    subtitleY: 1.35,
    subtitleSize: 16,
    bodyY: 2.2,
    bodyH: 1.6,
    bulletsY: 4.1,
    bulletsH: 2.4,
    font: "Arial",
    bodyFont: "Arial",
    subtitleItalic: false,
    imageSide: "left",
  },
  {
    // Big Title
    leftInset: 0.8,
    rightInset: 0.8,
    titleAlign: "center",
    titleSize: 48,
    titleY: 0.25,
    subtitleY: 1.55,
    subtitleSize: 18,
    bodyY: 2.5,
    bodyH: 1.5,
    bulletsY: 4.3,
    bulletsH: 2.2,
    font: "Aptos Display",
    bodyFont: "Aptos",
    subtitleItalic: true,
    imageSide: "right",
  },
  {
    // Compact Modern
    leftInset: 1.0,
    rightInset: 1.0,
    titleAlign: "left",
    titleSize: 34,
    titleY: 0.6,
    subtitleY: 1.3,
    subtitleSize: 15,
    bodyY: 2.0,
    bodyH: 1.8,
    bulletsY: 4.0,
    bulletsH: 2.5,
    font: "Calibri",
    bodyFont: "Calibri",
    subtitleItalic: false,
    imageSide: "right",
  },
  {
    // Elegant Serif
    leftInset: 1.5,
    rightInset: 1.5,
    titleAlign: "center",
    titleSize: 40,
    titleY: 0.4,
    subtitleY: 1.5,
    subtitleSize: 17,
    bodyY: 2.4,
    bodyH: 1.5,
    bulletsY: 4.2,
    bulletsH: 2.3,
    font: "Georgia",
    bodyFont: "Georgia",
    subtitleItalic: true,
    imageSide: "right",
  },
  {
    // Wide Left
    leftInset: 0.4,
    rightInset: 0.4,
    titleAlign: "left",
    titleSize: 40,
    titleY: 0.45,
    subtitleY: 1.4,
    subtitleSize: 16,
    bodyY: 2.15,
    bodyH: 1.7,
    bulletsY: 4.1,
    bulletsH: 2.4,
    font: "Aptos Display",
    bodyFont: "Aptos",
    subtitleItalic: false,
    imageSide: "right",
  },
];

/* ── gradient type options ──────────────────────────────── */

const GRADIENT_OPTIONS = [
  { value: "none" as const, label: "Solid" },
  { value: "linear-down" as const, label: "↓ Top–Bottom" },
  { value: "linear-right" as const, label: "→ Left–Right" },
  { value: "linear-diagonal" as const, label: "↘ Diagonal" },
  { value: "radial" as const, label: "◉ Radial" },
];

/* ── pptxgenjs loader ───────────────────────────────────── */

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
  })().finally(() => {
    loadingPptxGen = null;
  });

  return loadingPptxGen;
}

/* ── helpers ────────────────────────────────────────────── */

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

/** Strip "#" prefix and return 6-char hex */
function cleanHex(hex: string): string {
  return hex.replace(/^#/, "").padEnd(6, "0").slice(0, 6);
}

function isLightColor(hex: string): boolean {
  const h = cleanHex(hex);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function interpolateColor(hex1: string, hex2: string, t: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
  const [r1, g1, b1] = parse(cleanHex(hex1));
  const [r2, g2, b2] = parse(cleanHex(hex2));
  return [
    Math.round(r1 + (r2 - r1) * t),
    Math.round(g1 + (g2 - g1) * t),
    Math.round(b1 + (b2 - b1) * t),
  ]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}

/** Build CSS gradient string for the preview swatch */
function cssGradient(
  c1: string,
  c2: string,
  type: QuickSlidesFormState["gradientType"],
): string {
  if (type === "none") return c1;
  if (type === "radial") return `radial-gradient(circle, ${c1}, ${c2})`;
  const angle =
    type === "linear-down" ? 180 : type === "linear-right" ? 90 : 135;
  return `linear-gradient(${angle}deg, ${c1}, ${c2})`;
}

/** Apply background (solid / gradient / image) to a PPTX slide */
function applySlideBackground(
  slide: any,
  pptx: any,
  form: QuickSlidesFormState,
) {
  if (form.backgroundImageDataUrl) {
    slide.addImage({
      data: form.backgroundImageDataUrl,
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
    });
    slide.addShape(pptx.ShapeType?.rect ?? "rect", {
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
      line: { color: "000000", transparency: 100 },
      fill: { color: "000000", transparency: 55 },
    });
    return;
  }

  const c1 = cleanHex(form.bgColor1);
  const c2 = cleanHex(form.bgColor2);

  if (form.gradientType === "none") {
    slide.background = { color: c1 };
    return;
  }

  const STRIPS = 60;

  if (
    form.gradientType === "linear-down" ||
    form.gradientType === "linear-diagonal"
  ) {
    for (let i = 0; i < STRIPS; i++) {
      const t = i / (STRIPS - 1);
      const color = interpolateColor(c1, c2, t);
      const y = (i / STRIPS) * 7.5;
      const h = 7.5 / STRIPS + 0.03;
      slide.addShape(pptx.ShapeType?.rect ?? "rect", {
        x: 0,
        y,
        w: 13.333,
        h,
        fill: { color },
        line: { color, transparency: 100 },
      });
    }
  } else if (form.gradientType === "linear-right") {
    for (let i = 0; i < STRIPS; i++) {
      const t = i / (STRIPS - 1);
      const color = interpolateColor(c1, c2, t);
      const x = (i / STRIPS) * 13.333;
      const w = 13.333 / STRIPS + 0.03;
      slide.addShape(pptx.ShapeType?.rect ?? "rect", {
        x,
        y: 0,
        w,
        h: 7.5,
        fill: { color },
        line: { color, transparency: 100 },
      });
    }
  } else if (form.gradientType === "radial") {
    slide.background = { color: c2 };
    slide.addShape(pptx.ShapeType?.ellipse ?? "ellipse", {
      x: 1.5,
      y: 0.5,
      w: 10.333,
      h: 6.5,
      fill: { color: c1, transparency: 25 },
      line: { color: c1, transparency: 100 },
    });
  }
}

/** Determine text colors based on average bg luminance */
function textColorsForBg(form: QuickSlidesFormState) {
  const midHex =
    form.gradientType === "none"
      ? cleanHex(form.bgColor1)
      : interpolateColor(form.bgColor1, form.bgColor2, 0.35);
  const light = form.backgroundImageDataUrl ? false : isLightColor(midHex);
  return light
    ? { title: "1a1a1a", subtitle: "444444", body: "333333" }
    : { title: "FFFFFF", subtitle: "CCCCCC", body: "E2E8F0" };
}

/* ── component ──────────────────────────────────────────── */

export default function PresentationsTab() {
  const { setPreviewVerse } = useAppStore();

  /* quick-slides modal state */
  const [isQuickSlidesOpen, setIsQuickSlidesOpen] = useState(false);
  const [isGeneratingQuickSlides, setIsGeneratingQuickSlides] = useState(false);
  const [quickSlidesError, setQuickSlidesError] = useState("");
  const [quickSlidesForm, setQuickSlidesForm] =
    useState<QuickSlidesFormState>(QUICK_SLIDES_DEFAULTS);
  const [perSlideContent, setPerSlideContent] = useState<PerSlideContent[]>([
    { ...PER_SLIDE_DEFAULTS },
  ]);
  const [currentEditSlide, setCurrentEditSlide] = useState(0);
  const [slideCountRaw, setSlideCountRaw] = useState(
    String(QUICK_SLIDES_DEFAULTS.slideCount),
  );

  /* import state */
  const [isImportingPptx, setIsImportingPptx] = useState(false);

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
  const pushNotification = useNotificationStore((s) => s.pushNotification);
  const dismissNotification = useNotificationStore(
    (s) => s.dismissNotification,
  );

  /* ── form helpers ───────────────────────────────────── */

  const updateGlobal = <K extends keyof QuickSlidesFormState>(
    key: K,
    value: QuickSlidesFormState[K],
  ) => setQuickSlidesForm((p) => ({ ...p, [key]: value }));

  const currentContent: PerSlideContent =
    perSlideContent[currentEditSlide] ?? PER_SLIDE_DEFAULTS;

  const updateSlideField = (field: keyof PerSlideContent, value: string) => {
    setPerSlideContent((prev) => {
      const copy = [...prev];
      if (!copy[currentEditSlide])
        copy[currentEditSlide] = { ...PER_SLIDE_DEFAULTS };
      copy[currentEditSlide] = { ...copy[currentEditSlide], [field]: value };
      return copy;
    });
  };

  const handleSlideCountChange = (raw: number) => {
    const n = Math.max(1, Math.min(50, Math.floor(raw || 1)));
    updateGlobal("slideCount", n);
    setPerSlideContent((prev) => {
      if (n > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: n - prev.length }, () => ({
            ...PER_SLIDE_DEFAULTS,
          })),
        ];
      }
      return prev.slice(0, n);
    });
    if (currentEditSlide >= n) setCurrentEditSlide(Math.max(0, n - 1));
  };

  const handleSlideImageUpload = async (file: File | undefined) => {
    if (!file) {
      updateSlideField("imageDataUrl", "");
      updateSlideField("imageName", "");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateSlideField("imageDataUrl", dataUrl);
      updateSlideField("imageName", file.name);
    } catch {
      setQuickSlidesError("Could not load image file.");
    }
  };

  const handleBgImageUpload = async (file: File | undefined) => {
    if (!file) {
      updateGlobal("backgroundImageDataUrl", "");
      updateGlobal("backgroundImageName", "");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateGlobal("backgroundImageDataUrl", dataUrl);
      updateGlobal("backgroundImageName", file.name);
    } catch {
      setQuickSlidesError("Could not load image file.");
    }
  };

  const openQuickSlides = () => {
    setQuickSlidesError("");
    setQuickSlidesForm(QUICK_SLIDES_DEFAULTS);
    setSlideCountRaw(String(QUICK_SLIDES_DEFAULTS.slideCount));
    setPerSlideContent(
      Array.from({ length: QUICK_SLIDES_DEFAULTS.slideCount }, () => ({
        ...PER_SLIDE_DEFAULTS,
      })),
    );
    setCurrentEditSlide(0);
    setIsQuickSlidesOpen(true);
  };

  /* ── generation ─────────────────────────────────────── */

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
      const presentationTitle =
        quickSlidesForm.presentationTitle.trim() || "Quick Slides";

      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "AI Preacher Assistant";
      pptx.subject = "Quick Slides";
      pptx.title = presentationTitle;

      const colors = textColorsForBg(quickSlidesForm);

      /* track used layouts so we avoid immediate repeats */
      let lastLayoutIdx = -1;

      for (let i = 0; i < slideCount; i++) {
        const slide = pptx.addSlide();

        /* pick a random layout, avoiding the one just used */
        let layoutIdx: number;
        do {
          layoutIdx = Math.floor(Math.random() * SLIDE_LAYOUTS.length);
        } while (layoutIdx === lastLayoutIdx && SLIDE_LAYOUTS.length > 1);
        lastLayoutIdx = layoutIdx;
        const layout = SLIDE_LAYOUTS[layoutIdx];

        const sc = perSlideContent[i] ?? PER_SLIDE_DEFAULTS;

        const titleBase = sc.largeTitle.trim() || pickRandom(TITLE_POOL);
        const subtitleBase = sc.subtitle.trim() || pickRandom(SUBTITLE_POOL);
        const bodyParagraphs = splitParagraphs(sc.bodyText);
        const bulletLines = splitLines(sc.bulletPoints);

        const slideTitle =
          slideCount > 1 ? `${titleBase} ${i + 1}` : titleBase;
        const slideSubtitle =
          slideCount > 1
            ? `${subtitleBase} \u2022 Part ${i + 1}`
            : subtitleBase;
        const bodyText =
          bodyParagraphs.length > 0
            ? bodyParagraphs[i % bodyParagraphs.length]
            : pickRandom(BODY_POOL);
        const bullets =
          bulletLines.length > 0 ? bulletLines : pickRandom(BULLET_POOL);

        const hasImage = Boolean(sc.imageDataUrl);
        const imageW = 4.1;
        const imageGap = 0.5;
        const slideW = 13.333;

        const textW = hasImage
          ? slideW - layout.leftInset - layout.rightInset - imageW - imageGap
          : slideW - layout.leftInset - layout.rightInset;

        const textX =
          layout.imageSide === "left" && hasImage
            ? layout.leftInset + imageW + imageGap
            : layout.leftInset;

        /* background */
        applySlideBackground(slide, pptx, quickSlidesForm);

        /* title */
        slide.addText(slideTitle, {
          x: textX,
          y: layout.titleY,
          w: textW,
          h: 0.9,
          fontFace: layout.font,
          fontSize: layout.titleSize,
          bold: true,
          color: colors.title,
          align: layout.titleAlign,
        });

        /* subtitle */
        slide.addText(slideSubtitle, {
          x: textX,
          y: layout.subtitleY,
          w: textW,
          h: 0.45,
          fontFace: layout.bodyFont,
          fontSize: layout.subtitleSize,
          italic: layout.subtitleItalic,
          color: colors.subtitle,
          align: layout.titleAlign,
        });

        /* body */
        slide.addText(bodyText, {
          x: textX,
          y: layout.bodyY,
          w: textW,
          h: layout.bodyH,
          fontFace: layout.bodyFont,
          fontSize: 18,
          color: colors.body,
          valign: "top",
          breakLine: true,
          align: layout.titleAlign === "center" ? "center" : "left",
        });

        /* bullets */
        slide.addText(
          bullets.map((line) => `\u2022 ${line}`).join("\n"),
          {
            x: textX,
            y: layout.bulletsY,
            w: textW,
            h: layout.bulletsH,
            fontFace: layout.bodyFont,
            fontSize: 18,
            color: colors.body,
            breakLine: true,
            valign: "top",
            align: layout.titleAlign === "center" ? "center" : "left",
          },
        );

        /* slide image */
        if (hasImage) {
          const imgX =
            layout.imageSide === "left"
              ? layout.leftInset
              : slideW - layout.rightInset - imageW;
          slide.addImage({
            data: sc.imageDataUrl,
            x: imgX,
            y: 1.35,
            w: imageW,
            h: 4.6,
          });
        }

        /* footer */
        slide.addText(`Slide ${i + 1}`, {
          x: 11.8,
          y: 6.95,
          w: 1.3,
          h: 0.3,
          fontFace: layout.bodyFont,
          fontSize: 10,
          color: "999999",
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
      setPerSlideContent([{ ...PER_SLIDE_DEFAULTS }]);
      setCurrentEditSlide(0);
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

  /* ── import PPTX handler ────────────────────────────── */

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

  /* ── derived helpers for modal ──────────────────────── */

  const isMultiSlide = quickSlidesForm.slideCount > 1;
  const isLastSlide = currentEditSlide >= quickSlidesForm.slideCount - 1;
  const isFirstSlide = currentEditSlide === 0;

  /* ── render ─────────────────────────────────────────── */

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#0a0a0a]">
      {/* ── Header ──────────────────────────────────── */}
      <div className="min-h-14 bg-[#151515] border-b border-white/10 flex items-center px-4 gap-3 relative py-2">
        <span className="text-sm font-medium text-white">Presentations</span>
        <div className="flex-1" />
        <button
          onClick={openQuickSlides}
          disabled={isGeneratingQuickSlides}
          className={`${BTN_PRIMARY} flex items-center gap-2 px-4 py-2 text-sm`}
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
          className={`${BTN_PRIMARY} flex items-center gap-2 px-4 py-2 text-sm`}
        >
          {isImportingPresentation || isImportingPptx ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Upload size={16} />
          )}
          Import PPTX
        </button>
      </div>

      {/* ── Presentation list + Slides grid ─────────── */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        {/* list */}
        <div className="w-64 min-h-0 border-r border-white/10 overflow-y-auto">
          {presentations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <ImageIcon className="text-gray-600 mb-3" size={32} />
              <p className="text-sm text-gray-500">No presentations yet</p>
              <p className="text-xs text-gray-600 mt-1">
                Click &quot;Import PPTX&quot; to get started
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
                    JSON.stringify(itemsToDrag),
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
                    const shouldPlay = handleMultiSelectClick(
                      pres.id,
                      allIds,
                      e,
                    );
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
                  <div className="font-medium text-sm truncate">
                    {pres.title}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    {pres.slides.length} slides
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePresentation(pres.id);
                  }}
                  className={BTN_DANGER}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* slides grid */}
        <div className="flex-1 min-h-0 p-4 overflow-hidden flex flex-col">
          <div
            className="flex-1 min-h-0 overflow-y-auto pr-1"
            onWheel={(e) => {
              e.currentTarget.scrollTop += e.deltaY;
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

      {/* ── Quick Slides Modal ──────────────────────── */}
      {isQuickSlidesOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[88vh] bg-[#111111] border border-white/10 rounded-xl flex flex-col">
            {/* header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              <Sparkles size={16} className="text-[#3E9B4F]" />
              <div className="text-sm font-semibold text-white">
                Quick Slides
              </div>
              {isMultiSlide && (
                <div className="ml-1 text-xs text-[#3E9B4F] bg-[#3E9B4F]/15 px-2 py-0.5 rounded-full font-semibold">
                  Slide {currentEditSlide + 1} of {quickSlidesForm.slideCount}
                </div>
              )}
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

            {/* form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* ── global fields (only on first slide view) ── */}
              {isFirstSlide && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-xs text-gray-300 space-y-2">
                      <div>
                        Number of slides{" "}
                        <span className="text-red-400">*</span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={slideCountRaw}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || /^\d{0,2}$/.test(v)) {
                            setSlideCountRaw(v);
                          }
                        }}
                        onBlur={() => {
                          const n = parseInt(slideCountRaw, 10);
                          if (!n || n < 1) {
                            setSlideCountRaw("1");
                            handleSlideCountChange(1);
                          } else {
                            const clamped = Math.min(50, n);
                            setSlideCountRaw(String(clamped));
                            handleSlideCountChange(clamped);
                          }
                        }}
                        className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/60"
                      />
                    </label>
                    <label className="text-xs text-gray-300 space-y-2">
                      <div>Presentation title</div>
                      <input
                        type="text"
                        value={quickSlidesForm.presentationTitle}
                        onChange={(e) =>
                          updateGlobal("presentationTitle", e.target.value)
                        }
                        placeholder="Quick Slides"
                        className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/60"
                      />
                    </label>
                  </div>

                  {/* ── background color / gradient section ── */}
                  <div className="space-y-3">
                    <div className="text-xs text-gray-300 font-medium">
                      Background
                    </div>

                    {/* preview swatch */}
                    <div
                      className="w-14 h-14 rounded-lg border border-white/10"
                      style={{
                        background: quickSlidesForm.backgroundImageDataUrl
                          ? `url(${quickSlidesForm.backgroundImageDataUrl}) center/cover`
                          : cssGradient(
                              quickSlidesForm.bgColor1,
                              quickSlidesForm.bgColor2,
                              quickSlidesForm.gradientType,
                            ),
                      }}
                    />

                    {/* colour pickers row */}
                    <div className="flex items-end gap-4">
                      <label className="text-xs text-gray-400 space-y-1.5 flex-1">
                        <div>Color 1</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={quickSlidesForm.bgColor1}
                            onChange={(e) =>
                              updateGlobal("bgColor1", e.target.value)
                            }
                            className="w-8 h-8 rounded border border-white/15 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={quickSlidesForm.bgColor1}
                            onChange={(e) =>
                              updateGlobal("bgColor1", e.target.value)
                            }
                            className="flex-1 bg-[#0a0a0a] border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#3E9B4F]/60 font-mono"
                          />
                        </div>
                      </label>

                      {quickSlidesForm.gradientType !== "none" && (
                        <label className="text-xs text-gray-400 space-y-1.5 flex-1">
                          <div>Color 2</div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={quickSlidesForm.bgColor2}
                              onChange={(e) =>
                                updateGlobal("bgColor2", e.target.value)
                              }
                              className="w-8 h-8 rounded border border-white/15 bg-transparent cursor-pointer"
                            />
                            <input
                              type="text"
                              value={quickSlidesForm.bgColor2}
                              onChange={(e) =>
                                updateGlobal("bgColor2", e.target.value)
                              }
                              className="flex-1 bg-[#0a0a0a] border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#3E9B4F]/60 font-mono"
                            />
                          </div>
                        </label>
                      )}
                    </div>

                    {/* gradient type selector */}
                    <div className="flex flex-wrap gap-2">
                      {GRADIENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateGlobal("gradientType", opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            quickSlidesForm.gradientType === opt.value
                              ? "border-[#3E9B4F]/60 bg-[#3E9B4F]/15 text-[#3E9B4F]"
                              : "border-white/10 bg-white/5 text-gray-400 hover:border-white/25"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* background image */}
                    <label className="block text-xs text-gray-400 space-y-1.5">
                      <div>Background image (overrides color)</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleBgImageUpload(e.target.files?.[0])
                        }
                        className="w-full text-xs text-gray-400 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-[#1f2937] file:text-gray-200 hover:file:bg-[#374151]"
                      />
                      {quickSlidesForm.backgroundImageName && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 truncate">
                            {quickSlidesForm.backgroundImageName}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateGlobal("backgroundImageDataUrl", "");
                              updateGlobal("backgroundImageName", "");
                            }}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </label>
                  </div>
                </>
              )}

              {/* ── per-slide content fields ── */}
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs text-gray-300 space-y-2">
                  <div>Large title (optional)</div>
                  <input
                    type="text"
                    value={currentContent.largeTitle}
                    onChange={(e) =>
                      updateSlideField("largeTitle", e.target.value)
                    }
                    placeholder="Grace For Today"
                    className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/60"
                  />
                </label>
                <label className="text-xs text-gray-300 space-y-2">
                  <div>Subtitle (optional)</div>
                  <input
                    type="text"
                    value={currentContent.subtitle}
                    onChange={(e) =>
                      updateSlideField("subtitle", e.target.value)
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
                  value={currentContent.bodyText}
                  onChange={(e) =>
                    updateSlideField("bodyText", e.target.value)
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
                  value={currentContent.bulletPoints}
                  onChange={(e) =>
                    updateSlideField("bulletPoints", e.target.value)
                  }
                  placeholder={
                    "Opening thought\nMain scripture\nPractical application"
                  }
                  className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/60"
                />
              </label>

              <label className="block text-xs text-gray-300 space-y-2">
                <div>Slide image (optional)</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleSlideImageUpload(e.target.files?.[0])
                  }
                  className="w-full text-xs text-gray-400 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-[#1f2937] file:text-gray-200 hover:file:bg-[#374151]"
                />
                {currentContent.imageName && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 truncate">
                      {currentContent.imageName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateSlideField("imageDataUrl", "");
                        updateSlideField("imageName", "");
                      }}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </label>

              {quickSlidesError && (
                <div className="text-xs text-red-300 bg-red-500/15 border border-red-500/25 rounded-lg p-3">
                  {quickSlidesError}
                </div>
              )}
            </div>

            {/* ── footer with navigation + generate ──── */}
            <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={() => setIsQuickSlidesOpen(false)}
                disabled={isGeneratingQuickSlides}
                className={`${BTN_MUTED} px-4 py-2 text-sm`}
              >
                Cancel
              </button>

              <div className="flex-1" />

              {/* previous slide */}
              {isMultiSlide && !isFirstSlide && (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentEditSlide((p) => Math.max(0, p - 1))
                  }
                  className={`${BTN_MUTED} px-4 py-2 text-sm flex items-center gap-2`}
                >
                  <ChevronLeft size={14} />
                  Previous Slide
                </button>
              )}

              {/* next slide OR generate */}
              {isMultiSlide && !isLastSlide ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentEditSlide((p) =>
                      Math.min(quickSlidesForm.slideCount - 1, p + 1),
                    )
                  }
                  className={`${BTN_PRIMARY} px-4 py-2 text-sm flex items-center gap-2`}
                >
                  Next Slide
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={generateQuickSlides}
                  disabled={isGeneratingQuickSlides}
                  className={`${BTN_PRIMARY} px-4 py-2 text-sm flex items-center gap-2`}
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
