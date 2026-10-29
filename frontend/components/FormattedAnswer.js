import React from "react";

function InlineText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default function FormattedAnswer({ text }) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];
  let listType = null;

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push({ type: "p", content: paragraph.join(" ") });
      paragraph = [];
    }
  }
  function flushList() {
    if (list.length) {
      blocks.push({ type: listType, items: list });
      list = [];
      listType = null;
    }
  }

  lines.forEach(line => {
    const trimmed = line.trim();
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    const bullet = trimmed.match(/^[-*•]\s+(.+)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (!trimmed) {
      flushParagraph(); flushList();
    } else if (heading) {
      flushParagraph(); flushList();
      blocks.push({ type: "h" + Math.min(heading[1].length, 3), content: heading[2] });
    } else if (bullet || numbered) {
      flushParagraph();
      const nextType = bullet ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      list.push((bullet || numbered)[1]);
    } else {
      flushList();
      paragraph.push(trimmed);
    }
  });
  flushParagraph(); flushList();

  return <div className="formatted-answer">
    {blocks.map((block, index) => {
      if (block.type === "ul" || block.type === "ol") {
        const Tag = block.type;
        return <Tag key={index}>{block.items.map((item, i) => <li key={i}><InlineText text={item} /></li>)}</Tag>;
      }
      const Tag = block.type;
      return <Tag key={index}><InlineText text={block.content} /></Tag>;
    })}
  </div>;
}
