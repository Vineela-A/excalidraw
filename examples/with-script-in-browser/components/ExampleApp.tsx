import { nanoid } from "nanoid";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  Children,
  cloneElement,
} from "react";

import type * as TExcalidraw from "@excalidraw/excalidraw";
import type { ImportedLibraryData } from "@excalidraw/excalidraw/data/types";
import type {
  NonDeletedExcalidrawElement,
  Theme,
} from "@excalidraw/excalidraw/element/types";
import type {
  AppState,
  BinaryFileData,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  Gesture,
  LibraryItems,
  PointerDownState as ExcalidrawPointerDownState,
} from "@excalidraw/excalidraw/types";

import initialData from "../initialData";
import {
  resolvablePromise,
  distance2d,
  fileOpen,
  withBatchedUpdates,
  withBatchedUpdatesThrottled,
} from "../utils";

import CustomFooter from "./CustomFooter";
import MobileFooter from "./MobileFooter";
import ExampleSidebar from "./sidebar/ExampleSidebar";

import "./ExampleApp.scss";

import type { ResolvablePromise } from "../utils";

type Comment = {
  x: number;
  y: number;
  value: string;
  id?: string;
};

type PointerDownState = {
  x: number;
  y: number;
  hitElement: Comment;
  onMove: any;
  onUp: any;
  hitElementOffsets: {
    x: number;
    y: number;
  };
};

const COMMENT_ICON_DIMENSION = 32;
const COMMENT_INPUT_HEIGHT = 50;
const COMMENT_INPUT_WIDTH = 150;

export interface AppProps {
  appTitle: string;
  useCustom: (api: ExcalidrawImperativeAPI | null, customArgs?: any[]) => void;
  customArgs?: any[];
  children: React.ReactNode;
  excalidrawLib: typeof TExcalidraw;
}

