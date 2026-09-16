"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { UserRole } from "@/interfaces/session";
import type {
  DocumentRequestItem,
  DocumentRequestScope,
} from "@/interfaces/document-request";
import {
  attachDocumentRequestUpload,
  deleteDocumentRequestUpload,
  listDocumentRequests,
  replaceDocumentRequests,
} from "@/lib/client/document-requests";
import { uploadDocument } from "@/lib/client/documents";
import {
  DocumentRequestTitleEditor,
  normalizeDocumentTitles,
} from "@/components/mentorships/document-request-title-editor";

export const DOCUMENT_REQUESTS_QUERY_KEY = ["document-requests"] as const;

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function primaryScope(
  scope: DocumentRequestScope,
): DocumentRequestScope | null {
  if (scope.meetingId) return { meetingId: scope.meetingId };
  if (scope.mentorshipRequestId) {
    return { mentorshipRequestId: scope.mentorshipRequestId };
  }
  if (scope.mentorshipId) return { mentorshipId: scope.mentorshipId };
  return null;
}

async function resolveChecklist(scope: DocumentRequestScope): Promise<{
  items: DocumentRequestItem[];
  activeScope: DocumentRequestScope;
}> {
  if (scope.meetingId) {
    const meetingItems = await listDocumentRequests({
      meetingId: scope.meetingId,
    });
    if (meetingItems.length > 0 || !scope.mentorshipRequestId) {
      return {
        items: meetingItems,
        activeScope: { meetingId: scope.meetingId },
      };
    }
  }
  if (scope.mentorshipRequestId) {
    return {
      items: await listDocumentRequests({
        mentorshipRequestId: scope.mentorshipRequestId,
      }),
      activeScope: { mentorshipRequestId: scope.mentorshipRequestId },
    };
  }
  if (scope.mentorshipId) {
    return {
      items: await listDocumentRequests({ mentorshipId: scope.mentorshipId }),
      activeScope: { mentorshipId: scope.mentorshipId },
    };
  }
  const fallback = primaryScope(scope);
  return { items: [], activeScope: fallback ?? {} };
}

export function DocumentRequestChecklist({
  scope,
  canManage = false,
  canUpload = false,
  title = "İstenen belgeler",
}: {
  scope: DocumentRequestScope;
  canManage?: boolean;
  canUpload?: boolean;
  title?: string;
}) {
  const session = useAppSession();
  const openDocument = useOpenDocument();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draftTitles, setDraftTitles] = useState<string[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const queryKey = [...DOCUMENT_REQUESTS_QUERY_KEY, scope];
  const query = useQuery({
    queryKey,
    queryFn: () => resolveChecklist(scope),
    enabled: Boolean(
      scope.meetingId || scope.mentorshipRequestId || scope.mentorshipId,
    ),
  });

  const activeScope = query.data?.activeScope ?? primaryScope(scope) ?? scope;
  const items = query.data?.items ?? [];

  const saveMutation = useMutation({
    mutationFn: (titles: string[]) =>
      replaceDocumentRequests(activeScope, titles),
    onSuccess: async () => {
      setEditing(false);
      setError("");
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (caught: Error) => setError(caught.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ itemId, file }: { itemId: string; file: File }) => {
      const stored = await uploadDocument(
        file,
        "requested-doc",
        undefined,
        scope.meetingId,
      );
      return attachDocumentRequestUpload(itemId, stored.id);
    },
    onSuccess: async () => {
      setActiveItemId(null);
      setError("");
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (caught: Error) => setError(caught.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocumentRequestUpload,
    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (caught: Error) => setError(caught.message),
  });

  const isMentor = session?.role === UserRole.Mentor;

  if (query.isLoading) {
    return (
      <p className="text-sm text-[#676e78]">İstenen belgeler yükleniyor…</p>
    );
  }

  if (query.error) {
    return (
      <p className="text-sm text-red-600">
        {query.error.message || "İstenen belgeler yüklenemedi."}
      </p>
    );
  }

  if (!canManage && items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[10px] border border-[#e4e7ea] bg-white px-6 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#1a1a1a]">{title}</h3>
          <p className="mt-1 text-sm text-[#666b75]">
            {isMentor
              ? "Mentee’nin yüklediği dosyaları burada görürsün."
              : "Mentörün istediği belgeleri buradan yükleyebilirsin."}
          </p>
        </div>
        {canManage && !editing ? (
          <button
            type="button"
            onClick={() => {
              setDraftTitles(
                items.length > 0 ? items.map((item) => item.title) : [""],
              );
              setEditing(true);
              setError("");
            }}
            className="shrink-0 text-[13px] font-medium text-[#e86f22]"
          >
            {items.length === 0 ? "Belge iste" : "Düzenle"}
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-3">
          <DocumentRequestTitleEditor
            titles={draftTitles}
            onChange={setDraftTitles}
            disabled={saveMutation.isPending}
            showHeading={false}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => {
                setEditing(false);
                setError("");
              }}
              className="rounded-lg border border-[#e4e7ea] px-3 py-2 text-sm text-[#515861]"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate(normalizeDocumentTitles(draftTitles))
              }
              className="rounded-lg bg-[#e86f22] px-3 py-2 text-sm font-medium text-white hover:bg-[#ce5e19] disabled:opacity-60"
            >
              {saveMutation.isPending ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-[#676e78]">Henüz istenen belge yok.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[#e4e7ea] bg-[#fafbfc] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#22262b]">
                    {item.title}
                  </p>
                  {item.uploads.length === 0 ? (
                    <p className="mt-1 text-xs text-[#858c96]">
                      Henüz yüklenmedi
                    </p>
                  ) : null}
                </div>
                {canUpload ? (
                  <button
                    type="button"
                    disabled={uploadMutation.isPending}
                    onClick={() => {
                      setActiveItemId(item.id);
                      fileInputRef.current?.click();
                    }}
                    className="shrink-0 rounded-lg border border-[#e4e7ea] bg-white px-3 py-1.5 text-[12px] font-medium text-[#515861] hover:border-[#f2b78f]"
                  >
                    {uploadMutation.isPending && activeItemId === item.id
                      ? "Yükleniyor…"
                      : "Dosya yükle"}
                  </button>
                ) : null}
              </div>
              {item.uploads.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {item.uploads.map((upload) => (
                    <li
                      key={upload.id}
                      className="flex items-center justify-between gap-2 text-xs text-[#515861]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          void openDocument(upload.storedDocumentId)
                        }
                        className="min-w-0 truncate text-left hover:text-[#e86f22] hover:underline"
                      >
                        {upload.originalFilename} ·{" "}
                        {formatBytes(upload.sizeBytes)} ·{" "}
                        {upload.uploadedByName}
                      </button>
                      <span className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void openDocument(upload.storedDocumentId)
                          }
                          className="text-[#e86f22] hover:underline"
                        >
                          Görüntüle
                        </button>
                        {canUpload || canManage ? (
                          <button
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(upload.id)}
                            className="text-[#b42318] hover:underline"
                          >
                            Kaldır
                          </button>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file || !activeItemId) return;
          uploadMutation.mutate({ itemId: activeItemId, file });
        }}
      />

      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
