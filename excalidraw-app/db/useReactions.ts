import { useState, useEffect } from "react";
import type { ElementReaction } from "@excalidraw/excalidraw/types";
import { useDb } from "./index";

/**
 * Live query of element reactions for a given board.
 * Groups reactions by elementId + emoji, exposing count and userIds.
 */
export function useReactions(boardId: string): ElementReaction[] {
  const db = useDb();
  const [reactions, setReactions] = useState<ElementReaction[]>([]);

  useEffect(() => {
    if (!boardId) return;

    const sub = db.reactions
      .find({ selector: { boardId } })
      .$.subscribe((docs) => {
        // Group by elementId:emoji
        const map = new Map<string, ElementReaction>();

        for (const doc of docs) {
          const key = `${doc.elementId}::${doc.emoji}`;
          const existing = map.get(key);
          if (existing) {
            existing.count += 1;
            existing.userIds.push(doc.userId);
          } else {
            map.set(key, {
              elementId: doc.elementId,
              emoji: doc.emoji,
              count: 1,
              userIds: [doc.userId],
            });
          }
        }

        setReactions(Array.from(map.values()));
      });

    return () => sub.unsubscribe();
  }, [db, boardId]);

  return reactions;
}
