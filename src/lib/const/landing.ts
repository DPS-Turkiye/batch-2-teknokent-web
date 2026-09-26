import {
  type LandingAnnouncement,
  type LandingFaq,
  type LandingHowStep,
  type LandingLink,
  LandingMock,
} from "@/types/landing";

export const LANDING_TITLE = "menton · ODTÜ Teknokent";

export const LANDING_NAV_LINKS: LandingLink[] = [
  { label: "Nasıl işler?", href: "#nasil" },
  { label: "Duyurular", href: "#duyurular" },
  { label: "Mentorluk mu, eğitim mi?", href: "#karsilastirma" },
  { label: "SSS", href: "#sss" },
];

export const LANDING_HERO = {
  eyebrow: "ODTÜ Teknokent",
  headline: "Girişiminiz için doğru desteğe, doğru zamanda ulaşın",
  accentPrefix: "doğru",
  lead: "ODTÜ Teknokent programlarını, mentorluk görüşmelerini, eğitimleri ve girişiminizin ilerleme sürecini tek bir platform üzerinden takip edin.",
  note: "Platforma yalnızca davet edildiğiniz veya kayıtlı olduğunuz rol ile giriş yapabilirsiniz.",
  sceneTitle: "3 adımda başla",
  sceneSteps: [
    "Profilini oluştur",
    "İhtiyacını tamamla",
    "Doğru mentor ile buluş",
  ],
  match: { title: "Eşleşme kuruldu", detail: "Nihan Öztürk · UX/UI & Ürün" },
} as const;

export const LANDING_PHOTOS = {
  nihan: "/landing/nihan-ozturk.jpg",
  cagri: "/landing/cagri-yilmaz.jpg",
  deniz: "/landing/deniz-aksoy.jpg",
} as const;

export const LANDING_ANNOUNCEMENTS: LandingAnnouncement[] = [
  {
    tag: "Başvuru",
    tone: "or",
    date: "27 Temmuz 2026",
    title: "Yeni dönem başvuruları açıldı",
    text: "Programın yeni başvuru tarihlerini ve katılım koşullarını inceleyin.",
    mock: LandingMock.Calendar,
  },
  {
    tag: "Eğitim",
    tone: "bl",
    date: "3 Ağustos 2026",
    title: "Ürün geliştirme eğitimi",
    text: "Ürün fikrinin doğrulanması ve ilk ürün sürecine yönelik grup eğitimi.",
    mock: LandingMock.Training,
  },
  {
    tag: "Destek programı",
    tone: null,
    date: "Başvurular açık",
    title: "TÜBİTAK BİGG başvuruları",
    text: "Başvuru sürecinde gerekli belgeleri ve takvimi program sayfasından takip edin.",
    mock: LandingMock.Checklist,
  },
];

export const LANDING_HOW_STEPS: LandingHowStep[] = [
  {
    title: "İhtiyacını belirt",
    text: "Destek almak istediğiniz konuyu ve mevcut probleminizi paylaşın.",
  },
  {
    title: "Uygun mentorla eşleş",
    text: "Uzmanlık alanınıza ve girişiminizin aşamasına uygun mentorla eşleşin.",
  },
  {
    title: "Görüşmeni gerçekleştir",
    text: "Görüşme sırasında ihtiyaçlarınızı, riskleri ve olası çözüm yollarını değerlendirin.",
  },
  {
    title: "Aksiyonlarını takip et",
    text: "Görüşme sonunda belirlenen görevleri ve sonraki adımları platform üzerinden takip edin.",
  },
];

/** Whose screen the "Nasıl işler?" stage shows: steps 2 and 3 are the mentor's, 1 and 4 the startup's. */
export const LANDING_MENTOR_STEPS = new Set([1, 2]);

export const LANDING_STAGE_ROLES = {
  mentor: { key: "mentor", label: "Mentor" },
  mentee: { key: "mentee", label: "Mentee / Startup" },
} as const;

