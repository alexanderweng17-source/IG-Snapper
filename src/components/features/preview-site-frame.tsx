"use client";

import { useEffect, useRef, useState } from "react";

const previewPaths: Record<string, string> = {
  home: "/",
  pricing: "/pricing",
  download: "/download",
  faq: "/faq",
};

export function PreviewSiteFrame({
  page = "home",
  planSlug,
}: {
  page?: "home" | "pricing" | "download" | "faq" | "checkout";
  planSlug?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState("100vh");
  const fragment = page === "checkout" && planSlug
    ? `checkout/${encodeURIComponent(planSlug)}`
    : page;

  useEffect(() => {
    function receiveMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;

      if (event.data?.type === "ig-snapper-preview-height") {
        const value = Number(event.data.height);
        if (Number.isFinite(value)) setHeight(`${Math.max(600, Math.min(14000, Math.ceil(value)))}px`);
      }

      if (event.data?.type === "ig-snapper-preview-route" && typeof event.data.route === "string") {
        const target = previewPaths[event.data.route];
        if (target && window.location.pathname !== target) {
          window.history.pushState({ igSnapperPreview: true }, "", target);
        }
      }
    }

    window.addEventListener("message", receiveMessage);
    return () => window.removeEventListener("message", receiveMessage);
  }, []);

  return (
    <iframe
      ref={frame}
      title="IG Snapper website"
      src={`/preview.html#${fragment}`}
      className="block w-full border-0 bg-[#0a0c14]"
      style={{ height, minHeight: "100vh", border: 0 }}
      loading="eager"
      allow="clipboard-write"
    />
  );
}
