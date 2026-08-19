export type LandingAnnouncement = {
  category: string;
  date: string;
  title: string;
  description: string;
};

export type LandingMentorStep = {
  number: string;
  title: string;
  text: string;
};

export type LandingProgram = {
  type: string;
  status: string;
  title: string;
  text: string;
  date: string;
};

export type LandingTraining = {
  category: string;
  format: string;
  title: string;
  trainer: string;
  detail: string;
};

export type LandingFaq = {
  question: string;
  answer: string;
};

export type LandingTrainingCategory =
  | "Tümü"
  | "Girişimcilik"
  | "İş Modeli"
  | "Ürün Geliştirme"
  | "Kullanıcı Deneyimi"
  | "Pazarlama ve Satış"
  | "Finans ve Yatırım"
  | "Hukuk ve Şirketleşme"
  | "Teknoloji";

export type DashboardNotification = {
  title: string;
  time: string;
};