/** How long each "Nasıl işler?" step stays on screen while it plays. */
export const LANDING_STEP_MS = 3700;

export const LANDING_TYPED_PROBLEM =
  "Onboarding akışımızda değer önerimizi ilk ekranda net anlatamıyoruz; kullanıcılar ilk adımda ayrılıyor.";

export const LANDING_TOPIC_CHIPS = [
  { label: "Ürün & UX", selected: true },
  { label: "Finans", selected: false },
  { label: "Değer önerisi", selected: true },
  { label: "MVP aşaması", selected: true },
  { label: "Hukuk", selected: false },
];

export const LANDING_MATCHES = [
  {
    name: "Nihan Öztürk",
    field: "UX/UI & Ürün Stratejisi",
    photo: LANDING_PHOTOS.nihan,
    pill: "Önerilen",
    selected: true,
  },
  {
    name: "Çağrı Yılmaz",
    field: "Finans & Business Model",
    photo: LANDING_PHOTOS.cagri,
    pill: "Müsait · Çar",
    selected: false,
  },
  {
    name: "Deniz Aksoy",
    field: "Büyüme Stratejisi",
    photo: LANDING_PHOTOS.deniz,
    pill: "2 slot",
    selected: false,
  },
];

export const LANDING_MATCH_REASON =
  "Ürün konumlandırma ve onboarding ihtiyacın, Nihan’ın erken aşama ekiplerle yürüttüğü value proposition çalışmalarıyla örtüşüyor.";

export const LANDING_AGENDA = [
  "Mevcut kullanıcı akışının gözden geçirilmesi",
  "Değer önerisi taslağının kritiği",
  "Riskler ve olası çözüm yolları",
  "Sonraki iki haftanın işleri",
];

export const LANDING_TASKS = [
  {
    title: "Finansal model taslağı",
    source: "Çağrı Yılmaz · mentorluk ödevi",
    status: "Yüklenmedi",
    tone: "or",
  },
  {
    title: "Acquisition kanalı analizi",
    source: "METU Stars · program ödevi",
    status: "Devam ediyor",
    tone: null,
  },
  {
    title: "B2B2C hipotezi",
    source: "Selin Kaya · mentorluk ödevi",
    status: "Tamamlandı",
    tone: "ok",
  },
] as const;

export const LANDING_COMPARE = {
  mentoring: {
    title: "Mentorluk",
    text: "Girişimin mevcut durumuna ve ihtiyacına göre şekillenen; bireysel veya ekip odaklı destek sürecidir.",
    points: [
      "Girişime özel ilerler",
      "Problem ve karar odaklıdır",
      "Birebir veya küçük ekip görüşmesi",
      "Görüşme sonunda aksiyonlar oluşturulabilir",
    ],
  },
  training: {
    title: "Eğitim",
    text: "Belirli bir konuda bilgi ve beceri kazandırmak için hazırlanan yapılandırılmış içeriklerden oluşur.",
    points: [
      "Belirli bir konuya odaklanır",
      "Bireysel veya grup olarak düzenlenebilir",
      "Online veya yüz yüze gerçekleştirilebilir",
      "Ödev ve eğitim materyalleri içerebilir",
    ],
  },
} as const;

/** The "Hangi desteğe ihtiyacım olduğunu nasıl anlarım?" link opens this answer. */
export const LANDING_FAQ_DIFFERENCE_INDEX = 3;

