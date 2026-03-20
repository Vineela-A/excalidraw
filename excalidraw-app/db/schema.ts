import type { RxJsonSchema } from "rxdb";

export type CommentDocType = {
  id: string;
  boardId: string;
  elementId: string;
  sceneX: number;
  sceneY: number;
  text: string;
  authorId: string;
  authorName: string;
  authorColor?: string;
  time: number;
  /** null / absent = top-level pin; set = reply to that pin */
  parentId?: string;
  reactions?: Record<string, number>; // emoji → count
};

export type ReactionDocType = {
  id: string;
  boardId: string;
  elementId: string;
  emoji: string;
  userId: string;
};

export const commentSchema: RxJsonSchema<CommentDocType> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 128 },
    boardId: { type: "string", maxLength: 128 },
    elementId: { type: "string", maxLength: 128 },
    sceneX: { type: "number" },
    sceneY: { type: "number" },
    text: { type: "string" },
    authorId: { type: "string", maxLength: 128 },
    authorName: { type: "string", maxLength: 256 },
    authorColor: { type: "string", maxLength: 32 },
    time: { type: "number" },
    parentId: { type: "string", maxLength: 128 },
    reactions: { type: "object", additionalProperties: { type: "number" } },
  },
  required: ["id", "boardId", "elementId", "sceneX", "sceneY", "text", "authorId", "authorName", "time"],
  indexes: ["boardId", "elementId"],
};

export const reactionSchema: RxJsonSchema<ReactionDocType> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 256 },
    boardId: { type: "string", maxLength: 128 },
    elementId: { type: "string", maxLength: 128 },
    emoji: { type: "string", maxLength: 16 },
    userId: { type: "string", maxLength: 128 },
  },
  required: ["id", "boardId", "elementId", "emoji", "userId"],
  indexes: ["boardId", "elementId"],
};
