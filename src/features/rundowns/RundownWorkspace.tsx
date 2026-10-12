// src/features/rundown/RundownWorkspace.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Chip,
  TextareaAutosize,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Preview as PreviewIcon,
  Close as CloseIcon,
  DeleteRounded,
} from '@mui/icons-material';
import { Story, Rundown } from '../../types';
import {
  useUpdateRundownMutation,
  useUpdateStoryMutation,
  useLockStoryMutation,
  useUnlockStoryMutation,
  useSetLiveStoryMutation,
  useDeleteRundownsMutation
} from '../../services/api';
import { getUserFromStorage, esc, statusColors } from '../../util/helpers';
import LockIcon from '@mui/icons-material/Lock';
import { useLockRundownMutation } from '../../services/api';
// inside component:


interface RundownWorkspaceProps {
  id: number;
  rundown: Rundown;
  allRundowns?: Rundown[];         // ← for the dropdown
  allStories: Story[];
  onStoriesChanged: () => void;
  onSelectRundown?: (id: number) => void;  // ← callback for the dropdown
  onAddWorkspace?: () => void;             // ← callback for "+ Add"
}

const RundownWorkspace: React.FC<RundownWorkspaceProps> = ({
  id,
  rundown,
  allRundowns = [],
  allStories,
  onStoriesChanged,
  onSelectRundown,
  onAddWorkspace,
}) => {
  const user = getUserFromStorage();
  const can_reorder_rundown = user?.permission?.can_reorder_rundown || false;
  const can_delete_rundown = user?.permission?.can_delete_rundown || false;
  const can_use_rd_prompter = user?.permission?.can_use_rd_prompter || false;
  const can_print_rundown = user?.permission?.can_print_rundown || false;
  const can_edit_rundown_preview_full = user?.permission?.can_edit_rundown_preview_full || false;
  const can_edit_rundown_preview_slug = user?.permission?.can_edit_rundown_preview_slug || false;

  const [updateRundown] = useUpdateRundownMutation();
  const [updateStory] = useUpdateStoryMutation();
  const [lockStory] = useLockStoryMutation();
  const [unlockStory] = useUnlockStoryMutation();
  const [setLive] = useSetLiveStoryMutation();
  const [deleteRundowns] = useDeleteRundownsMutation();

  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [draftStory, setDraftStory] = useState<Partial<Story>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lockRundown] = useLockRundownMutation();

   const [snackbar, setSnackbar] = useState<{
            open: boolean;
            message: string;
            severity: 'success' | 'info' | 'warning' | 'error';
          }>({ open: false, message: '', severity: 'warning' });

  const isLockedByMe = draftStory.locked_by === user?.id;
  const canEditThis = editMode && (isLockedByMe);

  // Get stories in this rundown
  const stories = (rundown.story_ids || [])
    .map((id) => allStories?.find((s) => s.id === id))
    .filter(Boolean) as Story[];

  const selectedStory = stories.find((s) => s.id === selectedStoryId) || null;

  
  // When selected story changes, reset draft
  useEffect(() => {
    if (selectedStory) {
      setDraftStory(selectedStory);
    }
  }, [selectedStory]);

  // Helper to print the entire rundown (all stories)
