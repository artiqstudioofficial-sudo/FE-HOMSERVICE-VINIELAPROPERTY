import React, { useMemo, useRef, useState } from "react";
import { resolveAssetUrl } from "@/lib/storage";

const PhotoUpload: React.FC<{
  label: string;
  photoUrlOrPath: string | undefined;
  onUploadFile: (file: File) => Promise<void>;
  disabled?: boolean;
  size?: number; // px
}> = ({ label, photoUrlOrPath, onUploadFile, disabled = false, size = 72 }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const serverResolved = useMemo(
    () => resolveAssetUrl(photoUrlOrPath),
    [photoUrlOrPath]
  );

  // ✅ tampilkan local preview dulu kalau ada
  const shown = localPreview || serverResolved || null;

  const openPicker = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const file = inputEl.files?.[0];
    if (!file) return;

    // ✅ instant preview
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);

    try {
      setIsUploading(true);
      await onUploadFile(file);
      // kalau upload sukses, biarin local preview tetap tampil dulu,
      // nanti pas parent update photoUrlOrPath, serverResolved akan keisi dan shown akan tetap OK.
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Gagal upload foto.");
      // gagal -> balikin preview
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      // cleanup object url biar ga leak
      // jangan revoke kalau masih dipakai shown, tapi kita revoke setelah sedikit delay.
      setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
      }, 1000);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {shown ? "Preview siap" : "Belum ada foto"}
        </p>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled || isUploading}
          className={`group relative overflow-hidden rounded-xl border shadow-sm transition ${
            disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-md"
          } border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800`}
          style={{ width: size, height: size }}
          aria-label={shown ? `Ganti ${label}` : `Unggah ${label}`}
        >
          {/* thumbnail */}
          {shown ? (
            <img
              src={shown}
              alt={label}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                />
              </svg>
            </div>
          )}

          {/* overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white transition ${
              isUploading
                ? "bg-black/55 opacity-100"
                : "bg-black/40 opacity-0 group-hover:opacity-100"
            }`}
          >
            {isUploading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Upload
              </span>
            ) : (
              <span>{shown ? "Ganti" : "Unggah"}</span>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept="image/*"
            disabled={disabled || isUploading}
          />
        </button>
      </div>
    </div>
  );
};

export default PhotoUpload;
