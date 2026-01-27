"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    className?: string
    children: React.ReactNode
}

export function Dialog({ isOpen, onClose, title, description, className, children }: DialogProps) {
    // Close on escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden"
        }

        return () => {
            document.removeEventListener("keydown", handleEscape)
            document.body.style.overflow = "unset"
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 animate-in fade-in-0"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Dialog Content */}
            <div
                className={cn(
                    "relative z-50 w-full max-w-lg mx-4 bg-background rounded-lg border shadow-lg",
                    "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200",
                    className
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "dialog-title" : undefined}
                aria-describedby={description ? "dialog-description" : undefined}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Content */}
                <div className="p-6">
                    {title && (
                        <h2 id="dialog-title" className="text-lg font-semibold leading-none tracking-tight">
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p id="dialog-description" className="text-sm text-muted-foreground mt-2">
                            {description}
                        </p>
                    )}
                    <div className="mt-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
