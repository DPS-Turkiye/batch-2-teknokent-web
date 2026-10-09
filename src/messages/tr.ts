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
};

export type Messages = typeof tr;
