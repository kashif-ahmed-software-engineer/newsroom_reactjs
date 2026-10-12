// src/components/StoryCard.tsx
import React, { useState } from 'react';
import { Box, Checkbox, IconButton, Tooltip, Snackbar,  Alert } from '@mui/material';
import { Story } from '../../types';
import { statusColors, getUserFromStorage } from '../../util/helpers';
import { useSetLiveStoryMutation } from '../../services/api';
import StoryHistoryModal from './StoryHistoryModal';


interface StoryCardProps {
  story: Story;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onPrint?: () => void;
  onSendToRundown?: () => void;
  onDelete?: () => void;
  showCheckbox?: boolean;
  draggable?: boolean;
  dragPayload?: number[];
  onDragStart?: (e: React.DragEvent) => void;
  onStoryUpdated: () => void;
}

function createDragBadge(count: number): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `
    position: absolute; top: -1000px; left: -1000px;
    background: #881337; color: #fff; padding: 4px 10px;
    border-radius: 12px; font: bold 12px sans-serif;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 9999;
  `;
  el.textContent = `${count} stories`;
  document.body.appendChild(el);
  setTimeout(() => el.parentNode?.removeChild(el), 0);
  return el;
}

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  selected,
  onSelect,
  onClick,
  onPrint,
  onSendToRundown,
  onDelete,
  showCheckbox = true,
  draggable = false,
  dragPayload,
  onDragStart,
  onStoryUpdated,
}) => {
  const isLocked = story.locked_by !== null;
  const statusColor = statusColors[story.status] || '#gray';
  const [setLiveStory] = useSetLiveStoryMutation();
  const [historyOpen, setHistoryOpen] = useState(false);
  const user = getUserFromStorage();
 

  const [snackbar, setSnackbar] = useState<{
      open: boolean;
      message: string;
      severity: 'success' | 'info' | 'warning' | 'error';
    }>({ open: false, message: '', severity: 'warning' });

  const idsToDrag = dragPayload && dragPayload.length > 0 ? dragPayload : [story.id];

  const handleDragStart = (e: React.DragEvent) => {

    if (user?.permission?.can_send_to_rundown === false) {
      setSnackbar({
        open: true,
        message: `You don't have permission to send a story to the rundown.`,
        severity: 'warning',
      });
      return;
    }

    e.dataTransfer.setData('application/x-story-ids', JSON.stringify(idsToDrag));
    e.dataTransfer.setData('text/plain', JSON.stringify(idsToDrag));
    e.dataTransfer.effectAllowed = 'copyMove';
    if (idsToDrag.length > 1) {
      try { e.dataTransfer.setDragImage(createDragBadge(idsToDrag.length), 0, 0); } catch {}
    }
    onDragStart?.(e);
  };

  const verifySendToRundownPermission = () => {
    if (user?.permission?.can_send_to_rundown === false) {
      setSnackbar({
        open: true,
        message: `You don't have permission to send a story to the rundown.`,
        severity: 'warning',
      });
      return false;
    }
    return true;
  }

  const handleThrowPrompter = async () => {

    if (user?.permission?.can_use_dash_prompter === false) {
      setSnackbar({
        open: true,
        message: `You don't have permission to send a story to the prompter.`,
        severity: 'warning',
      });
      return;
    }

    const text = story.oc_text || story.body_text || story.slug;
    await setLiveStory({ slug: story.slug, text }).unwrap();
  };

  const handleStoryHistory = async () => {

    if (user?.permission?.can_view_story_history == false) {
      setSnackbar({
        open: true,
        message: `You don't have permission to view the history of the story.`,
        severity: 'warning',
      });
      return;      
    }
    setHistoryOpen(true);  
  }

  return (
    <Box
      draggable={draggable}
      onDragStart={handleDragStart}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 32,
        px: 1,
        borderBottom: 1,
        borderColor: 'divider',
        cursor: 'grab',
        fontSize: 11,
        bgcolor: selected ? 'action.selected' : 'transparent',
        '&:hover': { bgcolor: 'action.hover' },
        '&:active': { cursor: 'grabbing' },
        ...(story.status === 'black' && {
          bgcolor: '#111827 !important',
          color: '#6b7280 !important',
          '& .slug-title': {
            textDecoration: 'line-through',
            color: '#9ca3af',
            opacity: 0.8,
          },
        }),
      }}
      onClick={onClick}
    >
      {showCheckbox && (
        <Checkbox
          size="small"
          checked={selected}
          onChange={(e) => { e.stopPropagation(); onSelect(); }}
          sx={{ p: 0.3, mr: 0.5 }}
        />
      )}

      {/* RC = rundown count */}
      <Box sx={{ width: 30, textAlign: 'center', fontSize: 10 }}>
        {story.rundown_count}
      </Box>

      {/* ST = status bulb */}
      <Box sx={{ width: 30, textAlign: 'center' }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: statusColor,
            display: 'inline-block',
            boxShadow: `0 0 8px ${statusColor}`,
          }}
        />
      </Box>

      {/* SLUG */}
      <Box
        sx={{
          flex: 1,
          pl: 1,
          fontWeight: 600,
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          minWidth: 0,
        }}
      >
        {isLocked && (
          <Tooltip title={`Locked by ${story.locked_by_name || 'someone'}`}>
            <span style={{ fontSize: 13 }}>🔒</span>
          </Tooltip>
        )}
        <span
          className="slug-title"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {story.slug}
        </span>
      </Box>

      {/* DUR */}
      <Box sx={{ width: 50, fontSize: 11 }}>{story.duration}</Box>

      {/* FMT */}
      <Box sx={{ width: 60, fontSize: 11 }}>{story.format}</Box>

      {/* CREATED */}
      <Box sx={{ width: 100, fontSize: 10, color: 'text.secondary' }}>
        {story.filed_by + ' '} {new Date(story.created_at).toLocaleDateString()}
      </Box>

      {/* MODIFIED */}
      <Box sx={{ width: 100, fontSize: 10, color: 'text.secondary' }}>
        {story.locked_by_name ? story.locked_by_name : story.filed_by + ' '} {new Date(story.updated_at).toLocaleDateString()}
      </Box>

      {/* ACTIONS */}
      <Box
        sx={{
          width: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 0.3,
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {onSendToRundown && (
          <Tooltip title="Send to Rundown">
            <IconButton size="small" sx={{ p: 0.4 }} onClick={() => {
              if (verifySendToRundownPermission()) {
                onSendToRundown();
              }
            }}>
              ➡️
            </IconButton>
          </Tooltip>
        )}

        

        {onPrint && (
          <Tooltip title="Print">
            <IconButton size="small" sx={{ p: 0.4 }} onClick={onPrint}>
              🖨️
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Send to Prompter">
          <IconButton size="small" sx={{ p: 0.4 }} onClick={handleThrowPrompter}>
            ⚡
          </IconButton>
        </Tooltip>
        <Tooltip title="View Story History">
          <IconButton size="small" sx={{ p: 0.4 }} onClick={handleStoryHistory}>
            📜
          </IconButton>
        </Tooltip>
        
        {onDelete && (
          <Tooltip title="Delete">
            <IconButton size="small" sx={{ p: 0.4 }} color="error" onClick={onDelete}>
              🗑
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Snackbar
              open={snackbar.open}
              autoHideDuration={3000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <Alert
                severity={snackbar.severity}
                variant="filled"
                onClose={() => setSnackbar({ ...snackbar, open: false })}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>

            <StoryHistoryModal
                    open={historyOpen}
                    storyId={story?.id ?? null}
                    onClose={() => setHistoryOpen(false)}
                    onRestored={() => onStoryUpdated()}
                  />
    </Box>
    
  );
};

export default StoryCard;