import React, { useRef, useState, useEffect } from 'react';

interface ResizableSplitterProps {
  width: number;
  onResize: (newWidth: number) => void;
  minWidth?: number;
  maxWidth?: number | string;
}

const ResizableSplitter: React.FC<ResizableSplitterProps> = ({ width, onResize, minWidth = 200, maxWidth = '75%' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;
      const newWidth = containerRect.right - e.clientX;
      const maxVal = typeof maxWidth === 'string' ? containerRect.width * 0.75 : maxWidth;
      const clamped = Math.min(Math.max(newWidth, minWidth), maxVal);
      onResize(clamped);
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onResize, minWidth, maxWidth]);

  return (
    <div
      ref={containerRef}
      style={{
        width: 6,
        cursor: 'col-resize',
        backgroundColor: '#f4f4f5',
        borderLeft: '1px solid #e4e4e7',
        borderRight: '1px solid #e4e4e7',
        flexShrink: 0,
        position: 'relative',
      }}
      onMouseDown={() => setIsDragging(true)}
    >
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 2, height: 24, backgroundColor: '#a1a1aa', borderRadius: 1 }} />
    </div>
  );
};

export default ResizableSplitter;