/**
 * Design: Nile Margins — warm editorial reading workspace with a persistent route rail,
 * five balanced colored reading sections with translation revealed only by the learner, plus Nile-teal audio tracking.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Headphones,
  Languages,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
  Search,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import rawEvidenceMap from "@/data/evidenceMap.json";
import rawLessonData from "@/data/lessonData.json";
import rawListeningOverrides from "@/data/listeningOverrides.json";

type Paragraph = {
  text: string;
  arabicTranslation: string;
  bookQuestions?: string[];
  jreQuestion: string;
  start?: number;
  end?: number;
};

type Passage = {
  id: string;
  kind: "reading" | "listening";
  title: string;
  sourcePages: string[];
  audioStatus: string;
  paragraphs: Paragraph[];
};

type Lesson = {
  lessonId: string;
  title: string;
  passages: Passage[];
};

type LessonParagraph = Paragraph & {
  passageId: string;
  passageTitle: string;
  passageKind: "reading" | "listening";
  localIndex: number;
};

type LessonPiece = {
  id: string;
  number: number;
  startIndex: number;
  endIndex: number;
  text: string;
  arabicTranslation: string;
  bookQuestions: string[];
  jreQuestions: string[];
  evidenceQuote: string;
  kinds: Array<"reading" | "listening">;
  segments: Array<{ sourceIndex: number; text: string }>;
};

type ListeningOverride = Record<string, { paragraphs: Paragraph[] }>;

const lessons = rawLessonData as Lesson[];
const listeningOverrides = rawListeningOverrides as ListeningOverride;
const evidenceMap = rawEvidenceMap as Record<string, string>;

const unitMeta: Record<string, { title: string; arabic: string; eyebrow: string }> = {
  "1": { title: "Living Well in a Complex World", arabic: "العيش بصحة في عالم معقد", eyebrow: "Well-being" },
  "2": { title: "Leisure Time", arabic: "وقت الفراغ", eyebrow: "Experiences" },
  "3": { title: "Echoes of the Past", arabic: "أصداء الماضي", eyebrow: "Identity" },
  "4": { title: "The Power of Choice", arabic: "قوة الاختيار", eyebrow: "Consumption & Choice" },
  "5": { title: "The Greenhouse Effect", arabic: "الأثر البيئي", eyebrow: "Sharing the Planet" },
};

const originalAudio: Record<string, string> = {
  "1.1": "/assets/unit1Lesson1.mp3",
  "1.4": "/assets/unit1Lesson4.mp3",
  "2.1": "/assets/unit2Lesson1.mp3",
  "2.3": "/assets/unit2Lesson3.mp3",
  "3.1": "/assets/unit3Lesson1.mp3",
  "3.4": "/assets/unit3Lesson4.mp3",
  "4.3": "/assets/unit4Lesson3.mp3",
  "5.2": "/assets/unit5Lesson2.mp3",
  "5.3": "/assets/unit5Lesson3.mp3",
};

const generatedReadingAudio: Record<string, string> = {
  "1.1::passage-1": "/assets/reading-unit1-lesson1-intro.wav",
};

const unitImages: Partial<Record<string, string>> = {
  "1": "/assets/unit-1.jpg",
  "3": "/assets/unit-3.jpg",
  "5": "/assets/unit-5.jpg",
};

const lessonNumber = (lesson: Lesson) => {
  const match = lesson.lessonId.match(/([1-5])\D*([1-4])/);
  return match ? `${match[1]}.${match[2]}` : lesson.lessonId.replace("Lesson ", "");
};
const lessonUnit = (lesson: Lesson) => lessonNumber(lesson).split(".")[0];

function normalizeQuestions(passage: Passage) {
  return passage.paragraphs.flatMap((paragraph) => paragraph.bookQuestions || []);
}

export default function Home() {
  const [selectedUnit, setSelectedUnit] = useState("1");
  const [selectedLessonId, setSelectedLessonId] = useState("1.1");
  const [selectedPassageId, setSelectedPassageId] = useState("");
  const [activeParagraph, setActiveParagraph] = useState(0);
  const [openTranslations, setOpenTranslations] = useState<Record<string, boolean>>({});
  const [showBookQuestions, setShowBookQuestions] = useState(true);
  const [revealedEvidence, setRevealedEvidence] = useState<Record<string, boolean>>({});
  const [missionEvidence, setMissionEvidence] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("efl-reader-mission-evidence") || "{}");
    } catch {
      return {};
    }
  });
  const [lensActive, setLensActive] = useState<Record<string, boolean>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeviceVoice, setIsDeviceVoice] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("efl-reader-student-answers") || "{}");
    } catch {
      return {};
    }
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const unitLessons = useMemo(
    () => lessons.filter((lesson) => lessonUnit(lesson) === selectedUnit),
    [selectedUnit],
  );

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lessonNumber(lesson) === selectedLessonId) || lessons[0],
    [selectedLessonId],
  );

  const selectedPassage = useMemo(
    () => selectedLesson.passages.find((passage) => passage.id === selectedPassageId) || selectedLesson.passages[0],
    [selectedLesson, selectedPassageId],
  );

  const currentLessonNumber = lessonNumber(selectedLesson);
  const hasOriginalAudio = Boolean(originalAudio[currentLessonNumber]) && selectedPassage?.kind === "listening";
  const generatedAudioSource = generatedReadingAudio[`${currentLessonNumber}::${selectedPassage?.id}`];
  const hasGeneratedAudio = Boolean(generatedAudioSource);
  const hasTrackedAudio = hasOriginalAudio || hasGeneratedAudio;
  const audioSource = hasOriginalAudio ? originalAudio[currentLessonNumber] : generatedAudioSource;
  const displayParagraphs = useMemo<LessonParagraph[]>(() => selectedLesson.passages.flatMap((passage) => {
    const passageUsesOriginalAudio = Boolean(originalAudio[currentLessonNumber]) && passage.kind === "listening";
    const override = passageUsesOriginalAudio ? listeningOverrides[currentLessonNumber]?.paragraphs : undefined;
    const sourceParagraphs = override?.length
      ? override.map((paragraph, index) => ({ ...paragraph, bookQuestions: index === override.length - 1 ? normalizeQuestions(passage) : [] }))
      : passage.paragraphs;
    return sourceParagraphs.map((paragraph, localIndex) => ({
      ...paragraph,
      passageId: passage.id,
      passageTitle: passage.title,
      passageKind: passage.kind,
      localIndex,
    }));
  }), [selectedLesson, currentLessonNumber]);

  const lessonPieces = useMemo<LessonPiece[]>(() => {
    if (!displayParagraphs.length) return [];
    const pieceCount = Math.min(5, displayParagraphs.length);
    const basePieceSize = Math.floor(displayParagraphs.length / pieceCount);
    const largerPieceCount = displayParagraphs.length % pieceCount;
    let cursor = 0;
    return Array.from({ length: pieceCount }, (_, pieceIndex) => {
      const currentPieceSize = basePieceSize + (pieceIndex < largerPieceCount ? 1 : 0);
      const startIndex = cursor;
      const members = displayParagraphs.slice(startIndex, startIndex + currentPieceSize);
      cursor += currentPieceSize;
      if (!members.length) return null;
      const endIndex = startIndex + members.length - 1;
      const evidenceSource = members[0];
      const evidenceKey = `${currentLessonNumber}-${evidenceSource.passageId}-${evidenceSource.localIndex}`;
      return {
        id: `${currentLessonNumber}-piece-${pieceIndex + 1}`,
        number: pieceIndex + 1,
        startIndex,
        endIndex,
        text: members.map((paragraph) => paragraph.text).join("\n\n"),
        arabicTranslation: members.map((paragraph) => paragraph.arabicTranslation).join("\n\n"),
        bookQuestions: members.flatMap((paragraph) => paragraph.bookQuestions || []),
        jreQuestions: members.map((paragraph) => paragraph.jreQuestion).filter(Boolean),
        evidenceQuote: evidenceMap[evidenceKey] || firstSentence(evidenceSource.text),
        kinds: Array.from(new Set(members.map((paragraph) => paragraph.passageKind))),
        segments: members.map((paragraph, memberIndex) => ({ sourceIndex: startIndex + memberIndex, text: paragraph.text })),
      };
    }).filter((piece): piece is LessonPiece => Boolean(piece && piece.text.trim().length > 0));
  }, [displayParagraphs, currentLessonNumber]);

  const totalBookQuestions = lessonPieces.reduce((sum, piece) => sum + piece.bookQuestions.length, 0);
  const activeText = displayParagraphs[activeParagraph];

  useEffect(() => {
    setSelectedPassageId(selectedLesson.passages[0]?.id || "");
    setActiveParagraph(0);
    setOpenTranslations({});
  }, [selectedLessonId]);

  useEffect(() => {
    setActiveParagraph(0);
    setAudioProgress(0);
    setIsPlaying(false);
    setIsDeviceVoice(false);
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [selectedPassageId, selectedLessonId]);

  useEffect(() => {
    window.localStorage.setItem("efl-reader-student-answers", JSON.stringify(studentAnswers));
  }, [studentAnswers]);

  useEffect(() => {
    window.localStorage.setItem("efl-reader-mission-evidence", JSON.stringify(missionEvidence));
  }, [missionEvidence]);

  const chooseLesson = (id: string) => {
    setSelectedLessonId(id);
    setSelectedPassageId("");
  };

  const chooseUnit = (unit: string) => {
    const firstLesson = lessons.find((lesson) => lessonUnit(lesson) === unit);
    setSelectedUnit(unit);
    if (firstLesson) chooseLesson(lessonNumber(firstLesson));
  };

  const stopAll = () => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setIsDeviceVoice(false);
  };

  const readWithDeviceVoice = (startAt = 0, stopAt = displayParagraphs.length) => {
    if (!displayParagraphs.length) return;
    window.speechSynthesis?.cancel();
    setIsDeviceVoice(true);
    setIsPlaying(true);

    const speakNext = (index: number) => {
      if (index >= stopAt || index >= displayParagraphs.length) {
        setIsPlaying(false);
        setIsDeviceVoice(false);
        return;
      }
      setActiveParagraph(index);
      const utterance = new SpeechSynthesisUtterance(displayParagraphs[index].text);
      utterance.lang = "en-US";
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.onend = () => speakNext(index + 1);
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsDeviceVoice(false);
      };
      window.speechSynthesis.speak(utterance);
    };
    speakNext(startAt);
  };

  const playCurrent = () => {
    if (isPlaying) {
      stopAll();
      return;
    }
    if (hasTrackedAudio && audioRef.current) {
      setIsDeviceVoice(false);
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }
    readWithDeviceVoice(activeParagraph);
  };

  const seekParagraph = (index: number) => {
    const target = displayParagraphs[index];
    if (!target) return;
    if (target.passageId !== selectedPassage?.id) setSelectedPassageId(target.passageId);
    setActiveParagraph(index);
    if (target.passageId === selectedPassage?.id && hasOriginalAudio && audioRef.current && typeof target.start === "number") {
      audioRef.current.currentTime = target.start || 0;
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !displayParagraphs.length) return;
    const current = audio.currentTime;
    const audioParagraphs = displayParagraphs.map((paragraph, index) => ({ paragraph, index })).filter(({ paragraph }) => paragraph.passageId === selectedPassage?.id);
    const nextIndex = audioParagraphs.find(({ paragraph }, index) => {
      const next = audioParagraphs[index + 1]?.paragraph;
      return current >= (paragraph.start ?? 0) && current < (next?.start ?? paragraph.end ?? Number.POSITIVE_INFINITY);
    });
    if (nextIndex) setActiveParagraph(nextIndex.index);
    if (audio.duration) setAudioProgress((current / audio.duration) * 100);
  };

  const updateStudentAnswer = (key: string, value: string) => {
    setStudentAnswers((current) => ({ ...current, [key]: value }));
  };

  const jumpToPiece = (pieceId: string) => {
    document.getElementById(pieceId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#F6F1E7] text-[#132B36]" dir="ltr">
      <audio
        ref={audioRef}
        src={audioSource}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setAudioProgress(100);
        }}
      />

      <header className="sticky top-0 z-30 border-b border-[#E8E4DD] bg-[#FCFBF7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-3 py-2.5 sm:px-7 sm:py-3">
          <div className="flex items-center gap-2.5" dir="ltr">
            <img src="/assets/gps-logo.png" alt="GPS" className="h-10 w-auto object-contain mix-blend-multiply dark:mix-blend-normal sm:h-14" />
            <span className="rounded-full border border-[#BFE4E8] bg-[#F1FBFC] px-2.5 py-1 font-['DM_Sans'] text-[10px] font-bold tracking-[0.12em] text-[#087E8B] sm:hidden">EFL READER</span>
          </div>
          <span className="rounded-full bg-[#EDF8F6] px-3 py-1.5 text-xs font-bold text-[#087E8B] sm:hidden" dir="ltr">U{selectedUnit} · L{currentLessonNumber}</span>
        </div>
      </header>

      <div className="sticky top-[61px] z-20 border-b border-[#D8D0C1] bg-[#FCFBF7]/95 px-3 py-2.5 backdrop-blur lg:hidden">
        <Sheet>
          <SheetTrigger asChild><button className="flex w-full items-center justify-between rounded-2xl border border-[#96D9DC] bg-[#F0FBFC] px-4 py-3.5 text-sm font-bold text-[#176E9C] shadow-[0_8px_18px_rgba(8,126,139,0.09)] active:scale-[0.985]" dir="rtl"><span className="flex items-center gap-3 text-right"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#087E8B] text-white shadow-sm"><BookOpen size={18} /></span><span><span className="block">اختَر الوحدة والدرس</span><span className="mt-0.5 block max-w-[210px] truncate text-xs font-medium text-[#4A7F8A]">{selectedLesson.title}</span></span></span><ChevronRight size={20} /></button></SheetTrigger>
          <SheetContent side="left" className="w-[92vw] gap-0 overflow-y-auto border-r border-[#D8D0C1] bg-[#F6F1E7] p-0 sm:w-[430px]">
            <SheetHeader className="border-b border-[#D8D0C1] bg-[#FCFBF7] pr-12 text-right"><SheetTitle dir="rtl">الوحدات والدروس</SheetTitle><p className="text-right text-xs text-[#60706B]" dir="rtl">اختَر الدرس، ثم ابدأ القراءة خطوة بخطوة.</p></SheetHeader>
            <MobileCourseTabs selectedUnit={selectedUnit} selectedLessonId={selectedLessonId} onChooseUnit={chooseUnit} onChooseLesson={chooseLesson} />
          </SheetContent>
        </Sheet>
      </div>

      <main className="mx-auto grid max-w-[1600px] gap-0 px-0 lg:grid-cols-[332px_minmax(0,1fr)] lg:px-5">
        <aside className="hidden border-b border-[#D8D0C1] bg-[#ECE5D7] p-4 lg:sticky lg:top-[69px] lg:block lg:h-[calc(100vh-69px)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#132B36]" dir="rtl">الوحدات والدروس</h2>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full border border-[#D1C5B0] bg-[#F6F1E7] text-[#C66D37]">
              <BookOpen size={17} />
            </div>
          </div>

          <Accordion type="single" collapsible value={`unit-${selectedUnit}`} onValueChange={(value) => { if (value) chooseUnit(value.replace("unit-", "")); }} className="relative space-y-2 before:absolute before:bottom-7 before:left-7 before:top-7 before:w-px before:bg-[#087E8B]/35">
            {Object.keys(unitMeta).map((unit) => {
              const activeUnit = selectedUnit === unit;
              const lessonsForUnit = lessons.filter((lesson) => lessonUnit(lesson) === unit);
              return <AccordionItem key={unit} value={`unit-${unit}`} className={`relative z-10 overflow-hidden rounded-2xl border ${activeUnit ? "border-[#087E8B] bg-[#F4FBF9] shadow-[0_8px_18px_rgba(8,126,139,0.1)]" : "border-[#D8D0C1] bg-[#F8F3E9]"}`}>
                <AccordionTrigger className="px-4 py-3 no-underline hover:no-underline"><span className="flex items-center gap-3 text-left"><span className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#F6F1E7] text-sm font-bold shadow-sm ${activeUnit ? "bg-[#087E8B] text-white" : "bg-[#E7DED0] text-[#53605C]"}`}>{unit}</span><span><span className="block font-['DM_Sans'] text-sm font-bold text-[#263D47]">{unitMeta[unit].title}</span><span className="mt-0.5 block text-right text-xs text-[#68746F]" dir="rtl">{unitMeta[unit].arabic}</span></span></span></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  {unitImages[unit] && <img src={unitImages[unit]} alt="" className="mb-3 h-20 w-full rounded-xl object-cover" />}
                  <div className="space-y-1.5">{lessonsForUnit.map((lesson, index) => { const id = lessonNumber(lesson); const activeLesson = id === selectedLessonId; const suppliedAudio = Boolean(originalAudio[id]); return <button key={id} onClick={() => chooseLesson(id)} className={`w-full rounded-xl border p-3 text-left transition ${activeLesson ? "border-[#E52A34] bg-white shadow-sm" : "border-transparent hover:border-[#B9DDF0] hover:bg-white/70"}`}><div className="flex items-start gap-3"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${activeLesson ? "bg-[#E52A34] text-white" : "bg-[#E8EFF2] text-[#3A6578]"}`}>{index + 1}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="font-['DM_Sans'] text-[11px] font-bold text-[#1A9DD8]">Lesson {id}</span>{suppliedAudio && <Headphones size={14} className="text-[#E52A34]" />}</div><p className="mt-1 text-sm font-semibold leading-snug text-[#263D47]">{lesson.title}</p></div></div></button>; })}</div>
                </AccordionContent>
              </AccordionItem>;
            })}
          </Accordion>

        </aside>

        <section className="min-w-0 px-3 py-5 pb-24 text-left sm:px-7 lg:px-10 lg:py-8">
          <div className="mb-6 px-1 sm:mb-7">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2.5 font-['DM_Sans'] text-[10px] font-bold uppercase tracking-[0.14em] sm:gap-4 sm:text-[11px]" dir="ltr">
                <span className="border-l-2 border-[#087E8B] pl-2 text-[#087E8B]">Unit {selectedUnit}</span>
                <span className="border-l-2 border-[#C7B99F] pl-2 text-[#60706B]">Lesson {currentLessonNumber}</span>
                <span className="border-l-2 border-[#C66D37] pl-2 text-[#B65D2D]">{selectedPassage?.kind === "listening" ? "Listening" : "Reading"}</span>
              </div>
              <h2 className="max-w-4xl font-['DM_Sans'] text-[26px] font-bold leading-[1.05] tracking-tight text-[#132B36] sm:text-4xl" dir="ltr">{selectedLesson.title}</h2>
            </div>
          </div>

          <div className="mb-6 grid gap-3 rounded-[22px] bg-[#132B36] p-3.5 text-white shadow-[0_14px_35px_rgba(19,43,54,0.18)] md:mb-7 md:grid-cols-[auto_1fr_auto] md:items-center md:p-4" dir="ltr">
            <Button onClick={playCurrent} className="min-h-13 h-13 w-full rounded-2xl bg-[#087E8B] px-5 text-white shadow-[0_7px_16px_rgba(0,0,0,0.16)] hover:bg-[#066A74] md:h-12 md:w-auto md:rounded-xl">
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? "إيقاف مؤقت" : hasOriginalAudio ? "استمع للتسجيل" : hasGeneratedAudio ? "استمع للقراءة" : "اقرأ معي"}
            </Button>
            <div className="min-w-0 px-1">
              <div className="mb-2 flex justify-between gap-4 text-xs font-medium text-[#DDEAE8]"><span>{hasOriginalAudio || hasGeneratedAudio ? "Listen, pause, then find the evidence." : "Read, pause, then open the translation."}</span><span>{Math.round(audioProgress)}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#7FD2C8] transition-[width] duration-150" style={{ width: `${hasOriginalAudio ? audioProgress : ((activeParagraph + 1) / Math.max(displayParagraphs.length, 1)) * 100}%` }} /></div>
            </div>
            <Button variant="ghost" onClick={() => { stopAll(); setAudioProgress(0); setActiveParagraph(0); if (audioRef.current) audioRef.current.currentTime = 0; }} className="h-10 w-full rounded-xl border border-white/10 text-[#E4F4F1] hover:bg-white/10 hover:text-white md:w-auto"><RotateCcw size={17} /> Reset</Button>
          </div>

          <div className="mb-6 rounded-2xl border border-[#DDD4C4] bg-[#FBF8F1] p-3.5 sm:mb-7 sm:p-4">
            <ToggleRow label="سؤال الفهم" enabled={showBookQuestions} onChange={setShowBookQuestions} icon={<ListChecks size={16} />} />
          </div>

          <AnswerFrame />

          <div className="mb-4 flex items-center justify-between gap-4 px-1 sm:mb-5">
            <div><p className="font-['DM_Sans'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#1A9DD8]">Lesson in focus</p><h3 className="mt-1 text-xl font-bold text-[#132B36]" dir="ltr">Read in five focused sections.</h3></div>
            <span className="hidden rounded-full bg-[#E5F4FC] px-3 py-1 text-xs font-bold text-[#1878B4] sm:inline">{lessonPieces.length} sections</span>
          </div>

          <div className="relative mb-5 flex gap-2 overflow-x-auto px-1 pb-1 before:absolute before:left-5 before:right-5 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-[#087E8B]/30 lg:hidden" aria-label="التنقل بين أجزاء الدرس" dir="ltr">
            {lessonPieces.map((piece) => <button key={`jump-${piece.id}`} onClick={() => jumpToPiece(piece.id)} className={`relative z-10 grid h-10 min-w-10 place-items-center rounded-full border text-xs font-bold shadow-sm transition active:scale-95 ${activeParagraph >= piece.startIndex && activeParagraph <= piece.endIndex ? "border-[#087E8B] bg-[#087E8B] text-white" : "border-[#C9DDD8] bg-[#FFFCF6] text-[#087E8B]"}`}>{piece.number}</button>)}
          </div>

          <div className="space-y-5">
            {lessonPieces.map((piece, index) => {
              const active = activeParagraph >= piece.startIndex && activeParagraph <= piece.endIndex;
              const evidenceKey = piece.id;
              const isEvidenceRevealed = Boolean(revealedEvidence[evidenceKey]);
              const singleQuestion = piece.bookQuestions[0] || piece.jreQuestions[0] || "What is the main idea of this part?";
              const capturedEvidence = missionEvidence[piece.id] || "";
              const tone = [
                { surface: "border-[#9BD6EC] bg-[#FFFDF8]", stripe: "bg-[#1A9DD8]", badge: "bg-[#D8F1FC] text-[#176E9C]" },
                { surface: "border-[#E9B7D4] bg-[#FFFDF8]", stripe: "bg-[#D83A9D]", badge: "bg-[#FCE6F4] text-[#A83075]" },
                { surface: "border-[#EACE79] bg-[#FFFDF8]", stripe: "bg-[#C99008]", badge: "bg-[#FFF1BE] text-[#8C6500]" },
                { surface: "border-[#9DD9CB] bg-[#FFFDF8]", stripe: "bg-[#087E8B]", badge: "bg-[#DDF3ED] text-[#087E8B]" },
                { surface: "border-[#F0B5BA] bg-[#FFFDF8]", stripe: "bg-[#E52A34]", badge: "bg-[#FFE4E6] text-[#BE2530]" },
              ][index % 5];
              return (
                <article id={piece.id} key={piece.id} onClick={() => seekParagraph(piece.startIndex)} className={`group relative scroll-mt-36 overflow-hidden rounded-[22px] border p-4 transition-all duration-200 sm:rounded-[24px] sm:p-6 ${tone.surface} ${active ? "scale-[1.005] shadow-[0_18px_38px_rgba(20,65,83,0.18)] ring-2 ring-[#1A9DD8]/25" : "hover:shadow-[0_10px_24px_rgba(20,65,83,0.08)]"}`}>
                  <div className={`absolute inset-y-0 left-0 w-1.5 ${tone.stripe} ${active ? "opacity-100" : "opacity-35"}`} />
                  <div className="mb-4 flex items-center justify-between gap-3" dir="ltr">
                    <button onClick={(event) => { event.stopPropagation(); seekParagraph(piece.startIndex); if (!hasOriginalAudio) readWithDeviceVoice(piece.startIndex, piece.endIndex + 1); }} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${tone.badge}`}>
                      {active && isPlaying ? <AudioLines size={14} className="animate-pulse" /> : <Volume2 size={14} />}
                      {piece.kinds.includes("listening") ? "استمع لهذه الفقرة" : "اقرأ هذه الفقرة"}
                    </button>
                    <span className={`rounded-full px-3 py-1 font-['DM_Sans'] text-[11px] font-bold tracking-[0.15em] ${tone.badge}`}>PART {String(piece.number).padStart(2, "0")}</span>
                  </div>
                  <div className="space-y-4">
                    {piece.segments.map((segment) => <ReadingSegment key={`${piece.id}-${segment.sourceIndex}`} text={segment.text} evidenceQuote={piece.evidenceQuote} evidenceRevealed={isEvidenceRevealed} active={segment.sourceIndex === activeParagraph} captureMode={Boolean(lensActive[piece.id])} captured={capturedEvidence === segment.text} onCapture={() => { setMissionEvidence((current) => ({ ...current, [piece.id]: segment.text })); setLensActive((current) => ({ ...current, [piece.id]: false })); setRevealedEvidence((current) => ({ ...current, [evidenceKey]: true })); }} />)}
                  </div>
                  <div className="mt-5" dir="rtl">
                    <button onClick={(event) => { event.stopPropagation(); setOpenTranslations((current) => ({ ...current, [piece.id]: !current[piece.id] })); }} aria-expanded={Boolean(openTranslations[piece.id])} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-right text-sm font-bold transition ${openTranslations[piece.id] ? "border-[#D9A915] bg-[#FFF8D8] text-[#805D00]" : "border-white/80 bg-white/70 text-[#455652] hover:border-[#E2C56A] hover:bg-[#FFFDF1]"}`}><span className="flex items-center gap-2"><Languages size={17} />{openTranslations[piece.id] ? "إخفاء الترجمة" : "اضغط لإظهار الترجمة"}</span><ChevronDown size={18} className={`transition-transform duration-200 ${openTranslations[piece.id] ? "rotate-180" : ""}`} /></button>
                    {openTranslations[piece.id] && <div className="mt-3 border-r-2 border-[#F0B51A] bg-white/65 px-4 py-3 text-right" dir="rtl"><p className="mb-1 text-[11px] font-bold tracking-[0.12em] text-[#A66300]">الترجمة العربية</p><p className="whitespace-pre-line leading-8 text-[#445955]">{piece.arabicTranslation}</p></div>}
                  </div>
                  {showBookQuestions && <Accordion type="single" collapsible className="mt-5 rounded-2xl border border-white/80 bg-white/60 px-4">
                    <AccordionItem value={piece.id} className="border-0">
                      <AccordionTrigger className="py-3 no-underline hover:no-underline"><span className="flex items-center gap-2 text-sm font-bold text-[#263D47]" dir="rtl"><ListChecks size={17} className="text-[#E52A34]" />سؤال الفهم</span><span className="mr-2 text-xs font-medium text-[#66736F]">اضغط للتفكير والإجابة</span></AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <EvidenceMission question={singleQuestion} evidence={capturedEvidence} lensActive={Boolean(lensActive[piece.id])} onStartLens={() => setLensActive((current) => ({ ...current, [piece.id]: !current[piece.id] }))} claim={studentAnswers[`${piece.id}-claim`] || ""} reason={studentAnswers[`${piece.id}-reason`] || ""} onAnswerChange={updateStudentAnswer} answerPrefix={piece.id} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>}
                </article>
              );
            })}
          </div>

          {totalBookQuestions === 0 && <div className="mt-5 rounded-2xl border border-dashed border-[#D8D0C1] bg-[#FBF8F1] p-5 text-center text-sm text-[#64716C]">لا توجد أسئلة مرتبطة مباشرة بهذه الفقرة في الصفحات المستخرجة. استخدمي سؤال JRE لبدء المناقشة.</div>}

        </section>
      </main>
    </div>
  );
}

function AnswerFrame() {
  return <div className="mb-7 rounded-[22px] border border-[#B9D6D1] bg-[#EAF5F2] p-5 shadow-[0_10px_26px_rgba(20,65,83,0.06)] sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-['DM_Sans'] text-[11px] font-bold uppercase tracking-[0.16em] text-[#087E8B]">JRE answer frame</p><h4 className="mt-1 text-lg font-bold text-[#173B42]" dir="rtl">الرأي ← السبب ← الدليل من النص</h4><p className="mt-1 text-right text-sm leading-6 text-[#4F6A68]" dir="rtl">اكتب رأيك، ثم فسّر السبب، ثم اختر الجملة التي تدعمه من النص.</p></div>
      <div className="flex shrink-0 flex-wrap gap-2" dir="ltr"><span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#087E8B] shadow-sm">I think…</span><ChevronDown className="self-center text-[#087E8B]" size={17} /><span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#087E8B] shadow-sm">because…</span><ChevronDown className="self-center text-[#087E8B]" size={17} /><span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#087E8B] shadow-sm">the text says…</span></div>
    </div>
  </div>;
}

function ToggleRow({ label, enabled, onChange, icon }: { label: string; enabled: boolean; onChange: (value: boolean) => void; icon: React.ReactNode }) {
  return <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-[#F1ECE1]"><span className="flex items-center gap-2 text-sm font-semibold text-[#455652]">{icon}{label}</span><Switch checked={enabled} onCheckedChange={onChange} /></label>;
}

function EvidenceMission({ question, evidence, lensActive, onStartLens, claim, reason, onAnswerChange, answerPrefix }: { question: string; evidence: string; lensActive: boolean; onStartLens: () => void; claim: string; reason: string; onAnswerChange: (key: string, value: string) => void; answerPrefix: string }) {
  const complete = [claim, reason, evidence].every((item) => item.trim().length > 0);
  return <div className="rounded-2xl border border-[#83CFE8] bg-[#F0FBFF] p-4"><p className="font-['Source_Serif_4'] text-base leading-7 text-[#243D47]" dir="ltr">{question}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><MissionField hint="I think…" value={claim} onChange={(value) => onAnswerChange(`${answerPrefix}-claim`, value)} /><MissionField hint="because…" value={reason} onChange={(value) => onAnswerChange(`${answerPrefix}-reason`, value)} /></div><div className="mt-4 rounded-xl border border-dashed border-[#5BBDE6] bg-white/70 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-right text-sm text-[#52717E]" dir="rtl">اختر الجملة التي تدعم إجابتك من النص.</p><button onClick={onStartLens} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${lensActive ? "bg-[#E52A34] text-white" : "bg-[#1A9DD8] text-white hover:bg-[#167EB0]"}`}><Search size={16} />{lensActive ? "اختر الجملة" : "ابحث في النص"}</button></div></div>{complete && <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#E8F7EF] px-3 py-2 text-sm font-bold text-[#287353]" dir="rtl"><CheckCircle2 size={17} />إجابتك جاهزة.</div>}</div>;
}

function MissionField({ hint, value, onChange }: { hint: string; value: string; onChange: (value: string) => void }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={hint} className="w-full rounded-xl border border-[#D5E5EB] bg-white/75 px-3 py-3 font-['Source_Serif_4'] text-base text-[#243D47] outline-none placeholder:text-[#8EA0A6] focus:border-[#1A9DD8] focus:ring-2 focus:ring-[#C7E9F6]" dir="ltr" />;
}

function Step({ label, text }: { label: string; text: string }) {
  return <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#5A4A55]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#E83D9E] text-[10px] text-white">{label}</span>{text}</div>;
}

function MobileCourseTabs({ selectedUnit, selectedLessonId, onChooseUnit, onChooseLesson }: { selectedUnit: string; selectedLessonId: string; onChooseUnit: (unit: string) => void; onChooseLesson: (lesson: string) => void }) {
  return <div className="p-4"><Accordion type="single" collapsible value={`unit-${selectedUnit}`} onValueChange={(value) => { if (value) onChooseUnit(value.replace("unit-", "")); }} className="space-y-2">{Object.keys(unitMeta).map((unit) => { const activeUnit = selectedUnit === unit; const lessonsForUnit = lessons.filter((lesson) => lessonUnit(lesson) === unit); return <AccordionItem key={unit} value={`unit-${unit}`} className={`overflow-hidden rounded-2xl border ${activeUnit ? "border-[#1A9DD8] bg-[#F4FBFF]" : "border-[#D8D0C1] bg-[#FFFDF8]"}`}><AccordionTrigger className="px-4 py-3 no-underline hover:no-underline"><span className="flex items-center gap-3 text-left"><span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${activeUnit ? "bg-[#1A9DD8] text-white" : "bg-[#E7DED0] text-[#53605C]"}`}>{unit}</span><span><span className="block text-sm font-bold text-[#263D47]">{unitMeta[unit].title}</span><span className="block text-right text-xs text-[#68746F]" dir="rtl">{unitMeta[unit].arabic}</span></span></span></AccordionTrigger><AccordionContent className="px-3 pb-3"><div className="space-y-1.5">{lessonsForUnit.map((lesson, index) => { const id = lessonNumber(lesson); const activeLesson = id === selectedLessonId; return <button key={id} onClick={() => onChooseLesson(id)} className={`w-full rounded-xl border p-3 text-left ${activeLesson ? "border-[#E52A34] bg-white" : "border-transparent bg-white/55"}`}><div className="flex items-center gap-3"><span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${activeLesson ? "bg-[#E52A34] text-white" : "bg-[#E8EFF2] text-[#3A6578]"}`}>{index + 1}</span><span className="text-sm font-semibold leading-snug text-[#263D47]">{lesson.title}</span></div></button>; })}</div></AccordionContent></AccordionItem>; })}</Accordion></div>;
}

function StudentAnswerBox({ answerKey, value, onChange, compact = false }: { answerKey: string; value: string; onChange: (key: string, value: string) => void; compact?: boolean }) {
  return <div className={`mt-3 rounded-xl border border-[#E8C9AB] bg-white/80 p-3 ${compact ? "" : ""}`}><div className="mb-2 flex items-center justify-between gap-3"><span className="font-['DM_Sans'] text-[10px] font-bold uppercase tracking-[0.13em] text-[#A9572B]">Student answer</span><span className="text-[10px] text-[#8E7E70]">Saved on this device</span></div><textarea value={value} onChange={(event) => onChange(answerKey, event.target.value)} placeholder="Write your answer, reason, and evidence from the text…" className={`w-full resize-y rounded-lg border border-[#E4D6C6] bg-[#FFFEFA] px-3 py-2 font-['Source_Serif_4'] text-sm leading-6 text-[#3E3933] outline-none transition placeholder:text-[#A99F94] focus:border-[#A9572B] focus:ring-2 focus:ring-[#F0C9AA]/50 ${compact ? "min-h-20" : "min-h-28"}`} dir="ltr" /></div>;
}

function firstSentence(text: string) {
  return text.split(/(?<=[.!?])\s+/).find((sentence) => sentence.trim().length > 12)?.trim() || text.slice(0, 180).trim();
}

function EvidenceText({ text, quote, revealed }: { text: string; quote: string; revealed: boolean }) {
  if (!revealed || !quote) return <p className="font-['Source_Serif_4'] text-xl leading-[1.7] text-[#1C343C] sm:text-[22px]" dir="ltr">{text}</p>;
  const expression = new RegExp(escapeRegExp(quote).replace(/\s+/g, "\\s+"), "i");
  const match = expression.exec(text);
  if (!match || typeof match.index !== "number") return <p className="font-['Source_Serif_4'] text-xl leading-[1.7] text-[#1C343C] sm:text-[22px]" dir="ltr">{text}</p>;
  const before = text.slice(0, match.index);
  const evidence = text.slice(match.index, match.index + match[0].length);
  const after = text.slice(match.index + match[0].length);
  return <p className="font-['Source_Serif_4'] text-xl leading-[1.7] text-[#1C343C] sm:text-[22px]" dir="ltr">{before}<mark className="rounded-md bg-[#BDE9E1] px-1.5 py-0.5 font-semibold text-[#124C4F] shadow-[inset_0_-2px_0_#087E8B]">{evidence}</mark>{after}</p>;
}

function ReadingSegment({ text, evidenceQuote, evidenceRevealed, active, captureMode, captured, onCapture }: { text: string; evidenceQuote: string; evidenceRevealed: boolean; active: boolean; captureMode: boolean; captured: boolean; onCapture: () => void }) {
  const baseClass = `rounded-xl px-3 py-2 font-['Source_Serif_4'] text-xl leading-[1.7] transition-all duration-300 sm:text-[22px] ${active ? "bg-white/80 text-[#153B50] shadow-[0_6px_18px_rgba(26,157,216,0.15)] ring-1 ring-[#1A9DD8]/30" : "text-[#263D47]"} ${captured ? "ring-2 ring-[#F0B51A] bg-[#FFF9D9]" : ""}`;
  if (!evidenceRevealed || !evidenceQuote) return captureMode ? <button onClick={(event) => { event.stopPropagation(); onCapture(); }} className={`${baseClass} w-full border border-dashed border-[#1A9DD8] text-left hover:bg-[#EAF8FF]`} dir="ltr">{text}<span className="ml-2 text-xs font-bold text-[#176E9C]">Capture this evidence</span></button> : <p className={baseClass} dir="ltr">{text}</p>;
  const expression = new RegExp(escapeRegExp(evidenceQuote).replace(/\s+/g, "\\s+"), "i");
  const match = expression.exec(text);
  if (!match || typeof match.index !== "number") return captureMode ? <button onClick={(event) => { event.stopPropagation(); onCapture(); }} className={`${baseClass} w-full border border-dashed border-[#1A9DD8] text-left hover:bg-[#EAF8FF]`} dir="ltr">{text}<span className="ml-2 text-xs font-bold text-[#176E9C]">Capture this evidence</span></button> : <p className={baseClass} dir="ltr">{text}</p>;
  const before = text.slice(0, match.index);
  const evidence = text.slice(match.index, match.index + match[0].length);
  const after = text.slice(match.index + match[0].length);
  const content = <>{before}<mark className="rounded-md bg-[#FFF0A8] px-1.5 py-0.5 font-semibold text-[#765000] shadow-[inset_0_-2px_0_#F0B51A]">{evidence}</mark>{after}</>;
  return captureMode ? <button onClick={(event) => { event.stopPropagation(); onCapture(); }} className={`${baseClass} w-full border border-dashed border-[#1A9DD8] text-left hover:bg-[#EAF8FF]`} dir="ltr">{content}<span className="ml-2 text-xs font-bold text-[#176E9C]">Capture this evidence</span></button> : <p className={baseClass} dir="ltr">{content}</p>;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
