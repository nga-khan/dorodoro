"use client";

import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import type { CalendarEvent } from "@/types/domain";

const now = () => Date.now();

export async function createEvent(input: {
  title: string;
  start: number;
  end: number;
  description?: string;
  color?: string;
}): Promise<CalendarEvent> {
  const ev: CalendarEvent = {
    id: nanoid(),
    title: input.title.trim() || "(제목 없음)",
    description: input.description,
    start: input.start,
    end: input.end,
    color: input.color,
    createdAt: now(),
    updatedAt: now(),
  };
  await getDB().events.add(ev);
  return ev;
}

export async function updateEvent(
  id: string,
  patch: Partial<Omit<CalendarEvent, "id" | "createdAt">>,
): Promise<void> {
  await getDB().events.update(id, { ...patch, updatedAt: now() });
}

export async function deleteEvent(id: string): Promise<void> {
  await getDB().events.delete(id);
}