export const LANDING_FAQS: LandingFaq[] = [
  {
    question: "Platforma kimler giriş yapabilir?",
    answer:
      "Platforma ODTÜ Teknokent programlarına kabul edilen girişimler ile program ekibi tarafından davet edilen mentorlar, eğitmenler ve koordinatörler giriş yapabilir. Kayıt herkese açık değildir; davet edildiğiniz rol ile giriş yaparsınız.",
  },
  {
    question: "Mentorumu nasıl bulabilirim?",
    answer:
      "Destek almak istediğiniz konuyu ve mevcut probleminizi paylaştığınızda, uzmanlık alanı, girişim aşaması ve uygunluk bilgisine göre mentor önerileri görürsünüz. Her öneri, neden size uygun olduğunu açıklayan kısa bir gerekçeyle birlikte gelir.",
  },
  {
    question: "Bir programa nasıl katılabilirim?",
    answer:
      "Program başvuruları, başvuru dönemlerinde Duyurular bölümünden paylaşılır. Başvurunuz kabul edildiğinde, platforma giriş yapabilmeniz için e-posta adresinize bir davet gönderilir.",
  },
  {
    question: "Eğitim ve mentorluk arasındaki fark nedir?",
    answer:
      "Mentorluk, girişiminizin mevcut durumuna göre şekillenen ve karar almaya odaklanan birebir veya küçük ekip görüşmeleridir. Eğitim ise belirli bir konuda bilgi ve beceri kazandırmak için hazırlanmış yapılandırılmış içeriktir. Belirli bir probleminiz varsa mentorluk, bir konuyu baştan öğrenmek istiyorsanız eğitim daha uygundur.",
  },
  {
    question: "Birden fazla programda yer alabilir miyim?",
    answer:
      "Bu, programların katılım koşullarına bağlıdır. Aynı dönemde birden fazla programda yer alıp alamayacağınızı ilgili programın koşullarından veya program ekibinden öğrenebilirsiniz.",
  },
  {
    question: "Mentorluk görüşmeleri nasıl planlanır?",
    answer:
      "Görüşmeler, mentorun uygun zamanları üzerinden planlanır. Her görüşme bir gündem, önceki görüşmenin notları ve görüşme öncesinde tamamlanması gereken maddelerle birlikte oluşturulur; böylece iki taraf da hazırlıklı katılır.",
  },
  {
    question: "Davet e-postamı bulamıyorum, ne yapmalıyım?",
    answer:
      "Önce gereksiz (spam) ve promosyon klasörlerinizi kontrol edin. E-postayı yine bulamazsanız, programınızın koordinatörüyle iletişime geçerek davetin yeniden gönderilmesini isteyebilirsiniz.",
  },
  {
    question: "Platformdaki bilgilerimi kimler görebilir?",
    answer:
      "Görüşme notları, görev detayları ve paylaştığınız belgeler yalnızca sizin ve ilgili mentorunuzun erişimindedir. Program yönetimi içerik detaylarını görmez; yalnızca iletişim sıklığı ve görev tamamlama oranı gibi özet göstergeleri görür.",
  },
];

export const LANDING_CTA = {
  title: "Programınıza ve çalışma alanınıza erişin",
  text: "Mentorluk görüşmelerinizi, eğitimlerinizi ve girişim sürecinizi tek bir yerden takip edin.",
} as const;

export const LANDING_FOOTER = {
  tagline: "Mentorluk ve Girişim Programları Platformu.",
  text: "ODTÜ Teknokent girişimlerine mentorluk, eğitim ve program yönetimi hizmetleri sunan dijital platform.",
  columns: [
    {
      title: "Platform",
      links: [
        { label: "Mentorluk nedir?", href: "#karsilastirma" },
        { label: "Programlar", href: "#top" },
        { label: "Eğitimler", href: "#top" },
        { label: "Duyurular", href: "#duyurular" },
      ],
    },
    {
      title: "Destek",
      links: [
        { label: "Yardım Merkezi", href: "#top" },
        { label: "Sıkça Sorulan Sorular", href: "#sss" },
        { label: "İletişim", href: "#top" },
      ],
    },
    {
      title: "Yasal",
      links: [
        { label: "Gizlilik", href: "#top" },
        { label: "Kullanım Koşulları", href: "#top" },
        { label: "KVKK", href: "#top" },
      ],
    },
  ],
  copyright: "© 2026 ODTÜ Teknokent. Tüm hakları saklıdır.",
} as const;
