"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { XOctagon, ChevronRight, CheckCircle2 } from "lucide-react";

// ── Custom Badge ─────────────────────────────────────────────────────────────

export const CustomBadge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border whitespace-nowrap", className)}>
        {children}
    </span>
);

// ── Custom Switch ────────────────────────────────────────────────────────────

export const CustomSwitch = ({ checked, onCheckedChange, disabled }: { checked: boolean, onCheckedChange: (val: boolean) => void, disabled?: boolean }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-primary" : "bg-input"
        )}
    >
        <span
            className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                checked ? "translate-x-4" : "translate-x-1"
            )}
        />
    </button>
);

// ── Custom Checkbox ──────────────────────────────────────────────────────────

export const CustomCheckbox = ({ id, checked, onCheckedChange, className }: { id?: string, checked: boolean, onCheckedChange: (val: boolean) => void, className?: string }) => (
    <div 
        id={id}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
            "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center transition-colors",
            checked ? "bg-primary text-primary-foreground" : "bg-background",
            className
        )}
    >
        {checked && <CheckCircle2 className="h-3 w-3" />}
    </div>
);

// ── Custom Modal (Dialog Replacement) ────────────────────────────────────────

export const CustomModal = ({ isOpen, onClose, title, description, children, footer, maxWidth = "max-w-md" }: any) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={cn("bg-background border border-border rounded-xl shadow-2xl w-full animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]", maxWidth)}>
                <div className="p-6 border-b shrink-0 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
                        <XOctagon className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {children}
                </div>
                {footer && <div className="p-6 border-t shrink-0 flex justify-end gap-3 bg-muted/10">{footer}</div>}
            </div>
        </div>
    );
};

// ── Custom Select ───────────────────────────────────────────────────────────

export const CustomSelect = ({ value, onValueChange, options, placeholder }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((o: any) => o.value === value);

    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronRight className={cn("h-4 w-4 opacity-50 transition-transform", isOpen ? "rotate-90" : "")} />
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    <div className="p-1">
                        {options.map((option: any) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onValueChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    value === option.value && "bg-accent text-accent-foreground font-medium"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Custom Dropdown ──────────────────────────────────────────────────────────

export const CustomDropdown = ({ trigger, children, align = "right" }: { trigger: React.ReactNode, children: React.ReactNode, align?: "left" | "right" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);
  
    return (
      <div className="relative inline-block" ref={containerRef}>
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">{trigger}</div>
        {isOpen && (
          <div className={cn(
            "absolute z-[100] mt-2 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            align === "right" ? "right-0" : "left-0"
          )}>
            <div onClick={() => setIsOpen(false)}>
              {children}
            </div>
          </div>
        )}
      </div>
    );
};

// ── Custom Progress ──────────────────────────────────────────────────────────

export const CustomProgress = ({ value = 0, className }: { value?: number, className?: string }) => (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}>
        <div
            className="h-full w-full flex-1 bg-primary transition-all duration-700 ease-in-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
            style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value || 0)) }%)` }}
        />
    </div>
);
