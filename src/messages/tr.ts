/** Turkish is the source text; en.ts must give every key the same shape. */
export const tr = {
  language: {
    label: "Dil",
    tr: "Türkçe",
    en: "English",
  },
  login: {
    title: "Menton’a hoş geldin",
    email: "E-posta",
    emailPlaceholder: "ornek@email.com",
    password: "Şifre",
    forgotPassword: "Şifremi unuttum",
    submit: "Giriş yap",
    submitting: "Giriş yapılıyor…",
    newHere: "Menton’a yeni misin?",
    signUp: "Kayıt Ol",
    invite: "Bir davet aldın mı? Davet kodunla devam et",
  },
  auth: {
    firstName: "Ad",
    firstNamePlaceholder: "Adınız",
    lastName: "Soyad",
    lastNamePlaceholder: "Soyadınız",
    email: "E-posta",
    emailPlaceholder: "ornek@email.com",
    phone: "Telefon",
    password: "Şifre",
    passwordConfirm: "Şifre tekrar",
    passwordConfirmPlaceholder: "Şifrenizi tekrarlayın",
    passwordsMismatch: "Şifreler eşleşmiyor.",
    creatingAccount: "Hesap oluşturuluyor…",
    sessionExpired: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
    signIn: "Giriş yap",
    shellImageAlt: "menton ile doğru mentörle eşleş",
  },
  register: {
    titleMentor: "Mentor olarak menton’a katıl",
    titleStartup: "Startup’ınla menton’a katıl",
    submit: "Hesap oluştur ve devam et",
    howItWorks: "Nasıl çalışır?",
    haveAccount: "Zaten hesabın var mı?",
    menteeSteps: [
      "Hesabını oluştur",
      "E-postanı doğrula",
      "Startup profilini tamamla",
      "Koordinatör onayını bekle",
    ],
    mentorSteps: [
      "Hesabını oluştur",
      "E-postanı doğrula",
      "CV'nden mentor profilini oluştur",
      "Onaydan sonra eşleşmelere başla",
    ],
  },
  invite: {
    title: "Davet kodunla ekibe katıl",
    intro:
      "Kodu startup'ının kurucusundan alırsın. Kodla oluşturulan hesaplar ayrıca onay beklemez.",
    code: "Davet kodu",
    submit: "Ekibe katıl",
    noCode: "Davet kodun yok mu?",
    backToLogin: "Giriş ekranına dön",
  },
  verifyEmail: {
    title: "E-postanı doğrula",
    sentBefore: "",
    sentAfter:
      " adresine bir doğrulama linki gönderdik. Maildeki linke tıklayınca devam edebilirsin.",
    notVerified:
      "E-posta henüz doğrulanmadı. Maildeki linke tıklayıp tekrar deneyin.",
    resent: "Doğrulama mailini yeniden gönderdik.",
    checking: "Kontrol ediliyor…",
    confirm: "Maili doğruladım, devam et",
    resending: "Gönderiliyor…",
    resend: "Yeniden gönder",
  },
  applicationTimeline: {
    completed: "Profil tamamlandı",
    sent: "Koordinatöre gönderildi",
    reviewed: "İncelendi",
    active: "Startup aktif",
    approvedDetail:
      "Profilin onaylandı. Giriş yaparak çalışma alanını açabilirsin.",
    rejected: "Başvuru onaylanmadı",
    rejectedDetail:
      "Koordinatör başvurunu onaylamadı. Ayrıntı için info@metu.edu.tr adresine yazabilirsin.",
    willActivate: "Startup aktif olacak",
    reviewing: "İnceleniyor",
    reviewingDetail:
      "Profilin koordinatörler tarafından incelenir. Genellikle 1-3 iş günü sürer.",
  },
  submittedProfile: {
    title: "Gönderilen profil",
    loading: "Yükleniyor…",
    unavailable: "Gönderilen profil şu an okunamadı.",
    fullName: "Ad soyad",
    startup: "Startup",
    role: "Rol / unvan",
    linkedin: "LinkedIn",
    bio: "Kısa tanıtım",
    contact: "İletişim tercihi",
    files: "Dosyalar",
  },
};

export type Messages = typeof tr;
