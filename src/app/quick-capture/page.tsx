"use client";

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Camera, Loader2, MessageCircleMore } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "pending" | "done";
};

const CHAT_FEATURE_ENABLED = !["0", "false", "off"].includes(
  (process.env.NEXT_PUBLIC_FEATURE_CHAT || "").toLowerCase()
);

export default function QuickCapturePage() {
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [showCaptureFeedback, setShowCaptureFeedback] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeWindow = useCallback(async () => {
    try {
      await invoke("close_quick_capture");
    } catch (err) {
      console.error("Failed to close window:", err);
    }
  }, []);

  // Hide the default body background and set up transparent window
  useEffect(() => {
    setMounted(true);
    // Make the entire document transparent
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";

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
  }, [closeWindow]);

  // Close on blur (clicking anywhere outside this window)
  useEffect(() => {
    const handleBlur = () => {
      closeWindow();
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [closeWindow]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const el = containerRef.current;
    if (!el) return;

    let lastWidth = 0;
    let lastHeight = 0;

    const updateWindowSize = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.ceil(rect.width + 12); // +6px padding on each side
      const height = Math.ceil(rect.height + 12);
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      invoke("resize_quick_capture", { width, height }).catch((err) =>
        console.error("Failed to resize quick capture window:", err)
      );
    };

    updateWindowSize();
    const observer = new ResizeObserver(updateWindowSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, [mounted]);

  const handleEdgeDrag = useCallback(
    async (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        const currentWindow = getCurrentWindow();
        await currentWindow.startDragging();
      } catch (err) {
        console.error("Failed to start dragging window:", err);
      }
    },
    []
  );

  const handleBackdropPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        event.preventDefault();
        closeWindow();
      }
    },
    [closeWindow]
  );

  const requestLLMResponse = useCallback(async (content: string) => {
    // Placeholder for an actual LLM call; replace with real request when available.
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`Got it. I'll remember: "${content}".`);
      }, 1200);
    });
  }, []);

  const ensureChatMode = useCallback(async () => {
    if (!CHAT_FEATURE_ENABLED || isChatMode) return;
    setIsChatMode(true);
  }, [isChatMode]);

  const handleCapture = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isSaving || isSubmitting) return;

    setIsSaving(true);
    try {
      await invoke("capture_memory", { content: trimmed });
      setShowCaptureFeedback(true);
      setValue("");

      setTimeout(() => setShowCaptureFeedback(false), 1400);
    } catch (err) {
      console.error("Failed to capture memory:", err);
    } finally {
      setIsSaving(false);
    }
  }, [value, isSaving, isSubmitting]);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      if (!CHAT_FEATURE_ENABLED) return;
      e?.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || isSubmitting || isSaving) return;

      await ensureChatMode();

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      const pendingAssistantId = `assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: pendingAssistantId,
          role: "assistant",
          content: "Waiting for response…",
          status: "pending",
        },
      ]);
      setValue("");
      setIsSubmitting(true);

      try {
        const response = await requestLLMResponse(trimmed);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === pendingAssistantId
              ? { ...message, content: response, status: "done" }
              : message
          )
        );
      } catch (err) {
        console.error("Failed to submit to LLM:", err);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === pendingAssistantId
              ? {
                  ...message,
                  content: "Something went wrong. Please try again.",
                  status: "done",
                }
              : message
          )
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [value, isSubmitting, isSaving, requestLLMResponse, ensureChatMode]
  );

  const handleFormSubmit = useCallback(
    (e?: FormEvent) => {
      if (!CHAT_FEATURE_ENABLED) {
        e?.preventDefault();
        void handleCapture();
        return;
      }
      void handleSubmit(e);
    },
    [handleCapture, handleSubmit]
  );

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return <div style={{ background: "transparent" }} />;
  }

  return (
    <>
      {/* Full-bleed transparent backing to completely cover any default window background */}
      <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-transparent m-0 p-0 pointer-events-none z-0" />

      {/* Content layer with padding for rounded corners */}
      <div
        className="fixed inset-0 w-screen h-screen flex items-center justify-center m-0 box-border bg-transparent z-[1]"
        onPointerDown={handleBackdropPointerDown}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-0 left-0 right-0 h-[6px] pointer-events-auto cursor-move"
            data-tauri-drag-region
            onPointerDown={handleEdgeDrag}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[6px] pointer-events-auto cursor-move"
            data-tauri-drag-region
            onPointerDown={handleEdgeDrag}
          />
          <div
            className="absolute top-0 bottom-0 left-0 w-[6px] pointer-events-auto cursor-move"
            data-tauri-drag-region
            onPointerDown={handleEdgeDrag}
          />
          <div
            className="absolute top-0 bottom-0 right-0 w-[6px] pointer-events-auto cursor-move"
            data-tauri-drag-region
            onPointerDown={handleEdgeDrag}
          />
        </div>
        <div
          ref={containerRef}
          className="w-[calc(100%-12px)] max-w-[420px] bg-white/95 dark:bg-[rgba(28,28,32,0.98)] rounded-xl overflow-hidden transition-all duration-200 ease-in-out border border-black/10 dark:border-white/10"
        >
          <div className="w-full flex flex-col">
            <div
              className={`transition-all duration-200 ease-in-out bg-[rgba(52,199,89,0.14)] text-[#1c7f3e] dark:bg-[rgba(52,199,89,0.12)] dark:text-[#b1f2c6] text-xs font-medium px-4 ${
                showCaptureFeedback ? "py-2 max-h-12 opacity-100" : "py-0 max-h-0 opacity-0"
              }`}
            >
              Saved successfully
            </div>
            <div
              className={
                isChatMode
                  ? "flex-1 flex flex-col px-2 pb-2 pt-3 gap-3"
                  : "flex flex-col px-2 py-2 gap-2"
              }
            >
              {isChatMode && (
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 scrollbar-track-transparent"
                >
                  {messages.length === 0 ? (
                    <div className="text-xs text-slate-500 dark:text-white/50 px-1">
                      Submit to see the conversation appear here.
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                            message.role === "user"
                              ? "bg-[rgba(252,133,63,0.12)] text-[#5b2c12] dark:bg-[rgba(252,133,63,0.16)] dark:text-[#fbe3d4]"
                              : "bg-black/5 text-slate-900 dark:bg-white/5 dark:text-white/80"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{message.content}</span>
                            {message.status === "pending" && (
                              <Loader2 className="w-3 h-3 text-slate-500 dark:text-white/60 animate-spin" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <form
                onSubmit={handleFormSubmit}
                className={`w-full flex items-center gap-2 rounded-lg ${
                  isChatMode ? "bg-black/5 dark:bg-white/5 pl-3 pr-2 py-2" : "pl-2"
                }`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Add a memory..."
                  disabled={isSubmitting || isSaving}
                  className="flex-1 text-sm font-sans tracking-[-0.01em] text-slate-900 dark:text-[#e8e8e8] bg-transparent border-none outline-none placeholder:text-slate-400 dark:placeholder:text-white/35 disabled:opacity-60"
                  autoComplete="off"
                  spellCheck="true"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={!value.trim() || isSaving || isSubmitting}
                    className={`flex items-center justify-center w-10 h-9 rounded-lg cursor-pointer transition-colors duration-150 ease-in-out disabled:opacity-30 disabled:cursor-not-allowed ${
                      CHAT_FEATURE_ENABLED
                        ? "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                        : "bg-[rgba(252,133,63,0.9)] border-none text-white hover:bg-[rgba(252,133,63,1)]"
                    }`}
                    title="Capture memory"
                    aria-label="Capture memory"
                  >
                    <Camera size={16} strokeWidth={2.5} />
                  </button>
                  {CHAT_FEATURE_ENABLED && (
                    <button
                      type="submit"
                      disabled={!value.trim() || isSubmitting || isSaving}
                      className="flex items-center justify-center w-10 h-9 bg-[rgba(252,133,63,0.9)] border-none rounded-lg text-white cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[rgba(252,133,63,1)] disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Submit to assistant"
                      aria-label="Submit to assistant"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircleMore size={16} strokeWidth={2.5} />
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
