"use client";

import { useRef, useState } from "react";
import { ACCEPTED_TYPES, MAX_FILE_MB, fileError, formatSize } from "@/lib/apiRequest";

export default function FileDrop({ files, multiple = false, onChange }) {
  const input = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState("");

  function add(list) {
    const incoming = Array.from(list);
    const invalid = incoming.map(fileError).find(Boolean);
    const valid = incoming.filter((file) => !fileError(file));
    setRejected(invalid ?? "");
    if (valid.length === 0) return;
    onChange(multiple ? [...files, ...valid] : valid.slice(0, 1));
  }

  function remove(index) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="file-drop-wrap">
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, index) => (
            <li className="file-chip" key={`${file.name}-${index}`}>
              <span className="file-chip__icon" aria-hidden="true">
                {file.name.split(".").pop().toUpperCase()}
              </span>
              <span className="file-chip__name">{file.name}</span>
              <span className="file-chip__size">{formatSize(file.size)}</span>
              <button
                type="button"
                className="file-chip__remove"
                onClick={() => remove(index)}
                aria-label={`Quitar ${file.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {(multiple || files.length === 0) && (
        <button
          type="button"
          className={`file-drop${dragging ? " is-dragging" : ""}`}
          onClick={() => input.current.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            add(event.dataTransfer.files);
          }}
        >
          <strong>Arrastra el archivo o haz clic para elegirlo</strong>
          <span>PDF o Word · máximo {MAX_FILE_MB} MB</span>
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple={multiple}
        hidden
        onChange={(event) => {
          add(event.target.files);
          event.target.value = "";
        }}
      />
      {rejected && <span className="field__error">{rejected}</span>}
    </div>
  );
}
