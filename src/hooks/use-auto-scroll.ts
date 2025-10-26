// src/hooks/use-auto-scroll.ts
import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoScrollOptions {
  offset?: number;
  smooth?: boolean;
  content?: React.ReactNode;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const { offset = 20, smooth = false, content } = options;
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastContentHeight = useRef(0);

  const [scrollState, setScrollState] = useState({
    isAtBottom: true,
    autoScrollEnabled: true,
  });

  const checkIsAtBottom = useCallback(
    (element: HTMLElement) => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceToBottom = Math.abs(scrollHeight - scrollTop - clientHeight);
      return distanceToBottom <= offset;
    },
    [offset]
  );

  const scrollToBottom = useCallback(
    (instant?: boolean) => {
      if (!scrollRef.current) return;
      const target = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
      if (instant) {
        scrollRef.current.scrollTop = target;
      } else {
        scrollRef.current.scrollTo({ top: target, behavior: smooth ? "smooth" : "auto" });
      }
      setScrollState({ isAtBottom: true, autoScrollEnabled: true });
    },
    [smooth]
  );

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const atBottom = checkIsAtBottom(scrollRef.current);
    setScrollState((prev) => ({ ...prev, isAtBottom: atBottom }));
    if (atBottom) setScrollState({ isAtBottom: true, autoScrollEnabled: true });
  }, [checkIsAtBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const currentHeight = el.scrollHeight;
    const hasNewContent = currentHeight !== lastContentHeight.current;
    if (hasNewContent) {
      if (scrollState.autoScrollEnabled) {
        requestAnimationFrame(() => {
          scrollToBottom(lastContentHeight.current === 0);
        });
      }
      lastContentHeight.current = currentHeight;
    }
  }, [content, scrollState.autoScrollEnabled, scrollToBottom]);

  const disableAutoScroll = useCallback(() => {
    const atBottom = scrollRef.current ? checkIsAtBottom(scrollRef.current) : false;
    if (!atBottom) {
      setScrollState((prev) => ({ ...prev, autoScrollEnabled: false }));
    }
  }, [checkIsAtBottom]);

  return {
    scrollRef,
    isAtBottom: scrollState.isAtBottom,
    autoScrollEnabled: scrollState.autoScrollEnabled,
    scrollToBottom: () => scrollToBottom(false),
    disableAutoScroll,
    handleScroll,
  };
}
