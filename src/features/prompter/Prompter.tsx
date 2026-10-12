// src/features/prompter/Prompter.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Toolbar,
  AppBar,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Speed,
  TextIncrease,
  TextDecrease,
  FlipCameraIos,
  Fullscreen,
  FullscreenExit,
  VerticalAlignTop,
} from '@mui/icons-material';
import { useGetLiveStoryQuery } from '../../services/api';

const Prompter: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(3);
  const [fontSize, setFontSize] = useState(64);
  const [isMirrored, setIsMirrored] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number>(1000);

  const { data: liveStory } = useGetLiveStoryQuery(undefined, {
    pollingInterval: 1000,
  });

  // Auto-scroll
  useEffect(() => {
    if (isPlaying && viewportRef.current) {
      intervalRef.current = window.setInterval(() => {
        if (viewportRef.current) {
          viewportRef.current.scrollTop += speed * 0.5;
        }
      }, 20);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setSpeed((prev) => Math.min(10, prev + 1));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setSpeed((prev) => Math.max(1, prev - 1));
      } else if (e.code === 'Home') {
        e.preventDefault();
        if (viewportRef.current) viewportRef.current.scrollTop = 0;
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isPlaying]);

  const text = liveStory?.text || 'کوئی اسٹوری پرامٹر پر نہیں بھیجی گئی...';
  const slug = liveStory?.slug || 'WAITING FOR STORY...';

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        bgcolor: '#000',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Controls Bar */}
      <AppBar
        position="fixed"
        sx={{
          top: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(20,20,20,0.85)',
          backdropFilter: 'blur(4px)',
          borderBottom: '2px solid #dc2626',
          boxShadow: 'none',
          zIndex: 1000,
          transition: 'opacity 0.3s',
          '&:hover': { opacity: 1 },
          opacity: 0.8,
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 48, display: 'flex', gap: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 900, color: '#dc2626', bgcolor: '#fff', px: 1, borderRadius: 1, mr: 1 }}
          >
            NEWS 14 HD
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
              <IconButton color="inherit" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Slower">
              <IconButton color="inherit" onClick={() => setSpeed((s) => Math.max(1, s - 1))}>
                <Speed fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ minWidth: 30, textAlign: 'center' }}>
              {speed}
            </Typography>
            <Tooltip title="Faster">
              <IconButton color="inherit" onClick={() => setSpeed((s) => Math.min(10, s + 1))}>
                <Speed fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Font -">
              <IconButton color="inherit" onClick={() => setFontSize((f) => Math.max(32, f - 8))}>
                <TextDecrease fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center' }}>
              {fontSize}px
            </Typography>
            <Tooltip title="Font +">
              <IconButton color="inherit" onClick={() => setFontSize((f) => Math.min(180, f + 8))}>
                <TextIncrease fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Tooltip title={isMirrored ? 'Normal' : 'Mirror'}>
            <IconButton color="inherit" onClick={() => setIsMirrored(!isMirrored)}>
              <FlipCameraIos fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Top">
            <IconButton color="inherit" onClick={() => viewportRef.current?.scrollTo(0, 0)}>
              <VerticalAlignTop fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Fullscreen">
            <IconButton color="inherit" onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Reading guide line */}
      <Box
        sx={{
          position: 'fixed',
          top: '35%',
          left: 0,
          right: 0,
          height: 2,
          bgcolor: 'rgba(220,38,38,0.4)',
          pointerEvents: 'none',
          zIndex: 50,
          '&::before': {
            content: '"►"',
            position: 'absolute',
            left: 10,
            top: -10,
            color: '#dc2626',
            fontSize: 16,
          },
        }}
      />

      {/* Scrollable content */}
      <Box
        ref={viewportRef}
        sx={{
          flex: 1,
          overflowY: 'scroll',
          overflowX: 'hidden',
          padding: '60px 10% 70vh 10%',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          mt: 6,
        }}
      >
        <Box
          sx={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
            color: '#fff',
            textAlign: 'right',
            direction: 'rtl',
            fontFamily: '"Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "Urdu Typesetting", serif',
            fontWeight: 600,
            transform: isMirrored ? 'scaleX(-1)' : 'none',
            transition: 'transform 0.3s',
          }}
        >
          <Box
            sx={{
              fontSize: fontSize * 0.4,
              color: '#fca5a5',
              bgcolor: 'rgba(220,38,38,0.15)',
              borderRight: '4px solid #dc2626',
              padding: '4px 14px',
              marginBottom: 3,
              display: 'inline-block',
              direction: 'ltr',
              textAlign: 'left',
              borderRadius: 1,
              fontFamily: '"Segoe UI", Arial, sans-serif',
            }}
          >
            {slug}
          </Box>
          <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
        </Box>
      </Box>
    </Box>
  );
};

export default Prompter;