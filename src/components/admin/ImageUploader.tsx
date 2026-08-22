"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Elige un archivo de imagen (jpg, png, webp...)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 5MB");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      setError(err.message || "No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="image_url" value={value} readOnly />

      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Vista previa" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl">🛍️</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary text-sm"
          >
            {uploading ? "Subiendo..." : "📁 Subir imagen desde mi compu"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="ml-2 text-xs text-ink-700/50 hover:text-red-400">
              quitar
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div>
        <label className="label" htmlFor="image_url_manual">O pega una URL de imagen</label>
        <input
          className="input"
          id="image_url_manual"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}
