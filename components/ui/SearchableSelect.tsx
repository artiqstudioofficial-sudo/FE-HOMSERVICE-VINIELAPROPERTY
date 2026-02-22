import React, { useEffect, useMemo, useRef, useState } from 'react';

export type SelectOption<T extends string | number = string> = {
  value: T;
  label: string;
  meta?: string;
};

type Props<T extends string | number = string> = {
  value: T | '' | null | undefined;
  options: SelectOption<T>[];

  placeholder?: string; // placeholder tombol
  searchPlaceholder?: string; // placeholder input search
  emptyText?: string;

  disabled?: boolean;
  required?: boolean;

  onChange: (next: T) => void;
  className?: string;
};

function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [ref, handler]);
}

export default function SearchableSelect<T extends string | number = string>({
  value,
  options,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  emptyText = 'Tidak ada data.',
  disabled,
  required,
  onChange,
  className,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  useOnClickOutside(containerRef, () => setOpen(false));

  const selected = useMemo(() => {
    if (value === '' || value == null) return null;
    return options.find((o) => String(o.value) === String(value)) ?? null;
  }, [value, options]);

  const filtered = useMemo(() => {
    const key = (q || '').toLowerCase();
    if (!key) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.meta ?? ''}`.toLowerCase();
      return hay.includes(key);
    });
  }, [options, q]);

  useEffect(() => {
    if (!open) return;
    // fokus ke input search saat dropdown dibuka
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    setOpen((s) => !s);
  };

  const handlePick = (opt: SelectOption<T>) => {
    onChange(opt.value);
    setOpen(false);
    setQ('');
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {/* Button */}
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm text-left',
          'bg-white dark:bg-slate-900',
          'border-slate-300 dark:border-slate-600',
          'text-slate-900 dark:text-slate-100',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800',
        ].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? '' : 'text-slate-400 dark:text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
      </button>

      {/* required helper: kalau form butuh required, kita pasang hidden input */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          className="sr-only"
          required
          value={value == null ? '' : String(value)}
          onChange={() => {}}
        />
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
                {emptyText}
              </div>
            ) : (
              filtered.map((opt) => {
                const active = selected && String(selected.value) === String(opt.value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handlePick(opt)}
                    className={[
                      'w-full text-left px-3 py-2 text-sm',
                      'hover:bg-slate-100 dark:hover:bg-slate-800',
                      active ? 'bg-slate-100 dark:bg-slate-800 font-semibold' : '',
                    ].join(' ')}
                    role="option"
                    aria-selected={active}
                  >
                    <div className="text-slate-900 dark:text-slate-100">{opt.label}</div>
                    {opt.meta ? (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {opt.meta}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
