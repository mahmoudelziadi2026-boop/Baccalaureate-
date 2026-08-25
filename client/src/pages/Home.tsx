/**
 * Design: Baccalaureate Organizer landing — contemporary Egyptian learning field file with a mapped unit route.
 * Style reminder: deep navy night surfaces, warm paper daylight, Nile teal for actions, El-Moasser red as a precise publisher accent; logo never sits on a visible box.
 */
import { ArrowRight, BookOpen, Moon, Sparkles, Sun } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

const units = [
  { number: "01", title: "Living Well in a Complex World", arabic: "العيش بصحة في عالم معقد", image: "/assets/unit-1.jpg" },
  { number: "02", title: "Leisure Time", arabic: "وقت الفراغ", image: "/assets/unit-2.jpg" },
  { number: "03", title: "Echoes of the Past", arabic: "أصداء الماضي", image: "/assets/unit-3.jpg" },
  { number: "04", title: "The Power of Choice", arabic: "قوة الاختيار", image: "/assets/unit-4.jpg" },
  { number: "05", title: "The Greenhouse Effect", arabic: "الأثر البيئي", image: "/assets/unit-5.jpg" },
];

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark
    ? {
      page: "bg-[#081419] text-[#F6F3EA]",
      border: "border-white/10",
      title: "text-[#FAF7EF]",
      muted: "text-[#B9C9C6]",
      card: "border-white/10 bg-[#0E2027]/84",
      cardDivider: "border-white/10",
      surface: "bg-[#0C1A20]/80",
      route: "bg-[#63C7C2]",
      logo: "/assets/el-moasser.png",
      logoFrame: "from-[#0B1A20]/0 via-[#0B1A20]/0 to-[#0B1A20]/0",
    }
    : {
      page: "bg-[#FCFBF7] text-[#1C2025]",
      border: "border-[#E7E3DC]",
      title: "text-[#17232A]",
      muted: "text-[#58636A]",
      card: "border-[#E4E2DA] bg-white/88",
      cardDivider: "border-[#E7E3DC]",
      surface: "bg-white/65",
      route: "bg-[#087E8B]",
      logo: "/assets/el-moasser.png",
      logoFrame: "from-transparent via-transparent to-transparent",
    };

  return (
    <main className={`min-h-screen overflow-hidden ${colors.page}`} dir="ltr">
      <div className={`pointer-events-none fixed inset-0 ${isDark ? "opacity-100 [background-image:radial-gradient(circle_at_15%_8%,rgba(8,126,139,0.18),transparent_27%),radial-gradient(circle_at_88%_64%,rgba(229,42,52,0.12),transparent_26%),linear-gradient(135deg,#081419_0%,#0b1a20_54%,#081419_100%)]" : "opacity-45 [background-image:radial-gradient(rgba(8,126,139,0.18)_1px,transparent_1px)] [background-size:22px_22px]"}`} />
      <div className="relative mx-auto max-w-7xl px-5 py-5 sm:px-10 lg:px-12 lg:py-7">
        <header className={`flex items-center justify-between gap-4 border-b ${colors.border} pb-5`}>
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-14 w-40 shrink-0 overflow-hidden sm:h-16 sm:w-48"><div className={`absolute inset-0 bg-gradient-to-r ${colors.logoFrame}`} /><img src={colors.logo} alt="El-Moasser" className="absolute left-1/2 top-1/2 w-full max-w-none -translate-x-1/2 -translate-y-1/2 scale-[1.1] object-contain" /></div>
            <div className={`hidden border-l pl-4 sm:block ${isDark ? "border-white/12" : "border-[#E52A34]/25"}`}><p className="font-['DM_Sans'] text-[10px] font-bold uppercase tracking-[0.22em] text-[#23A9B6]">English language · Part 1</p><p className={`mt-1 font-['DM_Sans'] text-lg font-bold tracking-tight ${colors.title}`}>Baccalaureate Organizer</p></div>
          </div>
          <div className="flex items-center gap-3"><p className={`hidden text-right text-sm font-semibold md:block ${colors.muted}`} dir="rtl">منظّم كتاب البكالوريا</p><button onClick={toggleTheme} className={`grid h-11 w-11 place-items-center rounded-full border transition duration-200 hover:-translate-y-0.5 active:scale-[0.97] ${isDark ? "border-[#63C7C2]/35 bg-[#102B33] text-[#99E3DD] shadow-[0_8px_24px_rgba(0,0,0,0.22)]" : "border-[#9DD9D4] bg-[#EDF8F6] text-[#087E8B] shadow-[0_8px_20px_rgba(8,126,139,0.09)]"}`} aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button></div>
        </header>

        <div className="grid gap-10 py-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14 lg:py-14">
          <section className="lg:sticky lg:top-9 lg:self-start lg:pt-4">
            <div className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? "border-[#63C7C2]/25 bg-[#102B33]/65 text-[#9BE0D9]" : "border-[#087E8B]/15 bg-[#EAF7F5] text-[#087E8B]"}`}><Sparkles size={13} />Digital companion</div>
            <h1 className={`mt-5 font-['DM_Sans'] text-5xl font-bold leading-[0.9] tracking-[-0.065em] ${colors.title} sm:text-6xl`}><span className="block">Baccalaureate</span><span className="text-[#E52A34]">Organizer</span></h1>
            <div className={`mt-7 border-l-2 pl-5 ${isDark ? "border-[#63C7C2]" : "border-[#087E8B]"}`}><p className={`text-right text-lg leading-9 ${colors.muted}`} dir="rtl">قارئ منظّم يساعد الطالب والمعلم في دراسة كتاب اللغة الإنجليزية: استمع، توقّف، ثم ابحث عن الدليل من النص.</p></div>
            <div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/reader"><Button className="h-12 rounded-xl bg-[#087E8B] px-5 text-base text-white shadow-[0_12px_24px_rgba(8,126,139,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#066A74] active:scale-[0.97]">Start reading <ArrowRight size={18} /></Button></Link><span className={`flex items-center gap-2 border-b px-1 py-3 text-sm font-semibold ${colors.border} ${colors.muted}`}><BookOpen size={17} className="text-[#E52A34]" />5 units · 20 lessons</span></div>
          </section>

          <section aria-label="Units" className="relative pl-7 sm:pl-10">
            <div className={`absolute bottom-3 left-[9px] top-16 w-px ${colors.route}/35 sm:left-[15px]`} aria-hidden="true" />
            <div className="mb-5 flex items-end justify-between gap-4"><div><p className="font-['DM_Sans'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#C66D37]">Unit route</p><h2 className={`mt-1 font-['DM_Sans'] text-2xl font-bold ${colors.title}`} dir="rtl">اختَر ملف الوحدة.</h2></div><p className={`text-right text-sm ${colors.muted}`} dir="rtl">استمع، ترجم، ثم ابحث عن الدليل</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {units.map((unit, index) => (
                <Link key={unit.number} href="/reader" className={index === 0 || index === 4 ? "sm:col-span-2" : ""}>
                  <article className={`group relative overflow-visible border ${colors.card} ${index === 0 || index === 4 ? "sm:grid sm:grid-cols-[1.1fr_0.9fr]" : ""} shadow-[0_12px_28px_rgba(8,24,31,0.06)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#23A9B6]/65 hover:shadow-[0_20px_38px_rgba(8,126,139,0.14)] active:scale-[0.99]`}>
                    <span className={`absolute -left-10 top-5 grid h-6 w-6 place-items-center rounded-full border-2 text-[9px] font-bold tracking-[0.08em] text-white shadow-sm sm:-left-[50px] ${isDark ? "border-[#081419] bg-[#63C7C2]" : "border-[#FCFBF7] bg-[#087E8B]"}`}>{unit.number}</span>
                    <div className={`relative overflow-hidden ${index === 0 || index === 4 ? "aspect-[16/8] sm:order-2 sm:aspect-auto sm:min-h-48" : "aspect-[4/3]"}`}><img src={unit.image} alt={`Unit ${unit.number}: ${unit.title}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]" /><div className="absolute inset-0 bg-gradient-to-t from-[#071920]/70 via-transparent to-transparent" /><p className="absolute bottom-3 right-4 text-right text-sm font-semibold text-white drop-shadow" dir="rtl">{unit.arabic}</p></div>
                    <div className={`flex items-start justify-between gap-3 border-t px-5 py-4 sm:border-t-0 ${colors.cardDivider}`}><div><p className="font-['DM_Sans'] text-[10px] font-bold uppercase tracking-[0.16em] text-[#087E8B]">Dossier · Unit {unit.number}</p><h3 className={`mt-1 font-['DM_Sans'] text-base font-bold leading-snug ${colors.title} sm:text-lg`}>{unit.title}</h3></div><ArrowRight size={18} className="mt-4 shrink-0 text-[#23A9B6] transition duration-200 group-hover:translate-x-1" /></div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <footer className={`flex flex-col gap-3 border-t ${colors.border} py-5 sm:flex-row sm:items-center sm:justify-between`}><p className={`text-right text-sm font-semibold ${colors.muted}`} dir="rtl">الكتاب: اللغة الإنجليزية للبكالوريا · الجزء الأول</p><p className={`font-['DM_Sans'] text-[10px] font-bold uppercase tracking-[0.16em] ${colors.muted}`}>El-Moasser digital companion</p></footer>
      </div>
    </main>
  );
}
