import { resolveAssetUrl } from "@/lib/storage";
import React, { useMemo, useState } from "react";

type Props = {
  label: string;
  photoUrlOrPath: string | undefined;
  onUploadFile: (file: File) => Promise<void>;
  disabled?: boolean;
};

const PhotoUpload: React.FC<Props> = ({
  label,
  photoUrlOrPath,
  onUploadFile,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const resolved = useMemo(
    () => resolveAssetUrl(photoUrlOrPath),
    [photoUrlOrPath]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await onUploadFile(file);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Gagal upload foto.");
    } finally {
      setIsUploading(false);
      e.currentTarget.value = "";
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>

      <div className="mt-1 flex items-center space-x-4">
        <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
          {isUploading ? (
            <svg
              className="animate-spin h-5 w-5 text-gray-500"
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
          ) : resolved ? (
            <img
              src={resolved}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
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
          )}
        </div>

        <label
          htmlFor={`file-upload-${label.replace(/\s+/g, "-")}`}
          className={`relative cursor-pointer bg-white dark:bg-slate-600 py-2 px-3 border border-gray-300 dark:border-slate-500 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-500 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <span>{resolved ? "Ganti Foto" : "Unggah Foto"}</span>
          <input
            id={`file-upload-${label.replace(/\s+/g, "-")}`}
            name="file-upload"
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept="image/*"
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
};

export default PhotoUpload;
