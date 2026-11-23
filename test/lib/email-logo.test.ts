import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

it("serves the logo the backend's mails link to, at twice its shown size and without metadata", () => {
  const file = readFileSync(
    path.resolve(__dirname, "../../public/email/menton-odtu-teknokent.png"),
  );
  expect(file.readUInt32BE(16)).toBe(520);
  expect(file.readUInt32BE(20)).toBe(139);
  expect(file.includes("eXIf")).toBe(false);
  expect(file.includes("iTXt")).toBe(false);
});