export default function ExampleApp({
  appTitle,
  useCustom,
  customArgs,
  children,
  excalidrawLib,
}: AppProps) {
  const {
    exportToCanvas,
    exportToSvg,
    exportToBlob,
    exportToClipboard,
    useHandleLibrary,
    MIME_TYPES,
    sceneCoordsToViewportCoords,
    viewportCoordsToSceneCoords,
    restoreElements,
    Sidebar,
    Footer,
    WelcomeScreen,
    MainMenu,
    LiveCollaborationTrigger,
    convertToExcalidrawElements,
    TTDDialog,
    TTDDialogTrigger,
    ROUNDNESS,
    loadSceneOrLibraryFromBlob,
  } = excalidrawLib;
  const appRef = useRef<any>(null);
  const [viewModeEnabled, setViewModeEnabled] = useState(false);
  const [zenModeEnabled, setZenModeEnabled] = useState(false);
  const [gridModeEnabled, setGridModeEnabled] = useState(false);
  const [renderScrollbars, setRenderScrollbars] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [canvasUrl, setCanvasUrl] = useState<string>("");
  const [exportWithDarkMode, setExportWithDarkMode] = useState(false);
  const [exportEmbedScene, setExportEmbedScene] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [disableImageTool, setDisableImageTool] = useState(false);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [commentIcons, setCommentIcons] = useState<{ [id: string]: Comment }>(
    {},
  );
  const [comment, setComment] = useState<Comment | null>(null);
  const [threads, setThreads] = useState<{
    [elementId: string]: {
      id: string;
      elementId: string;
      x: number;
      y: number;
      comments: { id: string; value: string; created: number }[];
    };
  }>({});
  const [openThreadElementId, setOpenThreadElementId] = useState<string | null>(null);
  const [uiLogs, setUiLogs] = useState<string[]>([]);

  const pushUiLog = (msg: string) => {
    setUiLogs((prev) => {
      const next = [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`];
      return next;
    });
  };

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  useEffect(() => {
    pushUiLog("ExampleApp mounted");
  }, []);

  const setExcalidrawAPIWithLog = (api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
    pushUiLog("excalidrawAPI set");
    console.log("excalidrawAPI set", api);
  };

  useCustom(excalidrawAPI, customArgs);

  useHandleLibrary({ excalidrawAPI });

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    const fetchData = async () => {
      const res = await fetch("/images/rocket.jpeg");
      const imageData = await res.blob();
      const reader = new FileReader();
      reader.readAsDataURL(imageData);

      reader.onload = function () {
        const imagesArray: BinaryFileData[] = [
          {
            id: "rocket" as BinaryFileData["id"],
            dataURL: reader.result as BinaryFileData["dataURL"],
            mimeType: MIME_TYPES.jpg,
            created: 1644915140367,
            lastRetrieved: 1644915140367,
          },
        ];

        //@ts-ignore
        initialStatePromiseRef.current.promise.resolve({
          ...initialData,
          elements: convertToExcalidrawElements(initialData.elements),
        });
        excalidrawAPI.addFiles(imagesArray);
      };
    };
    fetchData();
  }, [excalidrawAPI, convertToExcalidrawElements, MIME_TYPES]);

  // Listen for createCommentPin events dispatched by the editor UI
  useEffect(() => {
    if (!excalidrawAPI) return;
    const handler = (ev: any) => {
      const detail = ev.detail || {};
      const elementId = detail.elementId;
      if (!elementId) return;
      const sceneX = detail.sceneX ?? detail.x;
      const sceneY = detail.sceneY ?? detail.y;
      const text = detail.text ?? "";
      const id = nanoid();
      // keep a flat pin map for positioning
      setCommentIcons((prev) => ({
        ...prev,
        [id]: { x: sceneX, y: sceneY, id, value: text, elementId },
      }));
      // add to threads
      setThreads((prev) => {
        const existing = prev[elementId];
        const commentObj = { id, value: text, created: Date.now() };
        if (existing) {
          return {
            ...prev,
            [elementId]: {
              ...existing,
              comments: [...existing.comments, commentObj],
            },
          };
        }
        return {
          ...prev,
          [elementId]: {
            id: nanoid(),
            elementId,
            x: sceneX,
            y: sceneY,
            comments: [commentObj],
          },
        };
      });
      const evMsg = `event: createCommentPin elementId=${elementId} scene=(${sceneX},${sceneY}) text=${text} id=${id}`;
      console.log(evMsg, { elementId, sceneX, sceneY, text, id });
      pushUiLog(evMsg);
    };
    window.addEventListener("excalidraw:createCommentPin", handler as any);
    return () => window.removeEventListener("excalidraw:createCommentPin", handler as any);
  }, [excalidrawAPI]);

  const renderExcalidraw = (children: React.ReactNode) => {
    const Excalidraw: any = Children.toArray(children).find(
      (child) =>
        React.isValidElement(child) &&
        typeof child.type !== "string" &&
        //@ts-ignore
        child.type.displayName === "Excalidraw",
    );
    if (!Excalidraw) {
      return;
    }
    const newElement = cloneElement(
      Excalidraw,
      {
        excalidrawAPI: (api: ExcalidrawImperativeAPI) => setExcalidrawAPIWithLog(api),
        initialData: initialStatePromiseRef.current.promise,
        onChange: (
          elements: NonDeletedExcalidrawElement[],
          state: AppState,
        ) => {
          console.info("Elements :", elements, "State : ", state);
        },
        onPointerUpdate: (payload: {
          pointer: { x: number; y: number };
          button: "down" | "up";
          pointersMap: Gesture["pointers"];
        }) => setPointerData(payload),
        viewModeEnabled,
        zenModeEnabled,
        renderScrollbars,
        gridModeEnabled,
        theme,
        name: "Custom name of drawing",
        UIOptions: {
          canvasActions: {
            loadScene: false,
          },
          tools: { image: !disableImageTool },
        },
        renderTopRightUI,
        onLinkOpen,
        onPointerDown,
        onScrollChange: rerenderCommentIcons,
        validateEmbeddable: true,
      },
      <>
        {excalidrawAPI && (
          <Footer>
            <CustomFooter
              excalidrawAPI={excalidrawAPI}
              excalidrawLib={excalidrawLib}
            />
          </Footer>
        )}
        <WelcomeScreen />
        <Sidebar name="custom">
          <Sidebar.Tabs>
            <Sidebar.Header />
            <Sidebar.Tab tab="one">Tab one!</Sidebar.Tab>
            <Sidebar.Tab tab="two">Tab two!</Sidebar.Tab>
            <Sidebar.TabTriggers>
              <Sidebar.TabTrigger tab="one">One</Sidebar.TabTrigger>
              <Sidebar.TabTrigger tab="two">Two</Sidebar.TabTrigger>
            </Sidebar.TabTriggers>
          </Sidebar.Tabs>
        </Sidebar>
        <Sidebar.Trigger
          name="custom"
          tab="one"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "20px",
            zIndex: 9999999999999999,
          }}
        >
          Toggle Custom Sidebar
        </Sidebar.Trigger>
        {renderMenu()}
        {excalidrawAPI && (
          <TTDDialogTrigger icon={<span>😀</span>}>
            Text to diagram
          </TTDDialogTrigger>
        )}
        <TTDDialog
          onTextSubmit={async (_) => {
            console.info("submit");
            // sleep for 2s
            await new Promise((resolve) => setTimeout(resolve, 2000));
            throw new Error("error, go away now");
            // return "dummy";
          }}
        />
      </>,
    );
    return newElement;
  };
  const renderTopRightUI = (isMobile: boolean) => {
    return (
      <>
        {!isMobile && (
          <LiveCollaborationTrigger
            isCollaborating={isCollaborating}
            onSelect={() => {
              window.alert("Collab dialog clicked");
            }}
          />
        )}
        <button
          onClick={() => alert("This is an empty top right UI")}
          style={{ height: "2.5rem" }}
        >
          Click me
        </button>
      </>
    );
  };

  const loadSceneOrLibrary = async () => {
    const file = await fileOpen({ description: "Excalidraw or library file" });
    const contents = await loadSceneOrLibraryFromBlob(file, null, null);
    if (contents.type === MIME_TYPES.excalidraw) {
      excalidrawAPI?.updateScene(contents.data as any);
    } else if (contents.type === MIME_TYPES.excalidrawlib) {
      excalidrawAPI?.updateLibrary({
        libraryItems: (contents.data as ImportedLibraryData).libraryItems!,
        openLibraryMenu: true,
      });
    }
  };

  const updateScene = () => {
    const sceneData = {
      elements: restoreElements(
        convertToExcalidrawElements([
          {
            type: "rectangle",
            id: "rect-1",
            fillStyle: "hachure",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 1,
            angle: 0,
            x: 100.50390625,
            y: 93.67578125,
            strokeColor: "#c92a2a",
            width: 186.47265625,
            height: 141.9765625,
            seed: 1968410350,
            roundness: {
              type: ROUNDNESS.ADAPTIVE_RADIUS,
              value: 32,
            },
          },
          {
            type: "arrow",
            x: 300,
            y: 150,
            start: { id: "rect-1" },
            end: { type: "ellipse" },
          },
          {
            type: "text",
            x: 300,
            y: 100,
            text: "HELLO WORLD!",
          },
        ]),
        null,
      ),
      appState: {
        viewBackgroundColor: "#edf2ff",
      },
    };
    excalidrawAPI?.updateScene(sceneData);
  };

  const onLinkOpen = useCallback(
    (
      element: NonDeletedExcalidrawElement,
      event: CustomEvent<{
        nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
      }>,
    ) => {
      const link = element.link!;
      const { nativeEvent } = event.detail;
      const isNewTab = nativeEvent.ctrlKey || nativeEvent.metaKey;
      const isNewWindow = nativeEvent.shiftKey;
      const isInternalLink =
        link.startsWith("/") || link.includes(window.location.origin);
      if (isInternalLink && !isNewTab && !isNewWindow) {
        // signal that we're handling the redirect ourselves
        event.preventDefault();
        // do a custom redirect, such as passing to react-router
        // ...
      }
    },
    [],
  );

  const onCopy = async (type: "png" | "svg" | "json") => {
    if (!excalidrawAPI) {
      return false;
    }
    await exportToClipboard({
      elements: excalidrawAPI.getSceneElements(),
      appState: excalidrawAPI.getAppState(),
      files: excalidrawAPI.getFiles(),
      type,
    });
    window.alert(`Copied to clipboard as ${type} successfully`);
  };

  const [pointerData, setPointerData] = useState<{
    pointer: { x: number; y: number };
    button: "down" | "up";
    pointersMap: Gesture["pointers"];
  } | null>(null);

  const onPointerDown = (
    activeTool: AppState["activeTool"],
    pointerDownState: ExcalidrawPointerDownState,
  ) => {
    if (activeTool.type === "custom" && activeTool.customType === "comment") {
      const { x, y } = pointerDownState.origin;
      const msg = `onPointerDown start comment at (${x},${y})`;
      console.log(msg, { x, y });
      pushUiLog(msg);
      setComment({ x, y, value: "" });
    }
  };

  const rerenderCommentIcons = () => {
    if (!excalidrawAPI) {
      return false;
    }
    const commentIconsElements = appRef.current.querySelectorAll(
      ".comment-icon",
    ) as HTMLElement[];
    commentIconsElements.forEach((ele) => {
      const id = ele.id;
      const appstate = excalidrawAPI.getAppState();
      // support icons that are either from `threads` (thread id) or `commentIcons` (pin id)
      const pin = commentIcons[id];
      const thread = threads[id] ?? (pin ? threads[pin.elementId] : undefined);
      const sceneX = thread ? thread.x : pin ? pin.x : 0;
      const sceneY = thread ? thread.y : pin ? pin.y : 0;
      const { x, y } = sceneCoordsToViewportCoords(
        { sceneX, sceneY },
        appstate,
      );
      ele.style.left = `${x - COMMENT_ICON_DIMENSION / 2 - appstate!.offsetLeft}px`;
      ele.style.top = `${y - COMMENT_ICON_DIMENSION / 2 - appstate!.offsetTop}px`;
    });
  };

  // debug helper: log current threads and pins
  const logCommentState = () => {
    console.log("comment state", {
      threadsCount: Object.keys(threads).length,
      pinsCount: Object.keys(commentIcons).length,
      threads,
      commentIcons,
    });
  };

  // expose debug helpers to window for desktop inspection
  useEffect(() => {
    // @ts-ignore
    window.logCommentState = logCommentState;
    // @ts-ignore
    window.getCommentState = () => ({ threads, commentIcons });
    return () => {
      // @ts-ignore
      delete window.logCommentState;
      // @ts-ignore
      delete window.getCommentState;
    };
  }, [threads, commentIcons]);

  const onPointerMoveFromPointerDownHandler = (
    pointerDownState: PointerDownState,
  ) => {
    return withBatchedUpdatesThrottled((event) => {
      if (!excalidrawAPI) {
        return false;
      }
      const { x, y } = viewportCoordsToSceneCoords(
        {
          clientX: event.clientX - pointerDownState.hitElementOffsets.x,
          clientY: event.clientY - pointerDownState.hitElementOffsets.y,
        },
        excalidrawAPI.getAppState(),
      );
      setCommentIcons((prev) => ({
        ...prev,
        [pointerDownState.hitElement.id!]: {
          ...(prev[pointerDownState.hitElement.id!] || {}),
          x,
          y,
        },
      }));
    });
  };
  const onPointerUpFromPointerDownHandler = (
    pointerDownState: PointerDownState,
  ) => {
    return withBatchedUpdates((event) => {
      window.removeEventListener("pointermove", pointerDownState.onMove);
      window.removeEventListener("pointerup", pointerDownState.onUp);
      excalidrawAPI?.setActiveTool({ type: "selection" });
      const distance = distance2d(
        pointerDownState.x,
        pointerDownState.y,
        event.clientX,
        event.clientY,
      );
      if (distance === 0) {
        if (!comment) {
          setComment({
            x: pointerDownState.hitElement.x + 60,
            y: pointerDownState.hitElement.y,
            value: pointerDownState.hitElement.value,
            id: pointerDownState.hitElement.id,
          });
        } else {
          setComment(null);
        }
      }
    });
  };

  const renderCommentIcons = () => {
    // Render pins from both threads (grouped by element) and standalone commentIcons
      const msg = "renderCommentIcons: excalidrawAPI not available yet";
      console.log(msg, { threads, commentIcons });
      pushUiLog(msg);
      pushUiLog(msg);
      return null;
    }

    const appState = excalidrawAPI.getAppState();
    const out: React.ReactNode[] = [];

    const threadsList = Object.values(threads);
    threadsList.forEach((thread) => {
      const commentIcon: any = {
        id: thread.id,
        x: thread.x,
        y: thread.y,
        value: thread.comments[0]?.value ?? "",
        elementId: thread.elementId,
      };
      const { x, y } = sceneCoordsToViewportCoords({ sceneX: commentIcon.x, sceneY: commentIcon.y }, appState);
      out.push(
        <div
          id={commentIcon.id}
          key={`thread-${commentIcon.id}`}
          style={{
            top: `${y - COMMENT_ICON_DIMENSION / 2 - appState.offsetTop}px`,
            left: `${x - COMMENT_ICON_DIMENSION / 2 - appState.offsetLeft}px`,
            position: "absolute",
            zIndex: 99999,
            pointerEvents: "auto",
            width: `${COMMENT_ICON_DIMENSION}px`,
            height: `${COMMENT_ICON_DIMENSION}px`,
            cursor: "pointer",
            touchAction: "none",
          }}
          className="comment-icon"
          onPointerDown={(event) => {
            event.preventDefault();
            const eid = thread.elementId || thread.id;
            setOpenThreadElementId((prev) => (prev === eid ? null : eid));
          }}
        >
          <div className="comment-avatar">
            <div className="comment-avatar-initial">
              {commentIcon.value ? commentIcon.value.trim()[0].toUpperCase() : commentIcon.id?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>,
      );
    });

    // commentIcons (individual pins not yet aggregated into threads)
    Object.values(commentIcons).forEach((ci: any) => {
      const { x: sceneX, y: sceneY, id } = ci;
      const { x, y } = sceneCoordsToViewportCoords({ sceneX, sceneY }, appState);
      out.push(
        <div
          id={id}
          key={`pin-${id}`}
          style={{
            top: `${y - COMMENT_ICON_DIMENSION / 2 - appState.offsetTop}px`,
            left: `${x - COMMENT_ICON_DIMENSION / 2 - appState.offsetLeft}px`,
            position: "absolute",
            zIndex: 99999,
            pointerEvents: "auto",
            width: `${COMMENT_ICON_DIMENSION}px`,
            height: `${COMMENT_ICON_DIMENSION}px`,
            cursor: "pointer",
            touchAction: "none",
          }}
          className="comment-icon"
          onPointerDown={(event) => {
            event.preventDefault();
            const eid = ci.elementId || id;
            setOpenThreadElementId((prev) => (prev === eid ? null : eid));
          }}
        >
          <div className="comment-avatar">
            <div className="comment-avatar-initial">
              {ci.value ? ci.value.trim()[0].toUpperCase() : id?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>,
      );
    });

    return out;
  };

  const saveComment = () => {
    if (!comment) {
      return;
    }
    if (!comment.id && !comment.value) {
      setComment(null);
      return;
    }
    const id = comment.id || nanoid();
    // Determine if this comment should be attached to an existing scene element
    let targetElementId: string | undefined = undefined;
    try {
      const elements = excalidrawAPI?.getSceneElements() ?? [];
      for (const el of elements) {
        if (
          typeof el.x === "number" &&
          typeof el.y === "number" &&
          typeof (el as any).width === "number" &&
          typeof (el as any).height === "number"
        ) {
          const ex = el.x;
          const ey = el.y;
          const ew = (el as any).width;
          const eh = (el as any).height;
          if (
            comment.x >= ex &&
            comment.x <= ex + ew &&
            comment.y >= ey &&
            comment.y <= ey + eh
          ) {
            targetElementId = el.id;
            break;
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // use functional update to avoid stale closure
    setCommentIcons((prev) => ({
      ...prev,
      [id]: {
        x: comment.id ? comment.x - 60 : comment.x,
        y: comment.y,
        id,
        value: comment.value,
        ...(targetElementId ? { elementId: targetElementId } : {}),
      },
    }));
    const pinMsg = `saveComment: added pin id=${id} targetElementId=${targetElementId}`;
    console.log(pinMsg, { id, targetElementId, comment });
    pushUiLog(pinMsg);

    // flash a small visual indicator so users see a save happened even if logs are hidden
    try {
      const rootEl = appRef.current as HTMLElement | null;
      if (rootEl) {
        const flash = document.createElement("div");
        flash.textContent = "Saved";
        flash.style.position = "fixed";
        flash.style.right = "12px";
        flash.style.bottom = "12px";
        flash.style.background = "#059669";
        flash.style.color = "white";
        flash.style.padding = "8px 12px";
        flash.style.borderRadius = "6px";
        flash.style.zIndex = "9999999999";
        rootEl.appendChild(flash);
        setTimeout(() => flash.remove(), 1800);
      }
    } catch (e) {
      // ignore
    }

    // Also add to threads so multiple comments per element are preserved
    const commentObj = { id, value: comment.value || "", created: Date.now() };
    if (targetElementId) {
      setThreads((prev) => {
        const existing = prev[targetElementId!];
        if (existing) {
          return {
            ...prev,
            [targetElementId!]: {
              ...existing,
              comments: [...existing.comments, commentObj],
            },
          };
        }
        return {
          ...prev,
          [targetElementId!]: {
            id: nanoid(),
            elementId: targetElementId!,
            x: comment.x,
            y: comment.y,
            comments: [commentObj],
          },
        };
      });
      const thrMsg = `saveComment: threads updated for target ${targetElementId}`;
      console.log(thrMsg, targetElementId);
      pushUiLog(thrMsg);
      // open the thread overlay for the element we just commented on
      setOpenThreadElementId(targetElementId);
    } else {
      // create a standalone thread keyed by the comment icon id
      setThreads((prev) => ({
        ...prev,
        [id]: {
          id,
          elementId: id,
          x: comment.x,
          y: comment.y,
          comments: [commentObj],
        },
      }));
      const thrMsg2 = `saveComment: created standalone thread ${id}`;
      console.log(thrMsg2, id);
      pushUiLog(thrMsg2);
      // open the standalone thread we just created
      setOpenThreadElementId(id);
    }

    setComment(null);
  };

  const renderComment = () => {
    if (!comment) {
      return null;
    }
    const appState = excalidrawAPI?.getAppState()!;
    const { x, y } = sceneCoordsToViewportCoords(
      { sceneX: comment.x, sceneY: comment.y },
      appState,
    );
    let top = y - COMMENT_ICON_DIMENSION / 2 - appState.offsetTop;
    let left = x - COMMENT_ICON_DIMENSION / 2 - appState.offsetLeft;

    if (
      top + COMMENT_INPUT_HEIGHT <
      appState.offsetTop + COMMENT_INPUT_HEIGHT
    ) {
      top = COMMENT_ICON_DIMENSION / 2;
    }
    if (top + COMMENT_INPUT_HEIGHT > appState.height) {
      top = appState.height - COMMENT_INPUT_HEIGHT - COMMENT_ICON_DIMENSION / 2;
    }
    if (
      left + COMMENT_INPUT_WIDTH <
      appState.offsetLeft + COMMENT_INPUT_WIDTH
    ) {
      left = COMMENT_ICON_DIMENSION / 2;
    }
    if (left + COMMENT_INPUT_WIDTH > appState.width) {
      left = appState.width - COMMENT_INPUT_WIDTH - COMMENT_ICON_DIMENSION / 2;
    }

    return (
      <textarea
        className="comment"
        id="comment-textarea"
        name="comment"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          position: "absolute",
          zIndex: 1,
          height: `${COMMENT_INPUT_HEIGHT}px`,
          width: `${COMMENT_INPUT_WIDTH}px`,
        }}
        ref={(ref) => {
          setTimeout(() => ref?.focus());
        }}
        placeholder={comment.value ? "Reply" : "Comment"}
        value={comment.value}
        onChange={(event) => {
          setComment({ ...comment, value: event.target.value });
        }}
        onBlur={saveComment}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === "Enter") {
            event.preventDefault();
            saveComment();
          }
        }}
      />
    );
  };

  const onOpenThread = (ev: any) => {
    const elementId = ev.detail?.elementId;
    if (!elementId) return;
    setOpenThreadElementId(elementId);
  };

  useEffect(() => {
    window.addEventListener("excalidraw:openCommentThread", onOpenThread as any);
    return () => window.removeEventListener("excalidraw:openCommentThread", onOpenThread as any);
  }, []);

  const submitReply = (elementId: string, value: string) => {
    if (!value.trim()) return;
    const id = nanoid();
    setThreads((prev) => {
      const t = prev[elementId];
      if (!t) return prev;
      return {
        ...prev,
        [elementId]: {
          ...t,
          comments: [...t.comments, { id, value: value.trim(), created: Date.now() }],
        },
      };
    });
  };

  const renderThreadOverlay = () => {
    if (!openThreadElementId || !excalidrawAPI) return null;
    const thread = threads[openThreadElementId];
    if (!thread) return null;
    const appState = excalidrawAPI.getAppState();
    const { x, y } = sceneCoordsToViewportCoords(
      { sceneX: thread.x, sceneY: thread.y },
      appState,
    );
    let top = y - COMMENT_ICON_DIMENSION / 2 - appState.offsetTop;
    let left = x - COMMENT_ICON_DIMENSION / 2 - appState.offsetLeft;

    const THREAD_W = 300;
    const THREAD_H = 200;
    if (top + THREAD_H > appState.height) {
      top = appState.height - THREAD_H - 12;
    }
    if (left + THREAD_W > appState.width) {
      left = appState.width - THREAD_W - 12;
    }

    return (
      <div
        className="comment-thread-overlay"
        style={{
          position: "absolute",
          zIndex: 100000,
          // allow pointer events to pass through to the canvas except for the interactive card
          pointerEvents: "none",
          top: `${top}px`,
          left: `${left}px`,
          width: `${THREAD_W}px`,
          maxHeight: `${THREAD_H}px`,
        }}
      >
        <div className="thread-card" style={{ pointerEvents: "auto" }}>
          <div className="thread-header">
            <div className="thread-resolve">
              <label className="switch">
                <input type="checkbox" />
                <span className="slider" />
              </label>
              <span className="resolve-label">Resolve</span>
            </div>
            <div className="thread-actions">
              <span className="color-dot" style={{ background: "#9be564" }} />
              <span className="color-dot" style={{ background: "#ff4d4f" }} />
              <span className="color-dot" style={{ background: "#45b8ff" }} />
              <span className="color-dot" style={{ background: "#000" }} />
              <button className="bell">🔔</button>
              <button className="more">⋯</button>
            </div>
          </div>

          <div className="thread-messages">
            {thread.comments.map((c) => (
              <div key={c.id} className="thread-message">
                <div className="thread-message-left">
                  <div className="thread-avatar">
                    <div className="comment-avatar-initial">
                      {c.value ? c.value.trim()[0]?.toUpperCase() : "V"}
                    </div>
                  </div>
                </div>
                <div className="thread-message-right">
                  <div className="message-meta">
                    <div className="author">Vineela Appasani</div>
                    <div className="time">Today, 16:12</div>
                  </div>
                  <div className="message-body">{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="thread-reply">
            <input
                id="thread-reply-input"
                name="thread-reply"
                placeholder="Leave a reply. Use @ to mention."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  submitReply(openThreadElementId, val);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
            <button className="reply-send">➤</button>
          </div>
        </div>
      </div>
    );
  };

  const renderMenu = () => {
    return (
      <MainMenu>
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.Export />
        <MainMenu.Separator />
        <MainMenu.DefaultItems.LiveCollaborationTrigger
          isCollaborating={isCollaborating}
          onSelect={() => window.alert("You clicked on collab button")}
        />
        <MainMenu.Group title="Excalidraw links">
          <MainMenu.DefaultItems.Socials />
        </MainMenu.Group>
        <MainMenu.Separator />
        <MainMenu.ItemCustom>
          <button
            style={{ height: "2rem" }}
            onClick={() => window.alert("custom menu item")}
          >
            custom item
          </button>
        </MainMenu.ItemCustom>
        <MainMenu.DefaultItems.Help />

        {excalidrawAPI && (
          <MobileFooter
            excalidrawLib={excalidrawLib}
            excalidrawAPI={excalidrawAPI}
          />
        )}
      </MainMenu>
    );
  };

  return (
    <div className="App" ref={appRef}>
      <h1>{appTitle}</h1>
      {/* Debug badge: shows counts of threads/comment icons */}
      <div
        style={{
          position: "fixed",
          right: 12,
          top: 12,
          zIndex: 2147483647,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "6px 10px",
          borderRadius: 6,
          fontSize: 12,
        }}
        id="debug-comment-badge"
      >
        Threads: {Object.keys(threads).length} • Pins: {Object.keys(commentIcons).length}
      </div>
      {/* In-app visible logs for debugging when console logs aren't visible */}
      <div className="in-app-logs" role="status" aria-live="polite">
        <div className="in-app-logs__title">Logs</div>
        <div className="in-app-logs__lines">
          {uiLogs.slice(-8).reverse().map((l, i) => (
            <div key={i} className="in-app-logs__line">
              {l}
            </div>
          ))}
        </div>
      </div>
      {/* TODO fix type */}
      <ExampleSidebar>
        <div className="button-wrapper">
          <button onClick={loadSceneOrLibrary}>Load Scene or Library</button>
          <button className="update-scene" onClick={updateScene}>
            Update Scene
          </button>
          <button
            className="reset-scene"
            onClick={() => {
              excalidrawAPI?.resetScene();
            }}
          >
            Reset Scene
          </button>
          <button
            onClick={() => {
              const libraryItems: LibraryItems = [
                {
                  status: "published",
                  id: "1",
                  created: 1,
                  elements: initialData.libraryItems[1] as any,
                },
                {
                  status: "unpublished",
                  id: "2",
                  created: 2,
                  elements: initialData.libraryItems[1] as any,
                },
              ];
              excalidrawAPI?.updateLibrary({
                libraryItems,
              });
            }}
          >
            Update Library
          </button>

          <label>
            <input
              type="checkbox"
              checked={viewModeEnabled}
              onChange={() => setViewModeEnabled(!viewModeEnabled)}
            />
            View mode
          </label>
          <label>
            <input
              type="checkbox"
              checked={zenModeEnabled}
              onChange={() => setZenModeEnabled(!zenModeEnabled)}
            />
            Zen mode
          </label>
          <label>
            <input
              type="checkbox"
              checked={gridModeEnabled}
              onChange={() => setGridModeEnabled(!gridModeEnabled)}
            />
            Grid mode
          </label>
          <label>
            <input
              type="checkbox"
              checked={renderScrollbars}
              onChange={() => setRenderScrollbars(!renderScrollbars)}
            />
            Render scrollbars
          </label>
          <label>
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={() => {
                setTheme(theme === "light" ? "dark" : "light");
              }}
            />
            Switch to Dark Theme
          </label>
          <label>
            <input
              type="checkbox"
              checked={disableImageTool === true}
              onChange={() => {
                setDisableImageTool(!disableImageTool);
              }}
            />
            Disable Image Tool
          </label>
          <label>
            <input
              type="checkbox"
              checked={isCollaborating}
              onChange={() => {
                if (!isCollaborating) {
                  const collaborators = new Map();
                  collaborators.set("id1", {
                    username: "Doremon",
                    avatarUrl: "images/doremon.png",
                  });
                  collaborators.set("id2", {
                    username: "Excalibot",
                    avatarUrl: "images/excalibot.png",
                  });
                  collaborators.set("id3", {
                    username: "Pika",
                    avatarUrl: "images/pika.jpeg",
                  });
                  collaborators.set("id4", {
                    username: "fallback",
                    avatarUrl: "https://example.com",
                  });
                  excalidrawAPI?.updateScene({ collaborators });
                } else {
                  excalidrawAPI?.updateScene({
                    collaborators: new Map(),
                  });
                }
                setIsCollaborating(!isCollaborating);
              }}
            />
            Show collaborators
          </label>
          <div>
            <button onClick={onCopy.bind(null, "png")}>
              Copy to Clipboard as PNG
            </button>
            <button onClick={onCopy.bind(null, "svg")}>
              Copy to Clipboard as SVG
            </button>
            <button onClick={onCopy.bind(null, "json")}>
              Copy to Clipboard as JSON
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: "1em",
              justifyContent: "center",
              marginTop: "1em",
            }}
          >
            <div>x: {pointerData?.pointer.x ?? 0}</div>
            <div>y: {pointerData?.pointer.y ?? 0}</div>
          </div>
        </div>
        <div className="excalidraw-wrapper">
          {renderExcalidraw(children)}
          {(Object.keys(commentIcons || []).length > 0 || Object.keys(threads).length > 0) && renderCommentIcons()}
            {comment && renderComment()}
            {renderThreadOverlay()}
        </div>

        <div className="export-wrapper button-wrapper">
          <label className="export-wrapper__checkbox">
            <input
              type="checkbox"
              checked={exportWithDarkMode}
              onChange={() => setExportWithDarkMode(!exportWithDarkMode)}
            />
            Export with dark mode
          </label>
          <label className="export-wrapper__checkbox">
            <input
              type="checkbox"
              checked={exportEmbedScene}
              onChange={() => setExportEmbedScene(!exportEmbedScene)}
            />
            Export with embed scene
          </label>
          <button
            onClick={async () => {
              if (!excalidrawAPI) {
                return;
              }
              const svg = await exportToSvg({
                elements: excalidrawAPI?.getSceneElements(),
                appState: {
                  ...initialData.appState,
                  exportWithDarkMode,
                  exportEmbedScene,
                  width: 300,
                  height: 100,
                },
                files: excalidrawAPI?.getFiles(),
              });
              appRef.current.querySelector(".export-svg").innerHTML =
                svg.outerHTML;
            }}
          >
            Export to SVG
          </button>
          <div className="export export-svg"></div>

          <button
            onClick={async () => {
              if (!excalidrawAPI) {
                return;
              }
              const blob = await exportToBlob({
                elements: excalidrawAPI?.getSceneElements(),
                mimeType: "image/png",
                appState: {
                  ...initialData.appState,
                  exportEmbedScene,
                  exportWithDarkMode,
                },
                files: excalidrawAPI?.getFiles(),
              });
              setBlobUrl(window.URL.createObjectURL(blob));
            }}
          >
            Export to Blob
          </button>
          <div className="export export-blob">
            <img src={blobUrl} alt="" />
          </div>
          <button
            onClick={async () => {
              if (!excalidrawAPI) {
                return;
              }
              const canvas = await exportToCanvas({
                elements: excalidrawAPI.getSceneElements(),
                appState: {
                  ...initialData.appState,
                  exportWithDarkMode,
                },
                files: excalidrawAPI.getFiles(),
              });
              const ctx = canvas.getContext("2d")!;
              ctx.font = "30px Excalifont";
              ctx.strokeText("My custom text", 50, 60);
              setCanvasUrl(canvas.toDataURL());
            }}
          >
            Export to Canvas
          </button>
          <button
            onClick={async () => {
              if (!excalidrawAPI) {
                return;
              }
              const canvas = await exportToCanvas({
                elements: excalidrawAPI.getSceneElements(),
                appState: {
                  ...initialData.appState,
                  exportWithDarkMode,
                },
                files: excalidrawAPI.getFiles(),
              });
              const ctx = canvas.getContext("2d")!;
              ctx.font = "30px Excalifont";
              ctx.strokeText("My custom text", 50, 60);
              setCanvasUrl(canvas.toDataURL());
            }}
          >
            Export to Canvas
          </button>
          <button
            type="button"
            onClick={() => {
              if (!excalidrawAPI) {
                return;
              }

              const elements = excalidrawAPI.getSceneElements();
              excalidrawAPI.scrollToContent(elements[0], {
                fitToViewport: true,
              });
            }}
          >
            Fit to viewport, first element
          </button>
          <button
            type="button"
            onClick={() => {
              if (!excalidrawAPI) {
                return;
              }

              const elements = excalidrawAPI.getSceneElements();
              excalidrawAPI.scrollToContent(elements[0], {
                fitToContent: true,
              });

              excalidrawAPI.scrollToContent(elements[0], {
                fitToContent: true,
              });
            }}
          >
            Fit to content, first element
          </button>
          <button
            type="button"
            onClick={() => {
              if (!excalidrawAPI) {
                return;
              }

              const elements = excalidrawAPI.getSceneElements();
              excalidrawAPI.scrollToContent(elements[0], {
                fitToContent: true,
              });

              excalidrawAPI.scrollToContent(elements[0]);
            }}
          >
            Scroll to first element, no fitToContent, no fitToViewport
          </button>
          <div className="export export-canvas">
            <img src={canvasUrl} alt="" />
          </div>
        </div>
      </ExampleSidebar>
    </div>
  );
}
