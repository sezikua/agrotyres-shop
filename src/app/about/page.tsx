import type { Metadata } from "next";
import { headers } from "next/headers";

// Метадані формуються динамічно через generateMetadata нижче

async function getBaseUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl();
  const canonical = `${baseUrl}/about`;
  return {
    title: "Про нас — CEAT — офіційний імпортер в Україні",
    description:
      "CEAT — офіційний імпортер в Україні: 15+ років досвіду, 500+ позицій шин на складі, інвестиції >2 млн євро в асортимент, 200 фахівців сервісу.",
    alternates: { canonical },
    openGraph: {
      title: "Про нас — CEAT — офіційний імпортер в Україні",
      description:
        "CEAT — офіційний імпортер в Україні: 15+ років досвіду, 500+ позицій шин на складі, інвестиції >2 млн євро в асортимент, 200 фахівців сервісу.",
      url: canonical,
      type: "website",
      siteName: "CEAT — офіційний імпортер в Україні",
    },
    twitter: {
      card: "summary_large_image",
      title: "Про нас — CEAT — офіційний імпортер в Україні",
      description:
        "CEAT — офіційний імпортер в Україні: 15+ років досвіду, 500+ позицій шин на складі, інвестиції >2 млн євро в асортимент, 200 фахівців сервісу.",
    },
  };
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'support':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
          </svg>
        );
      case 'strength':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'economy':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'grip':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 p-6 hover:shadow-lg transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-[#008e4ed3]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative text-center">
        <div className="w-16 h-16 bg-[#008e4ed3] rounded-full flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform duration-300">
          {getIcon(icon)}
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-foreground/80 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ value, title, text }: { value: string; title: string; text: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 p-8 hover:shadow-lg transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-[#008e4ed3]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="text-4xl font-extrabold tracking-tight text-[#008e4ed3] mb-2">{value}</div>
        <div className="text-lg font-semibold mb-3">{title}</div>
        <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#008e4ed3]/10 via-transparent to-[#008e4ed3]/5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-[#008e4ed3] to-[#008E4E] bg-clip-text text-transparent">
              Про нас
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-foreground/80 leading-relaxed">
              Ласкаво просимо на наш сайт, де ТОВ &ldquo;Агро-Солар&rdquo; пропонує вам шини торгових марок CEAT, Trelleborg, Mitas для сільськогосподарських машин. Наше підприємство було засновано з метою надати ринку України високоякісні, надійні та доступні шини.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            value="500+" 
            title="Найменувань шин"
            text="Ваш вибір без компромісів: наш склад налічує понад 500 найменувань с/г шин, що дозволяє швидко підібрати ідеальне рішення для будь-якої техніки." 
          />
          <StatCard 
            value="2 000 000€" 
            title="Інвестицій"
            text="Гарантія якості та асортименту: більше 2 000 000 євро інвестицій у розширення асортименту шин — це наше зобов'язання перед вами щодо наявності найкращих пропозицій." 
          />
          <StatCard 
            value="15+" 
            title="Років досвіду"
            text="Досвід, що вимірюється роками: 15+ років на ринку сільгоспшин – це не просто цифра, це тисячі задоволених клієнтів та успішних сезонів." 
          />
          <StatCard 
            value="200" 
            title="Співробітників"
            text="Сила нашої команди: 200 відданих своїй справі співробітників — від консультантів до логістів — готові забезпечити першокласний сервіс." 
          />
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Зручні точки видачі та швидка доставка</h2>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Наші основні склади, стратегічно розташовані у Києві, Хмельницькому, дозволяють нам оперативно доставляти сільгосп шини до будь-якої точки України. Ми розуміємо, наскільки критичним є час для аграріїв, особливо в сезон, тому гарантуємо максимально швидке та надійне постачання, щоб ваша техніка не простоювала.
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#008e4ed3]/10 to-[#008E4E]/5 rounded-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#008e4ed3] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Швидка доставка</h3>
              <p className="text-foreground/70">До будь-якої точки України</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-gradient-to-br from-[#0054a6]/10 to-[#003d7a]/5 rounded-2xl p-8 order-2 lg:order-1">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#008e4ed3] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Широкий асортимент</h3>
              <p className="text-foreground/70">500+ найменувань шин</p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold mb-6">Широкий асортимент шин для будь-яких потреб</h2>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Ми пропонуємо величезний асортимент сільськогосподарських шин, який постійно оновлюється відповідно до новітніх технологій та вимог сучасного агровиробництва. Співпрацюємо виключно з провідними світовими виробниками, щоб ваша техніка отримувала лише найякісніші та найнадійніші шини, які витримають найскладніші польові умови.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-6">Ваш надійний партнер в агробізнесі</h2>
          <p className="text-lg text-foreground/80 leading-relaxed max-w-4xl mx-auto">
            Ми цінуємо кожного клієнта і прагнемо бути вашим довгостроковим партнером. Наша команда досвідчених фахівців завжди готова надати кваліфіковану консультацію, допомогти підібрати ідеальні шини саме для вашої техніки та конкретних задач, а також відповісти на будь-які питання, щоб ви могли прийняти обґрунтоване рішення та забезпечити максимальну продуктивність свого господарства.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Ми знаємося на цьому бізнесі</h2>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Ми розуміємо землю. Ми знаємо навантаження. Саме тому ми пропонуємо шини, які витримують найважчі умови та працюють безвідмовно — з сезону в сезон.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon="support"
            title="Підтримка"
            description="Професійна консультація, швидка доставка та сервіс, якому довіряють аграрії."
          />
          <FeatureCard 
            icon="strength"
            title="Міцність"
            description="Розроблені для важкої техніки та екстремальних польових умов."
          />
          <FeatureCard 
            icon="economy"
            title="Економія"
            description="Менше пробуксовки — більше заощаджень на пальному та зменшення зносу."
          />
          <FeatureCard 
            icon="grip"
            title="Зчеплення"
            description="Максимальна ефективність на будь-якому ґрунті — від м'якого ґрунту до складного рельєфу."
          />
        </div>
      </section>
    </div>
  );
}