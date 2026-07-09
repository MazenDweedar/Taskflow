import { useRef, useState, MouseEvent, WheelEvent } from 'react';

export function useScrollContainer(isDndActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: MouseEvent) => {
    if (isDndActive || !containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isDndActive || !containerRef.current) return;
    e.preventDefault(); // Prevent text selection while dragging
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast factor
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const [isWheeling, setIsWheeling] = useState(false);
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleWheel = (e: WheelEvent) => {
    if (!containerRef.current) return;
    // Translate vertical scroll wheel movement to horizontal scrolling
    if (e.deltaY !== 0) {
      setIsWheeling(true);
      containerRef.current.scrollLeft += e.deltaY;
      
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
      wheelTimeout.current = setTimeout(() => {
        setIsWheeling(false);
      }, 150);
    }
  };

  return {
    containerRef,
    isDragging,
    isWheeling,
    events: {
      onMouseDown: handleMouseDown,
      onMouseLeave: handleMouseLeave,
      onMouseUp: handleMouseUp,
      onMouseMove: handleMouseMove,
      onWheel: handleWheel,
    }
  };
}
