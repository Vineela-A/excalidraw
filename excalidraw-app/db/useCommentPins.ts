import { useState, useEffect } from "react";
import type { CommentPin, CommentReply, CommentAuthor } from "@excalidraw/excalidraw/types";
import type { CommentDocType } from "./schema";
import { useDb } from "./index";

function docToReply(
  doc: CommentDocType,
  reactionMap: Map<string, Record<string, number>>,
): CommentReply {
  const author: CommentAuthor = {
    id: doc.authorId,
    name: doc.authorName,
    avatarColor: doc.authorColor,
  };
  const reactions = reactionMap.get(doc.id);
  return {
    id: doc.id,
    text: doc.text,
    author,
    time: doc.time,
    reactions: reactions && Object.keys(reactions).length > 0 ? { ...reactions } : undefined,
  };
}

/**
 * Live query of comment pins for a given board.
 * Returns top-level pins with their replies nested inside `comments`.
 *
 * Comment-level emoji reactions are stored in the `reactions` RxDB collection
 * with `elementId = commentId` — same collection used for canvas element
 * reactions but keyed by comment ID instead of element ID.  This avoids
 * storing emoji strings as JSON object property names (which can trip up
 * AJV's strict-mode validator in the dev-mode storage wrapper).
 */
export function useCommentPins(boardId: string): CommentPin[] {
  const db = useDb();
  const [pins, setPins] = useState<CommentPin[]>([]);

  useEffect(() => {
    if (!boardId) return;

    // Shared mutable state — both subscriptions call rebuild()
    let latestDocs: CommentDocType[] = [];
    let latestReactionMap = new Map<string, Record<string, number>>();

    function rebuild() {
      const topLevel = latestDocs.filter((d) => !d.parentId);
      const replies   = latestDocs.filter((d) => !!d.parentId);

      const result: CommentPin[] = topLevel.map((pin) => {
        const pinReplies = replies
          .filter((r) => r.parentId === pin.id)
          .sort((a, b) => a.time - b.time)
          .map((r) => docToReply(r, latestReactionMap));

        return {
          id: pin.id,
          elementId: pin.elementId,
          sceneX: pin.sceneX,
          sceneY: pin.sceneY,
          comments: [docToReply(pin, latestReactionMap), ...pinReplies],
        };
      });

      setPins(result);
    }

    // ── subscribe to comments ───────────────────────────────────────────────
    const commentSub = db.comments
      .find({ selector: { boardId } })
      .$.subscribe((docs) => {
        latestDocs = docs as unknown as CommentDocType[];
        rebuild();
      });

    // ── subscribe to reactions (both element & comment reactions share this
    //    collection; we group them all and look up by commentId in rebuild) ──
    const reactionSub = db.reactions
      .find({ selector: { boardId } })
      .$.subscribe((docs) => {
        const map = new Map<string, Record<string, number>>();
        for (const doc of docs) {
          const bucket = map.get(doc.elementId) ?? {};
          bucket[doc.emoji] = (bucket[doc.emoji] ?? 0) + 1;
          map.set(doc.elementId, bucket);
        }
        latestReactionMap = map;
        rebuild();
      });

    return () => {
      commentSub.unsubscribe();
      reactionSub.unsubscribe();
    };
  }, [db, boardId]);

  return pins;
}
