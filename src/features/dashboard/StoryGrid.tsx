// src/features/dashboard/StoryGrid.tsx
import React, { useState, useMemo } from 'react';
import { Box, Checkbox, Typography, Button, Snackbar,  Alert } from '@mui/material';
import { Story } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useDeleteStoryMutation, useDeleteStoriesMutation, useGetDashboardQuery } from '../../services/api';
import StoryCard from './StoryCard';
import { getUserFromStorage, esc } from '../../util/helpers';


const user = getUserFromStorage();

interface StoryGridProps {
  stories: Story[];
  selectedStoryId?: number;
  onSelectStory: (story: Story) => void;
  onStoriesChanged: () => void;
}

const StoryGrid: React.FC<StoryGridProps> = ({
  stories,
  selectedStoryId,
  onSelectStory,
  onStoriesChanged,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteStory] = useDeleteStoryMutation();
  const [deleteStories] = useDeleteStoriesMutation();
  const { refetch } = useGetDashboardQuery();

   const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'info' | 'warning' | 'error';
   }>({ open: false, message: '', severity: 'warning' })

  // Get the search query from Redux
  const searchQuery = useSelector((state: RootState) => state.search.query);

  const canDelete = user?.permission?.can_delete_story;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(stories.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    
    if (selectedIds.length === 0) return;

    if(canDelete == false)
    {
      setSnackbar({
        open: true,
        message: `You don't have permission to delete story(s).`,
        severity: 'warning',
      });
      
      return;
    }
    if (!window.confirm(`Delete ${selectedIds.length} selected story(s)?`)) return;
    await deleteStories({ story_ids: selectedIds }).unwrap();
    setSelectedIds([]);
    onStoriesChanged();
  };

   const handleDeleteCurrent = async (story_id:number) => {
    
    if(canDelete == false)
    {
      setSnackbar({
        open: true,
        message: `You don't have permission to delete a story.`,
        severity: 'warning',
      });
      
      return;
    }
    if (!window.confirm(`Delete current selected story(s)?`)) return;
    await deleteStory({ story_id }).unwrap();    
    onStoriesChanged();
  };

  // Drag start hook — the actual payload is written by StoryCard
  // (multi-select aware). Kept here for optional side effects.
  const handleDragStart = (_e: React.DragEvent, _storyId: number) => {
    // no-op — payload handled in StoryCard via dragPayload prop
  };

  // Filter stories based on the search query
  const filteredStories = useMemo(() => {
    if (!searchQuery.trim()) return stories;
    const q = searchQuery.toLowerCase();
    return stories.filter(
      (s) =>
        (s.slug || '').toLowerCase().includes(q) ||
        (s.oc_text || '').toLowerCase().includes(q) ||
        (s.body_text || '').toLowerCase().includes(q) ||
        (s.template_cg || '').toLowerCase().includes(q) ||
        (s.filed_by || '').toLowerCase().includes(q) ||
        (s.format || '').toLowerCase().includes(q)
    );
  }, [stories, searchQuery]);

  // ---- Print function ----
  const handlePrintRundown = (story: Story) => {
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
     {/* Header */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#f4f4f5',
        borderBottom: 2,
        borderColor: 'divider',
        height: 32,
        px: 1,
        fontWeight: 700,
        fontSize: 11,
        color: '#3f3f46',
        flexShrink: 0,
      }}
    >
      <Checkbox size="small" onChange={handleSelectAll} sx={{ p: 0.3, mr: 0.5 }} />
      <Box sx={{ width: 30, textAlign: 'center' }}>RC</Box>
      <Box sx={{ width: 30, textAlign: 'center' }}>ST</Box>
      <Box sx={{ flex: 1, pl: 1 }}>SLUG</Box>
      <Box sx={{ width: 50 }}>DUR</Box>
      <Box sx={{ width: 60 }}>FMT</Box>
      <Box sx={{ width: 100 }}>CREATED</Box>
      <Box sx={{ width: 100 }}>MODIFIED</Box>
      <Box sx={{ width: 180, textAlign: 'center' }}>ACTIONS</Box>
    </Box>

      {/* Stories List (filtered) */}
      <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#fff' }}>
        {filteredStories.length === 0 ? (
          <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
            No stories found
          </Typography>
        ) : (
          filteredStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              selected={selectedIds.includes(story.id)}
              onSelect={() => handleSelectOne(story.id)}
              onClick={() => onSelectStory(story)}
              onPrint={() => handlePrintRundown(story)}
              onSendToRundown={() => {}}
              onDelete={()=>handleDeleteCurrent(story.id)}
              showCheckbox={true}
              draggable={true}
              // ✅ If this row is part of the current selection, drag ALL
              //    selected ids together; otherwise drag only this row.
              dragPayload={
                selectedIds.includes(story.id) ? selectedIds : [story.id]
              }
              onDragStart={(e) => handleDragStart(e, story.id)}
              onStoryUpdated= {refetch}
            />
          ))
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: 1,
          bgcolor: '#f4f4f5',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" fontWeight="bold" color="secondary">
          Total: {stories.length} Stories
        </Typography>
        {selectedIds.length > 0 && canDelete && (
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={handleDeleteSelected}
          >
            🗑 Delete Selected ({selectedIds.length})
          </Button>
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

export default StoryGrid;