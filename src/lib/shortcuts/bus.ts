"use client";

import { useEffect, useRef } from "react";

export type CommandName =
  | "focus-dump"
  | "focus-new-task"
  | "open-event-editor"
  | "timer-start"
  | "timer-toggle"
  | "delete-selected";

export function dispatchCommand(name: CommandName) {
  if (typeof document === "undefined") return;
  document.dispatchEvent(new CustomEvent("doro:cmd", { detail: name }));
}

export function useCommand(name: CommandName, handler: () => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const h = (e: Event) => {
      if ((e as CustomEvent).detail === name) handlerRef.current();
    };
    document.addEventListener("doro:cmd", h);
    return () => document.removeEventListener("doro:cmd", h);
  }, [name]);
}
