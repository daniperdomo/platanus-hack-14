"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRIES, countryName, filterCountries, fold } from "@/lib/countries";

export default function CountrySelect({ value, onChange }) {
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const selectedName = value ? countryName(value) : "";
  const [query, setQuery] = useState(selectedName);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const confirmed =
    Boolean(selectedName) && fold(query.trim()) === fold(selectedName);
  const matches = useMemo(
    () => (confirmed ? COUNTRIES : filterCountries(query)),
    [query, confirmed]
  );

  useEffect(() => {
    if (selectedName) setQuery(selectedName);
  }, [selectedName]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function pick(country) {
    onChange(country.code);
    setQuery(country.name);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onInput(event) {
    const next = event.target.value;
    setQuery(next);
    setActive(0);

    const exact = COUNTRIES.find(
      (country) => fold(country.name) === fold(next.trim())
    );
    if (exact) {
      onChange(exact.code);
      setOpen(false);
      return;
    }

    onChange("");
    setOpen(true);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (matches[active]) pick(matches[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="combo" ref={rootRef}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="Nacionalidad"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Elige el país de tu documento"
        value={query}
        onChange={onInput}
        onFocus={() => {
          if (!value) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck={false}
      />
      {open ? (
        <ul className="combo__list" id={listId} role="listbox">
          {matches.length ? (
            matches.map((country, index) => (
              <li key={country.code} role="option" aria-selected={value === country.code}>
                <button
                  type="button"
                  className={`combo__option${index === active ? " is-active" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(country)}
                >
                  {country.name}
                </button>
              </li>
            ))
          ) : (
            <li className="combo__empty">Ningún país coincide</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
