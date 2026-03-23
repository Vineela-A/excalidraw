import { useState, useEffect } from "react";
import type { Vote } from "@excalidraw/excalidraw/types";
import { useDb } from "./index";

/**
 * Live query of vote dots for a given board.
 */
export function useVotes(boardId: string): Vote[] {
  const db = useDb();
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    if (!boardId) return;

    const sub = db.votes
      .find({ selector: { boardId } })
      .$.subscribe((docs) => {
        setVotes(
          docs.map((d) => ({
            id: d.id,
            elementId: d.elementId,
            userId: d.userId,
            color: d.color,
            time: d.time,
          })),
        );
      });

    return () => sub.unsubscribe();
  }, [db, boardId]);

  return votes;
}
