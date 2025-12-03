"use client";

import { invoke } from "@tauri-apps/api/core";
import { X, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function QuickCapturePage() {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide the default body background and set up transparent window
  useEffect(() => {
    setMounted(true);
    // Make the entire document transparent
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    
    // Add dark class for proper theming
    document.documentElement.classList.add("dark");

    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, []);

  // Focus input on mount
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeWindow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeWindow = useCallback(async () => {
    try {
      await invoke("close_quick_capture");
    } catch (err) {
      console.error("Failed to close window:", err);
    }
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!value.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await invoke("capture_memory", { content: value.trim() });
        setIsSuccess(true);
        setValue("");

        // Close after a brief success animation
        setTimeout(() => {
          closeWindow();
        }, 300);
      } catch (err) {
        console.error("Failed to capture memory:", err);
        setIsSubmitting(false);
      }
    },
    [value, isSubmitting, closeWindow]
  );

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return <div style={{ background: "transparent" }} />;
  }

  return (
    <div className="quick-capture-container">
      <div className={`quick-capture-box ${isSuccess ? "success" : ""}`}>
        <form onSubmit={handleSubmit} className="quick-capture-form">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add a memory..."
            disabled={isSubmitting}
            className="quick-capture-input"
            autoComplete="off"
            spellCheck="true"
          />
          <div className="button-group">
            <button
              type="submit"
              disabled={!value.trim() || isSubmitting}
              className="submit-button"
              title="Save memory"
            >
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={closeWindow}
              className="close-button"
              title="Close (Esc)"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .quick-capture-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent !important;
          padding: 0;
          margin: 0;
        }

        .quick-capture-box {
          width: 100%;
          height: 100%;
          background: rgba(28, 28, 32, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.4),
            0 8px 40px rgba(0, 0, 0, 0.5),
            0 2px 8px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .quick-capture-box.success {
          border-color: rgba(52, 199, 89, 0.5);
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.4),
            0 0 20px rgba(52, 199, 89, 0.2),
            0 8px 40px rgba(0, 0, 0, 0.5);
        }

        .quick-capture-form {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 8px 0 16px;
          gap: 8px;
        }

        .quick-capture-input {
          flex: 1;
          height: 100%;
          font-size: 14px;
          font-family: var(--font-sans, "Geist Mono", ui-monospace, monospace);
          letter-spacing: -0.01em;
          color: #e8e8e8;
          background: transparent;
          border: none;
          outline: none;
        }

        .quick-capture-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .quick-capture-input:disabled {
          opacity: 0.6;
        }

        .button-group {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .submit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(252, 133, 63, 0.9);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .submit-button:hover:not(:disabled) {
          background: rgba(252, 133, 63, 1);
          transform: scale(1.05);
        }

        .submit-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .submit-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.08);
          border: none;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.8);
        }

        .close-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