const printFullRundown = () => {
  if (can_print_rundown === false) {
    setSnackbar({
      open: true,
      message: `You don't have permission to print this rundown.`,
      severity: 'warning',
    });
    return;
  }

  if (!stories.length) {
    setSnackbar({
      open: true,
      message: 'Rundown is empty — nothing to print.',
      severity: 'info',
    });
    return;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=900');
  if (!printWindow) {
    alert('Please allow popups for printing.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ur" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>Rundown — #${esc(rundown.sys_num)} ${esc(rundown.name)}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body {
          font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', serif;
          margin: 0;
          padding: 15px;
          color: #000;
          background: #fff;
        }
        .rd-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #881337;
          padding-bottom: 10px;
          margin-bottom: 20px;
          direction: ltr;
          font-family: sans-serif;
        }
        .logo { font-size: 20px; font-weight: 900; color: #dc2626; }
        .rd-info { font-size: 14px; font-weight: bold; color: #881337; }
        .story-block {
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 20px;
          padding: 12px 16px;
          page-break-inside: avoid;
        }
        .story-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          direction: ltr;
          font-family: sans-serif;
          font-size: 11px;
          background: #f4f4f5;
          padding: 4px 8px;
          border-radius: 3px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .story-slug {
          font-size: 22px;
          font-weight: 900;
          color: #881337;
          margin-bottom: 10px;
          text-align: right;
          border-bottom: 1px dashed #ddd;
          padding-bottom: 4px;
        }
        .section-label {
          font-family: sans-serif;
          font-size: 10px;
          font-weight: bold;
          color: #881337;
          direction: ltr;
          text-align: left;
          margin: 8px 0 2px;
        }
        .script-text {
          font-size: 20px;
          line-height: 2.1;
          white-space: pre-wrap;
          word-break: break-word;
          text-align: right;
          background: #fafafa;
          padding: 8px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <div class="rd-head">
        <div>
          <span class="logo">NEWS 14 HD</span>
          <div style="font-size:11px;color:#666;margin-top:2px;">BROADCAST RUNDOWN ORDER</div>
        </div>
        <div class="rd-info">
          #${esc(rundown.sys_num)} — ${esc(rundown.name)}
          (${stories.length} Stories · ${formattedDuration})
        </div>
      </div>

      ${stories.map((s, idx) => {
        const oc = (s.oc_text || '').trim();
        const body = (s.body_text || '').trim();
        const cg = (s.template_cg || '').trim();
        return `
          <div class="story-block">
            <div class="story-meta">
              <span>ITEM #${idx + 1}</span>
              <span>FMT: ${esc(s.format || 'OC-VO')}</span>
              <span>DUR: ${esc(s.duration || '00:30')}</span>
              <span>BY: ${esc(s.filed_by || 'Admin')}</span>
            </div>
            <div class="story-slug">${esc(s.slug)}</div>
            ${oc ? `<div class="section-label">ON-CAMERA (OC)</div><div class="script-text">${esc(oc)}</div>` : ''}
            ${body ? `<div class="section-label">VO / PACKAGE / BODY</div><div class="script-text">${esc(body)}</div>` : ''}
            ${cg ? `<div class="section-label">TEMPLATE / CG</div><div class="script-text" style="font-size:17px;">${esc(cg)}</div>` : ''}
          </div>
        `;
      }).join('')}
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
};

  // ---- Print function ----
  const handlePrintRundown = (story: Story) => {
  // If a story is selected, print only that story

  if(can_print_rundown == false)
  {
     setSnackbar({
        open: true,
        message: `You don't have permission to print story.`,
        severity: 'warning',
      });
      return;
  }
  
    printSingleStory(story);
    

};

// Helper to print a single story
const printSingleStory = (story: Story) => {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups for printing.');
    return;
  }

  const oc = story.oc_text || '';
  const body = story.body_text || '';
  const cg = story.template_cg || '';

  const html = `
    <!DOCTYPE html>
    <html lang="ur" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>Print — ${esc(story.slug)}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body {
          font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', serif;
          margin: 0;
          padding: 20px;
          color: #000;
          background: #fff;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #881337;
          padding-bottom: 8px;
          margin-bottom: 15px;
          direction: ltr;
          font-family: sans-serif;
        }
        .logo { font-size: 18px; font-weight: 900; color: #dc2626; }
        .meta { font-size: 12px; color: #555; }
        .slug-title {
          font-size: 24px;
          font-weight: 900;
          color: #881337;
          margin-bottom: 15px;
          text-align: right;
          border-bottom: 1px dashed #ccc;
          padding-bottom: 6px;
        }
        .section-box {
          margin-bottom: 18px;
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .section-label {
          font-family: sans-serif;
          font-size: 11px;
          font-weight: bold;
          color: #881337;
          direction: ltr;
          text-align: left;
          margin-bottom: 6px;
          border-bottom: 1px solid #eee;
          padding-bottom: 2px;
        }
        .script-content {
          font-size: 22px;
          line-height: 2.3;
          white-space: pre-wrap;
          word-break: break-word;
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="header-bar">
        <span class="logo">NEWS 14 HD</span>
        <span class="meta">
          Fmt: ${esc(story.format || 'OC-VO')} | Dur: ${esc(story.duration || '00:30')} | By: ${esc(story.filed_by || 'Admin')}
        </span>
      </div>
      <div class="slug-title">${esc(story.slug)}</div>
      ${oc ? `<div class="section-box"><div class="section-label">ON-CAMERA (OC) SCRIPT</div><div class="script-content">${esc(oc)}</div></div>` : ''}
      ${body ? `<div class="section-box"><div class="section-label">VO / PACKAGE / BODY DETAILS</div><div class="script-content">${esc(body)}</div></div>` : ''}
      ${cg ? `<div class="section-box"><div class="section-label">TEMPLATE / CG NOTES</div><div class="script-content" style="font-size:18px;">${esc(cg)}</div></div>` : ''}
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
};


  // ---- Handlers ----
  const handleMoveStory = async (index: number, direction: 'up' | 'down') => {
    
    if(can_reorder_rundown == false)
    {
      setSnackbar({
        open: true,
        message: `You don't have permission to move up/down story.`,
        severity: 'warning',
      });
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stories.length) return;
    const newIds = [...rundown.story_ids];
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    await updateRundown({ id: rundown.id, body: { story_ids: newIds } }).unwrap();
    onStoriesChanged();
  };

  const handleRemoveStory = async (storyId: number) => {
    if(can_delete_rundown == false)
    {
      setSnackbar({
        open: true,
        message: `You don't have permission to delete story.`,
        severity: 'warning',
      });
      return;
    }
    const newIds = rundown.story_ids.filter((id) => id !== storyId);
    await updateRundown({ id: rundown.id, body: { story_ids: newIds } }).unwrap();
    if (selectedStoryId === storyId) setSelectedStoryId(null);
    onStoriesChanged();
  };

  const handleSelectStory = (id: number) => {
    setSelectedStoryId(id);
    setPreviewOpen(true);
    setEditMode(false);
  };

  const handleLock = async (id: number) => {
    const result = await lockStory({ id }).unwrap();
    if (result.status === 'locked') {
      const lockerName = result.locked_by_name || 'Another user';
      if (result.can_takeover) {
        if (confirm(`Story locked by "${lockerName}". Force takeover?`)) {
          await lockStory({ id, force: true }).unwrap();
          setEditMode(true);
        }
      } else {
        alert(`Story locked by "${lockerName}". You cannot edit.`);
      }
    } else {
      setEditMode(true);
    }
  };

  const handleUnlock = async (id: number) => {
    await unlockStory({ id }).unwrap();
    setEditMode(false);
  };

  const handleSaveStory = async () => {
    if (!selectedStory) return;
    setUpdating(true);
    await updateStory({ id: selectedStory.id, body: draftStory }).unwrap();
    setUpdating(false); 
    setEditMode(false);
    onStoriesChanged();
  };

  const handleThrowToPrompter = async () => {
    if (!selectedStory) return;

    if(can_use_rd_prompter == false)
    {
      setSnackbar({
        open: true,
        message: `You don't have permission to send a story to the prompter.`,
        severity: 'warning',
      });
      return;
    }

    const text = selectedStory.oc_text || selectedStory.body_text || selectedStory.slug;
    await setLive({ slug: selectedStory.slug, text }).unwrap();
  };

  // Calculate total duration
  const totalSeconds = stories.reduce((acc, s) => {
    const parts = (s.duration || '00:00').split(':');
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return acc + mins * 60 + secs;
  }, 0);
  const formattedDuration = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left: Story list */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRight: 1,
          borderColor: 'divider',
        }}
      >
        {/* Header */}
        
        <Box
          sx={{
            p: 1,
            bgcolor: '#f4f4f5',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {/* Left: Rundown picker + title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Select
              value={rundown.id}
              size="small"
              onChange={(e) => onSelectRundown?.(Number(e.target.value))}
              sx={{ minWidth: 160, bgcolor: '#fff', fontSize: 12 }}
            >
              {(allRundowns || []).map((rd) => (
                <MenuItem key={rd.id} value={rd.id}>
                  #{rd.sys_num} — {rd.name}
                </MenuItem>
              ))}
            </Select>

            <Typography variant="subtitle2" fontWeight="bold">
              RUNDOWN {rundown.name} — #{rundown.sys_num}
            </Typography>
          </Box>

          {/* Right: chips + action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={`⏱ ${formattedDuration}`} size="small" />
            <Chip label={`${stories.length} stories`} size="small" />

            <Tooltip title="Print Rundown">
              <IconButton size="small" onClick={printFullRundown}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Button
              size="small"
              variant="outlined"
              onClick={() => setPreviewOpen((prev) => !prev)}
              sx={{ fontSize: 11 }}
            >
              {previewOpen ? 'Hide' : 'Preview'}
            </Button>

            {/* + Add → adds a second rundown column (callback from parent) */}
            {/* <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => onAddWorkspace?.()}
              sx={{ fontSize: 11 }}
            >
              + Add
            </Button> */}

            {/* Delete rundown */}
            <IconButton
              size="small"
              color="error"
              disabled= {
                    updating ||
                    (rundown.is_locked && rundown.locked_by !== user?.id)
                   }
              onClick={async () => {
                if (!can_delete_rundown) {
                  setSnackbar({
                    open: true,
                    message: `You don't have permission to delete this rundown.`,
                    severity: 'warning',
                  });
                  return;
                }
                if (!confirm(`Delete rundown "${rundown.name}"?`)) return;
                try {
                  await deleteRundowns({ ids: [rundown.id] }).unwrap();
                  setSnackbar({ open: true, message: 'Rundown deleted', severity: 'success' });
                  onStoriesChanged();
                } catch {
                  setSnackbar({ open: true, message: 'Delete failed', severity: 'error' });
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {rundown.is_locked && rundown.locked_by !== user?.id && (
          <Box
            sx={{
              bgcolor: '#fef3c7',
              color: '#78350f',
              px: 2,
              py: 0.75,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #fcd34d',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon fontSize="small" />
              <span>
                Locked by {rundown.locked_by_name || 'someone'}
                {(rundown.locked_by_name || '').toLowerCase().includes('admin') && ' — View Only'}
              </span>
            </Box>

            {!(rundown.locked_by_name || '').toLowerCase().includes('admin') && (
              <Button
                size="small"
                variant="contained"
                color="warning"
                onClick={async () => {
                  try {
                    await lockRundown({ id: rundown.id, force: true }).unwrap();
                    onStoriesChanged();
                  } catch (err: any) {
                    setSnackbar({
                      open: true,
                      message: err?.data?.detail || 'Take over failed',
                      severity: 'error',
                    });
                  }
                }}
              >
                Take Over
              </Button>
            )}
          </Box>
        )}

        {/* Story list body */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
          {stories.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No stories in this rundown.
            </Typography>
          )}
          {stories.map((story, index) => {
            const isSelected = story.id === selectedStoryId;
            const isLocked = story.locked_by !== null;
            const isLockedByMe = story.locked_by === user?.id;
            const statusColor = statusColors[story.status] || '#gray';

            return (
              <Box
                key={story.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 0.5,
                  mb: 0.5,
                  bgcolor: isSelected ? 'action.selected' : 'transparent',
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                  cursor: 'pointer',
                }}
                onClick={() => handleSelectStory(story.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                   <Typography variant="caption" sx={{ minWidth: 20, fontWeight: 'bold' }}>
                    {index + 1}.
                  </Typography>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: statusColor,
                      display: 'inline-block',
                    }}
                  />
                </Box>
                 <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                  {story.slug}
                  {isLocked && (
                    <Chip
                      label={isLockedByMe ? '✍️ You' : '🔒 Locked'}
                      size="small"
                      color={isLockedByMe ? 'success' : 'warning'}
                      sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                    />
                  )}
                </Typography>
                    <>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveStory(index, 'up');
                        }}
                        
                        disabled= {index === 0 ||
                    updating ||
                    (rundown.is_locked && rundown.locked_by !== user?.id)
                   }
                      >
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveStory(index, 'down');
                        }}
                        
                        disabled= {index === stories.length - 1 ||
                    updating ||
                    (rundown.is_locked && rundown.locked_by !== user?.id)
                   }
                      >
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                    </>
                  
                 
               
                <Tooltip title="Print Rundown">
              <IconButton size="small" onClick={() => handlePrintRundown(story)}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
                <Typography variant="caption" sx={{ mx: 1, color: 'text.secondary' }}>
                  {story.duration}
                </Typography>
                 
                  <IconButton
                    disabled={
                    updating ||
                    (rundown.is_locked && rundown.locked_by !== user?.id)
                   }
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStory(story.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Right: Preview / Editor Panel */}
      <Box
        sx={{
          width: previewOpen ? '45%' : 0,
          overflow: 'hidden',
          transition: 'width 0.2s',
          borderLeft: previewOpen ? 1 : 0,
          borderColor: 'divider',
          bgcolor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {previewOpen && selectedStory && (
          <>
            {/* Panel Header */}
            <Box
              sx={{
                p: 1,
                bgcolor: '#f4f4f5',
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="subtitle2">
                {editMode ? '✏️ Editing' : '👁️ Preview'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                
                  <Button size="small" variant="contained" color="secondary"
                  disabled={
                    updating ||
                    (rundown.is_locked && rundown.locked_by !== user?.id)
                  }
                   onClick={handleThrowToPrompter}>
                    ⚡ Prompter
                  </Button>
                
                
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  disabled={
                    updating ||
                    (rundown.is_locked && rundown.locked_by !== user?.id)
                  }
                  onClick={() => {
                    if (!can_edit_rundown_preview_full && !can_edit_rundown_preview_slug) {
                      setSnackbar({
                        open: true,
                        message: `You don't have permission to edit story.`,
                        severity: 'warning',
                      });
                      return;
                    }
                    setEditMode(!editMode);
                  }}
                >
                  {editMode ? 'Cancel' : '✏️ Edit'}
                </Button>
                
                          
            
              </Box>
            </Box>

            {/* Panel Body */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              {editMode && can_edit_rundown_preview_full ? (
                // ---- Edit Mode ----
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    disabled={!can_edit_rundown_preview_full}
                    label="Slug"
                    value={draftStory.slug || ''}
                    onChange={(e) => setDraftStory({ ...draftStory, slug: e.target.value })}
                    size="small"
                    fullWidth
                  />
                   <Typography variant="caption">Format</Typography>
                <Select value={draftStory.format || ''}
                        disabled={!can_edit_rundown_preview_full}
                        label="" 
                        onChange={(e) => setDraftStory({ ...draftStory, format: e.target.value } )} 
                        fullWidth size="small">
                      <MenuItem value="OC-VO">OC-VO</MenuItem>
                      <MenuItem value="OC">OC</MenuItem>
                      <MenuItem value="OC-SOT">OC-SOT</MenuItem>
                      <MenuItem value="OC-PACKAGE">OC-PACKAGE</MenuItem>
                      <MenuItem value="OC-GRAPHICS">OC-GRAPHICS</MenuItem>
                </Select>
                  <TextField
                    label="Duration"
                    disabled={!can_edit_rundown_preview_full}
                    value={draftStory.duration || ''}
                    onChange={(e) => setDraftStory({ ...draftStory, duration: e.target.value })}
                    size="small"
                    fullWidth
                  />
                  <Typography variant="caption" fontWeight="bold">OC Text</Typography>
                  <TextareaAutosize
                    minRows={3}
                    disabled={!can_edit_rundown_preview_full}
                    style={{
                      width: '100%',
                      direction: 'rtl',
                      fontFamily: '"Jameel Noori Nastaleeq", serif',
                      fontSize: 20,
                      padding: 8,
                    }}
                    value={draftStory.oc_text || ''}
                    onChange={(e) => setDraftStory({ ...draftStory, oc_text: e.target.value })}
                  />
                  <Typography variant="caption" fontWeight="bold">VO / BODY</Typography>
                  <TextareaAutosize
                    minRows={4}
                    disabled={!can_edit_rundown_preview_full}
                    style={{
                      width: '100%',
                      direction: 'rtl',
                      fontFamily: '"Jameel Noori Nastaleeq", serif',
                      fontSize: 20,
                      padding: 8,
                    }}
                    value={draftStory.body_text || ''}
                    onChange={(e) => setDraftStory({ ...draftStory, body_text: e.target.value })}
                  />
                  <Typography variant="caption" fontWeight="bold">TEMPLATE / CG</Typography>
                  <TextareaAutosize
                    minRows={2}
                    disabled={!can_edit_rundown_preview_full}
                    style={{
                      width: '100%',
                      direction: 'rtl',
                      fontFamily: '"Jameel Noori Nastaleeq", serif',
                      fontSize: 18,
                      padding: 8,
                    }}
                    value={draftStory.template_cg || ''}
                    onChange={(e) => setDraftStory({ ...draftStory, template_cg: e.target.value })}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveStory}
                    disabled={!can_edit_rundown_preview_full || updating}
                  >
                    {updating ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Box>
              ) : editMode && can_edit_rundown_preview_slug ? (
                // ---- Edit Mode ----
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    disabled={!can_edit_rundown_preview_slug}
                    label="Slug"
                    value={draftStory.slug || ''}
                    onChange={(e) => setDraftStory({ ...draftStory, slug: e.target.value })}
                    size="small"
                    fullWidth
                  />
                   <Typography variant="caption">Format</Typography>
                <Select value={draftStory.format || ''}
                        disabled={can_edit_rundown_preview_slug}
                        label="" 
                        onChange={(e) => setDraftStory({ ...draftStory, format: e.target.value } )} 
                        fullWidth size="small">
                      <MenuItem value="OC-VO">OC-VO</MenuItem>
                      <MenuItem value="OC">OC</MenuItem>
                      <MenuItem value="OC-SOT">OC-SOT</MenuItem>
                      <MenuItem value="OC-PACKAGE">OC-PACKAGE</MenuItem>
                      <MenuItem value="OC-GRAPHICS">OC-GRAPHICS</MenuItem>
                </Select>
                  <TextField
                    label="Duration"
                    disabled={can_edit_rundown_preview_slug}
                    value={draftStory.duration || ''}
                    onChange={(e) => setDraftStory({ ...draftStory, duration: e.target.value })}
                    size="small"
                    fullWidth
                  />
                  <Typography variant="caption" fontWeight="bold">OC Text</Typography>
                  <TextareaAutosize
                    minRows={3}
                    disabled={can_edit_rundown_preview_slug}
                    style={{
                      width: '100%',
                      direction: 'rtl',
                      fontFamily: '"Jameel Noori Nastaleeq", serif',
                      fontSize: 20,
                      padding: 8,
                    }}
                    value={draftStory.oc_text || ''}
                    onChange={(e) => setDraftStory({ ...draftStory, oc_text: e.target.value })}
                  />
                  <Typography variant="caption" fontWeight="bold">VO / BODY</Typography>
                  <TextareaAutosize
                    minRows={4}
                    disabled={can_edit_rundown_preview_slug}
                    style={{
                      width: '100%',
                      direction: 'rtl',
                      fontFamily: '"Jameel Noori Nastaleeq", serif',
                      fontSize: 20,
                      padding: 8,
                    }}
                    value={draftStory.body_text || ''}
                    onChange={(e) => setDraftStory({ ...draftStory, body_text: e.target.value })}
                  />
                  <Typography variant="caption" fontWeight="bold">TEMPLATE / CG</Typography>
                  <TextareaAutosize
                    minRows={2}
                    disabled={can_edit_rundown_preview_slug}
                    style={{
                      width: '100%',
                      direction: 'rtl',
                      fontFamily: '"Jameel Noori Nastaleeq", serif',
                      fontSize: 18,
                      padding: 8,
                    }}
                    value={draftStory.template_cg || ''}
                    onChange={(e) => setDraftStory({ ...draftStory, template_cg: e.target.value })}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveStory}
                    disabled={!can_edit_rundown_preview_slug || updating}
                  >
                    {updating ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Box>
              )
              :
              (
                // ---- View Mode ----
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedStory.slug}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={`Format: ${selectedStory.format}`} size="small" />
                    <Chip label={`Duration: ${selectedStory.duration}`} size="small" />
                    <Chip label={`Status: ${selectedStory.status}`} size="small" color="primary" />
                    {selectedStory.locked_by && (
                      <Chip
                        label={`Locked by ${selectedStory.locked_by_name || 'someone'}`}
                        color="warning"
                        size="small"
                      />
                    )}
                  </Box>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                    <Typography variant="caption" fontWeight="bold">OC TEXT</Typography>
                    <Typography
                      dir="rtl"
                      fontFamily='"Jameel Noori Nastaleeq", serif'
                      fontSize={20}
                      sx={{ whiteSpace: 'pre-wrap' }}
                    >
                      {selectedStory.oc_text || 'N/A'}
                    </Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                    <Typography variant="caption" fontWeight="bold">VO / BODY</Typography>
                    <Typography
                      dir="rtl"
                      fontFamily='"Jameel Noori Nastaleeq", serif'
                      fontSize={20}
                      sx={{ whiteSpace: 'pre-wrap' }}
                    >
                      {selectedStory.body_text || 'N/A'}
                    </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                    <Typography variant="caption" fontWeight="bold">TEMPLATE / CG</Typography>
                    <Typography
                      dir="rtl"
                      fontFamily='"Jameel Noori Nastaleeq", serif'
                      fontSize={18}
                      sx={{ whiteSpace: 'pre-wrap' }}
                    >
                      {selectedStory.template_cg || 'N/A'}
                    </Typography>
                   </Paper>
                </Box>
              )}
            </Box>
          </>
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
    </Box>
  );
};

export default RundownWorkspace;