// src/features/dashboard/StoryEditor.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Paper,
  TextareaAutosize,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import { Story, Rundown } from '../../types';
import {
  useUpdateStoryMutation,
  useLockStoryMutation,
  useUnlockStoryMutation,
  useSetLiveStoryMutation,
  useUpdateRundownMutation,
  useUpdateRundownAddStoryMutation,
} from '../../services/api';
import { getUserFromStorage } from '../../util/helpers';
import StoryHistoryModal from './StoryHistoryModal';
import HistoryIcon from '@mui/icons-material/History';

interface StoryEditorProps {
  story: Story | null;
  onStoryUpdated: () => void;
  rundowns: Rundown[];
  allStories: Story[];
}

const StoryEditor: React.FC<StoryEditorProps> = ({
  story,
  onStoryUpdated,
  rundowns,
  allStories,
}) => {
  const [tab, setTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedStory, setEditedStory] = useState<Partial<Story>>({});
  const [updating, setUpdating] = useState(false);

  // Rundown tab state
  const [selectedRundownId, setSelectedRundownId] = useState<number | ''>('');
  const [droppedStoryIds, setDroppedStoryIds] = useState<number[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);
  // inside StoryEditor component:
 const [historyOpen, setHistoryOpen] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [updateStory] = useUpdateStoryMutation();
  const [lockStory] = useLockStoryMutation();
  const [unlockStory] = useUnlockStoryMutation();
  const [setLive] = useSetLiveStoryMutation();
  const [updateRundown] = useUpdateRundownMutation();
  const [updateRundownAddStory] = useUpdateRundownAddStoryMutation();

  const user = getUserFromStorage();

  const canEdit = user?.permission?.can_edit_story_full;
  const canPrompter = user?.permission?.can_use_dash_prompter;
  const canReorder = user?.permission?.can_reorder_rundown;
  const canEditSlugOnly=user?.permission?.can_edit_story_slug;

  // When a rundown is selected, load its stories
  useEffect(() => {
    if (selectedRundownId) {
      const rd = rundowns.find((r) => r.id === selectedRundownId);
      setDroppedStoryIds(rd?.story_ids || []);
    } else {
      setDroppedStoryIds([]);
    }
  }, [selectedRundownId, rundowns]);

  // Auto-lock story when entering edit mode
  useEffect(() => {
    if (story) {
      setEditedStory(story);
      if (!story.locked_by && canEdit && canEditSlugOnly && !editMode) {
        lockStory({ id: story.id });
      }
    }
  }, [story]);

  if (!story) {
    return (
      <Box sx={{ p: 2, color: 'text.secondary' }}>
        Select a story to view/edit.
      </Box>
    );
  }

  const isLockedByMe = story.locked_by === user?.id;
  const canEditThis = editMode && (isLockedByMe || canEdit || canEditSlugOnly);

  const handleSave = async () => {
    setUpdating(true);
    await updateStory({ id: story.id, body: editedStory }).unwrap();
    setUpdating(false);
    setEditMode(false);
    onStoryUpdated();
  };

  const handleUnlock = async () => {
    await unlockStory({ id: story.id, force: false }).unwrap();
    setEditMode(false);
    onStoryUpdated();
  };

  const handleThrowToPrompter = async () => {

    if (canPrompter === false) {
      setSnackbar({
        open: true,
        message: `You don't have permission to send a story to the prompter.`,
        severity: 'warning',
      });
      return;
    }

    const text = story.oc_text || story.body_text || story.slug;
    await setLive({ slug: story.slug, text }).unwrap();
  };

  // -------- Drag & drop helpers --------

  const parseStoryIds = (e: React.DragEvent): number[] => {
    const multi = e.dataTransfer.getData('application/x-story-ids');
    const single = e.dataTransfer.getData('text/plain');
    const raw = multi || single;
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((n) => Number(n)).filter((n) => !Number.isNaN(n));
      }
      const n = Number(parsed);
      return Number.isNaN(n) ? [] : [n];
    } catch {
      const n = Number(raw);
      return Number.isNaN(n) ? [] : [n];
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copyMove';
    if (dropRef.current) dropRef.current.style.background = '#fef2f2';
  };

  const handleDragLeave = () => {
    if (dropRef.current) dropRef.current.style.background = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (dropRef.current) dropRef.current.style.background = '';

    const incomingIds = parseStoryIds(e);
    if (incomingIds.length === 0 || !selectedRundownId) return;

    const rd = rundowns.find((r) => r.id === selectedRundownId);
    if (!rd) return;

    const existing = new Set<number>(rd.story_ids || []);
    const toAdd = incomingIds.filter((id) => !existing.has(id));
    const skipped = incomingIds.length - toAdd.length;

    if (toAdd.length === 0) {
      setSnackbar({
        open: true,
        message: `All ${incomingIds.length} story(ies) already in this rundown`,
        severity: 'info',
      });
      return;
    }

    for (const id of toAdd) {
      await updateRundownAddStory({ rundown_id: rd.id, story_id: id }).unwrap();
    }

    onStoryUpdated();
    setDroppedStoryIds([...(rd.story_ids || []), ...toAdd]);

    setSnackbar({
      open: true,
      message:
        skipped > 0
          ? `Added ${toAdd.length}, skipped ${skipped} duplicate(s)`
          : `Added ${toAdd.length} story(ies)`,
      severity: 'success',
    });
  };

  const handleRemoveFromRundown = async (storyId: number) => {
    if (!selectedRundownId) return;
    const rd = rundowns.find((r) => r.id === selectedRundownId);
    if (!rd) return;

    const newIds = Array.from(
      new Set(rd.story_ids.filter((id) => id !== storyId))
    );

    await updateRundown({ id: rd.id, body: { story_ids: newIds } }).unwrap();
    onStoryUpdated();
    setDroppedStoryIds(newIds);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!selectedRundownId) return;
    const rd = rundowns.find((r) => r.id === selectedRundownId);
    if (!rd) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rd.story_ids.length) return;
    const newIds = [...rd.story_ids];
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    await updateRundown({ id: rd.id, body: { story_ids: newIds } }).unwrap();
    onStoryUpdated();
    setDroppedStoryIds(newIds);
  };

  const rundownStories = droppedStoryIds
    .map((id) => allStories.find((s) => s.id === id))
    .filter(Boolean) as Story[];

  const verifyEditPermission = () => {
    if (canEdit === false && canEditSlugOnly == false) {
      setSnackbar({
        open: true,
        message: `You don't have permission to edit a story.`,
        severity: 'warning',
      });
      return false;
    }
    return true;
  }

  const viewStoryHistoryPermission = () => {
    if (user?.permission?.can_view_story_history == false) {
      setSnackbar({
        open: true,
        message: `You don't have permission to view the history of the story.`,
        severity: 'warning',
      });
      return false;
    }
    return true;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          p: 1,
          bgcolor: '#f4f4f5',
        }}
      >
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 32 }}>
          <Tab
            label="Story"
            sx={{ minHeight: 32, fontSize: 11, fontWeight: 700 }}
          />
          <Tab
            label="Rundown"
            sx={{ minHeight: 32, fontSize: 11, fontWeight: 700 }}
          />
        </Tabs>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={handleThrowToPrompter}
              startIcon={<span>⚡</span>}
            >
              Prompter
            </Button>
            
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<HistoryIcon />}
            onClick={() => {
                if(viewStoryHistoryPermission())
                {
                  setHistoryOpen(true)
                }
            }}
            disabled={!story}
          >
            History
          </Button>
          
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => {
                if (verifyEditPermission()) {
                  setEditMode(!editMode);
                }
              }}
              disabled={updating}
            >
              {editMode ? 'Cancel' : '✏️ Edit'}
            </Button>
          
          
        </Box>
      </Box>

      {/* Tab content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {tab === 0 ? (
          // ---- Story Tab ----
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            { editMode && canEdit ? (
              <>
                <TextField
                  label="Slug"
                  value={editedStory.slug || ''}
                  onChange={(e) =>
                    setEditedStory({ ...editedStory, slug: e.target.value })
                  }
                  fullWidth
                  size="small"
                  disabled={!editMode}
                />

                <Typography variant="caption">Format</Typography>
                <Select
                  value={editedStory.format || ''}
                  disabled={!editMode}
                  label=""
                  onChange={(e) =>
                    setEditedStory({ ...editedStory, format: e.target.value })
                  }
                  fullWidth
                  size="small"
                >
                  <MenuItem value="OC-VO">OC-VO</MenuItem>
                  <MenuItem value="OC">OC</MenuItem>
                  <MenuItem value="OC-SOT">OC-SOT</MenuItem>
                  <MenuItem value="OC-PACKAGE">OC-PACKAGE</MenuItem>
                  <MenuItem value="OC-GRAPHICS">OC-GRAPHICS</MenuItem>
                </Select>
                <TextField
                  label="Duration"
                  value={editedStory.duration || ''}
                  onChange={(e) =>
                    setEditedStory({ ...editedStory, duration: e.target.value })
                  }
                  size="small"
                  disabled={!editMode}
                />
                <Typography variant="caption" fontWeight="bold">
                  OC TEXT
                </Typography>
                <TextareaAutosize
                  minRows={3}
                  style={{
                    width: '100%',
                    direction: 'rtl',
                    fontFamily: '"Jameel Noori Nastaleeq", serif',
                    fontSize: 20,
                    padding: 8,
                  }}
                  value={editedStory.oc_text || ''}
                  onChange={(e) =>
                    setEditedStory({ ...editedStory, oc_text: e.target.value })
                  }
                  disabled={!editMode}
                />
                <Typography variant="caption" fontWeight="bold">
                  VO / BODY
                </Typography>
                <TextareaAutosize
                  minRows={4}
                  style={{
                    width: '100%',
                    direction: 'rtl',
                    fontFamily: '"Jameel Noori Nastaleeq", serif',
                    fontSize: 20,
                    padding: 8,
                  }}
                  value={editedStory.body_text || ''}
                  onChange={(e) =>
                    setEditedStory({ ...editedStory, body_text: e.target.value })
                  }
                  disabled={!editMode}
                />
                <Typography variant="caption" fontWeight="bold">
                  TEMPLATE / CG
                </Typography>
                <TextareaAutosize
                  minRows={2}
                  style={{
                    width: '100%',
                    direction: 'rtl',
                    fontFamily: '"Jameel Noori Nastaleeq", serif',
                    fontSize: 18,
                    padding: 8,
                  }}
                  value={editedStory.template_cg || ''}
                  onChange={(e) =>
                    setEditedStory({
                      ...editedStory,
                      template_cg: e.target.value,
                    })
                  }
                  disabled={!editMode}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={!canEditThis || updating}
                >
                  {updating ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </>
            ) :
             editMode && canEditSlugOnly ? (
              <>
                <TextField
                  label="Slug"
                  value={editedStory.slug || ''}
                  onChange={(e) =>
                    setEditedStory({ ...editedStory, slug: e.target.value })
                  }
                  fullWidth
                  size="small"
                  disabled={!editMode}
                />

                <Typography variant="caption">Format</Typography>
                <Select
                  value={editedStory.format || ''}
                  disabled={editMode}
                  label=""
                  onChange={(e) =>
                    setEditedStory({ ...editedStory, format: e.target.value })
                  }
                  fullWidth
                  size="small"
                >
                  <MenuItem value="OC-VO">OC-VO</MenuItem>
                  <MenuItem value="OC">OC</MenuItem>
                  <MenuItem value="OC-SOT">OC-SOT</MenuItem>
                  <MenuItem value="OC-PACKAGE">OC-PACKAGE</MenuItem>
                  <MenuItem value="OC-GRAPHICS">OC-GRAPHICS</MenuItem>
                </Select>
                <TextField
                  label="Duration"
                  value={editedStory.duration || ''}
                  onChange={(e) =>
                    setEditedStory({ ...editedStory, duration: e.target.value })
                  }
                  size="small"
                  disabled={editMode}
                />
                <Typography variant="caption" fontWeight="bold">
                  OC TEXT
                </Typography>
                <TextareaAutosize
                  minRows={3}
                  style={{
                    width: '100%',
                    direction: 'rtl',
                    fontFamily: '"Jameel Noori Nastaleeq", serif',
                    fontSize: 20,
                    padding: 8,
                  }}
                  value={editedStory.oc_text || ''}
                  onChange={(e) =>
                    setEditedStory({ ...editedStory, oc_text: e.target.value })
                  }
                  disabled={editMode}
                />
                <Typography variant="caption" fontWeight="bold">
                  VO / BODY
                </Typography>
                <TextareaAutosize
                  minRows={4}
                  style={{
                    width: '100%',
                    direction: 'rtl',
                    fontFamily: '"Jameel Noori Nastaleeq", serif',
                    fontSize: 20,
                    padding: 8,
                  }}
                  value={editedStory.body_text || ''}
                  onChange={(e) =>
                    setEditedStory({ ...editedStory, body_text: e.target.value })
                  }
                  disabled={editMode}
                />
                <Typography variant="caption" fontWeight="bold">
                  TEMPLATE / CG
                </Typography>
                <TextareaAutosize
                  minRows={2}
                  style={{
                    width: '100%',
                    direction: 'rtl',
                    fontFamily: '"Jameel Noori Nastaleeq", serif',
                    fontSize: 18,
                    padding: 8,
                  }}
                  value={editedStory.template_cg || ''}
                  onChange={(e) =>
                    setEditedStory({
                      ...editedStory,
                      template_cg: e.target.value,
                    })
                  }
                  disabled={editMode}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={!canEditThis || updating}
                >
                  {updating ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </>
            )
            : 
            (
              // ---- View mode ----
              <>
                <Typography variant="h5">{story.slug}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`Format: ${story.format}`} size="small" />
                  <Chip label={`Duration: ${story.duration}`} size="small" />
                  <Chip
                    label={`Status: ${story.status}`}
                    size="small"
                    color="primary"
                  />
                  {story.locked_by && (
                    <Chip
                      label={`Locked by ${story.locked_by_name || 'someone'}`}
                      color="warning"
                      size="small"
                    />
                  )}
                </Stack>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" fontWeight="bold">
                    OC TEXT
                  </Typography>
                  <Typography
                    dir="rtl"
                    fontFamily='"Jameel Noori Nastaleeq", serif'
                    fontSize={20}
                    sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {story.oc_text || 'N/A'}
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" fontWeight="bold">
                    VO / BODY
                  </Typography>
                  <Typography
                    dir="rtl"
                    fontFamily='"Jameel Noori Nastaleeq", serif'
                    fontSize={20}
                    sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {story.body_text || 'N/A'}
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" fontWeight="bold">
                    TEMPLATE / CG
                  </Typography>
                  <Typography
                    dir="rtl"
                    fontFamily='"Jameel Noori Nastaleeq", serif'
                    fontSize={18}
                    sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {story.template_cg || 'N/A'}
                  </Typography>
                </Paper>
                {story.locked_by && story.locked_by !== user?.id && (
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleUnlock}
                  >
                    Force Unlock (if admin)
                  </Button>
                )}
              </>
            )}
          </Box>
        ) : (
          // ---- Rundown Tab ----
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Rundown</InputLabel>
              <Select
                value={selectedRundownId}
                label="Select Rundown"
                onChange={(e) => setSelectedRundownId(e.target.value as number)}
              >
                <MenuItem value="">None</MenuItem>
                {rundowns.map((rd) => (
                  <MenuItem key={rd.id} value={rd.id}>
                    #{rd.sys_num} — {rd.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedRundownId && (
              <Box
                ref={dropRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  border: '2px dashed #fca5a5',
                  borderRadius: 2,
                  p: 2,
                  minHeight: 200,
                  bgcolor: '#fafafa',
                  transition: 'background 0.2s',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1 }}
                >
                  ⬇️ Drag one story, or select several with checkboxes and drag
                  any of them to drop them all
                </Typography>
                {rundownStories.length === 0 ? (
                  <Typography color="text.secondary">
                    Rundown is empty
                  </Typography>
                ) : (
                  rundownStories.map((s, idx) => (
                    // ✅ Fixed row: rigid left (index + slug), rigid right
                    //    (duration + arrows + delete). Slug truncates with
                    //    ellipsis instead of forcing overflow.
                    <Box
                      key={s.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        bgcolor: '#fff',
                        border: '1px solid #ffe4e6',
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        mb: 1,
                        minHeight: 40,
                      }}
                    >
                      {/* LEFT: index + slug (slug can shrink) */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flex: 1,
                          minWidth: 0, // ✅ allows the child text to truncate
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="secondary"
                          sx={{ flexShrink: 0, minWidth: 18, textAlign: 'right' }}
                        >
                          {idx + 1}.
                        </Typography>

                        <Tooltip title={s.slug} enterDelay={600}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            dir="auto"
                            sx={{
                              // ✅ keep single line; truncate long Urdu text
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              minWidth: 0,
                              flex: 1,
                              // urdu-script falls back gracefully
                              fontFamily:
                                '"Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", inherit',
                              lineHeight: 1.4,
                            }}
                          >
                            {s.slug}
                          </Typography>
                        </Tooltip>
                      </Box>

                      {/* RIGHT: duration + controls, always aligned */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          flexShrink: 0, // ✅ never squeeze these
                        }}
                      >
                        <Chip
                          label={s.duration}
                          size="small"
                          sx={{ height: 20, fontSize: 11 }}
                        />
                        {canReorder && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleMove(idx, 'up')}
                              disabled={idx === 0}
                              sx={{ p: 0.25 }}
                            >
                              ▲
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleMove(idx, 'down')}
                              disabled={idx === rundownStories.length - 1}
                              sx={{ p: 0.25 }}
                            >
                              ▼
                            </IconButton>
                          </>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveFromRundown(s.id)}
                          sx={{ p: 0.25 }}
                        >
                          ✕
                        </IconButton>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
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

export default StoryEditor;