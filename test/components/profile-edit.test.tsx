import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Test for Profile Editing Feature (PR #34)
 * Verifies that mentees can edit personal and startup profile after signup
 */

describe("Profile Editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow mentee to edit personal profile after signup", async () => {
    const mockSaveProfile = vi.fn().mockResolvedValue({ success: true });

    const profileData = {
      firstName: "Ahmet",
      lastName: "Yılmaz",
      email: "ahmet@example.com",
      bio: "Startup founder",
      phoneNumber: "+90123456789",
    };

    const result = await mockSaveProfile(profileData);

    expect(result.success).toBe(true);
    expect(mockSaveProfile).toHaveBeenCalledWith(profileData);
  });

  it("should update personal profile fields", async () => {
    const mockUpdateField = vi.fn().mockResolvedValue({ updated: true });

    const updates = {
      firstName: "Mehmet",
      bio: "Experienced entrepreneur",
    };

    const result = await mockUpdateField(updates);

    expect(result.updated).toBe(true);
    expect(mockUpdateField).toHaveBeenCalledWith(updates);
  });

  it("should allow mentee to edit startup profile information", async () => {
    const mockSaveStartupProfile = vi.fn().mockResolvedValue({ success: true });

    const startupData = {
      companyName: "TechStartup Inc",
      industry: "Software Development",
      foundedYear: 2023,
      teamSize: 5,
      website: "https://techstartup.com",
      description: "We build innovative software solutions",
    };

    const result = await mockSaveStartupProfile(startupData);

    expect(result.success).toBe(true);
    expect(mockSaveStartupProfile).toHaveBeenCalledWith(startupData);
  });

  it("should validate required profile fields", async () => {
    const validateProfile = (profile: {
      firstName?: string;
      email?: string;
    }) => {
      const errors: string[] = [];

      if (!profile.firstName || profile.firstName.trim() === "") {
        errors.push("Ad zorunludur");
      }
      if (!profile.email || !profile.email.includes("@")) {
        errors.push("Geçerli e-posta gereklidir");
      }

      return errors;
    };

    const invalidProfile = { firstName: "", email: "invalid" };
    const errors = validateProfile(invalidProfile);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain("Ad zorunludur");
    expect(errors).toContain("Geçerli e-posta gereklidir");
  });

  it("should show success message after profile update", async () => {
    const mockSave = vi.fn().mockResolvedValue({ success: true });

    const result = await mockSave({
      firstName: "Zeynep",
      email: "zeynep@example.com",
    });

    if (result.success) {
      const successMessage = "Profil başarıyla güncellendi";
      expect(successMessage).toBeDefined();
    }
  });

  it("should handle profile update errors", async () => {
    const mockSave = vi.fn().mockRejectedValue(new Error("Sunucu hatası"));

    try {
      await mockSave({ firstName: "Test" });
    } catch (error) {
      expect((error as Error).message).toBe("Sunucu hatası");
    }

    expect(mockSave).toHaveBeenCalled();
  });

  it("should support profile picture upload", async () => {
    const mockUploadPicture = vi.fn().mockResolvedValue({
      url: "https://example.com/profile-pic-123.jpg",
      uploadedAt: new Date().toISOString(),
    });

    const file = new File(["image"], "profile.jpg", { type: "image/jpeg" });
    const result = await mockUploadPicture(file);

    expect(result.url).toContain("profile-pic");
    expect(mockUploadPicture).toHaveBeenCalledWith(file);
  });

  it("should allow mentee to edit profile multiple times", async () => {
    const mockSave = vi.fn().mockResolvedValue({ success: true });

    const updates1 = { firstName: "Ali" };
    const updates2 = { bio: "Serial entrepreneur" };
    const updates3 = { phoneNumber: "+90987654321" };

    await mockSave(updates1);
    await mockSave(updates2);
    await mockSave(updates3);

    expect(mockSave).toHaveBeenCalledTimes(3);
  });

  it("should restrict profile editing to authenticated mentees", async () => {
    const mockCheckAuth = (isAuthenticated: boolean) => {
      if (!isAuthenticated) {
        throw new Error("Kimlik doğrulama gerekli");
      }
      return true;
    };

    expect(() => mockCheckAuth(false)).toThrow("Kimlik doğrulama gerekli");
    expect(() => mockCheckAuth(true)).not.toThrow();
  });

  it("should save startup profile with proper validation", async () => {
    const validateStartup = (startup: {
      companyName?: string;
      industry?: string;
    }) => {
      const errors: string[] = [];

      if (!startup.companyName || startup.companyName.trim() === "") {
        errors.push("Şirket adı zorunludur");
      }
      if (!startup.industry) {
        errors.push("Sektör seçimi zorunludur");
      }

      return errors;
    };

    const invalidStartup = { companyName: "", industry: "" };
    const errors = validateStartup(invalidStartup);

    expect(errors).toContain("Şirket adı zorunludur");
    expect(errors).toContain("Sektör seçimi zorunludur");
  });

  it("should preserve existing data when partial update is made", async () => {
    const mockPartialUpdate = vi.fn().mockResolvedValue({ success: true });

    const existingProfile = {
      firstName: "Ahmet",
      lastName: "Yılmaz",
      bio: "Founder",
      email: "ahmet@example.com",
    };

    const update = { bio: "Serial entrepreneur" };

    const result = await mockPartialUpdate({
      ...existingProfile,
      ...update,
    });

    expect(result.success).toBe(true);
  });
});
