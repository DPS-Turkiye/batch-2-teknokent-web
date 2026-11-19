/** A file format an upload field can take, as the picker hint and error messages name it. */
export enum UploadFileType {
  Pdf = "PDF",
  Docx = "DOCX",
  Xlsx = "XLSX",
  Pptx = "PPTX",
  Png = "PNG",
  Jpeg = "JPG",
  Webp = "WEBP",
}

/** Why a picked file is refused before it is sent. */
export enum UploadProblem {
  Empty = "EMPTY",
  /** A video picked for a field that takes its video as a link instead. */
  VideoAsLink = "VIDEO_AS_LINK",
  WrongType = "WRONG_TYPE",
  TooLarge = "TOO_LARGE",
}
