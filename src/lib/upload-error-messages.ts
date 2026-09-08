export const UPLOAD_ERROR_MESSAGES = {
  unsupportedType: (label: string) =>
    `Bu dosya türü desteklenmiyor. Lütfen ${label} yükleyin.`,
  tooLarge: (maxMb: number) =>
    `Dosya çok büyük. En fazla ${maxMb} MB yükleyebilirsin.`,
  invalidContent: (label: string) =>
    `Dosya içeriği geçersiz görünüyor. Lütfen geçerli bir ${label} yükleyin.`,
  suspiciousContent:
    "Dosyada güvenlik riski tespit edildi. Lütfen farklı bir dosya yükleyin.",
};
