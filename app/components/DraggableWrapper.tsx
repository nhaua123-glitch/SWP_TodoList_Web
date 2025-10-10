"use client";

import { ReactNode, useRef, useState } from "react";
import Draggable, { DraggableEventHandler } from "react-draggable";

/**
 * Wrapper tương thích React 18+ cho react-draggable
 * Giữ nguyên hành vi kéo thả, tránh lỗi findDOMNode
 */
export default function DraggableWrapper({
  children,
  handle,
  defaultPosition = { x: 0, y: 0 },
}: {
  children: ReactNode;
  handle?: string;
  defaultPosition?: { x: number; y: number };
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(defaultPosition);

  const handleDrag: DraggableEventHandler = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      handle={handle}
      position={position}
      onDrag={handleDrag}
    >
      <div ref={nodeRef} style={{ zIndex: 9999 }}>
        {children}
      </div>
    </Draggable>
  );
}
