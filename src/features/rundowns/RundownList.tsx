// src/features/rundown/RundownList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  Typography,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { Rundown } from '../../types';
import {
  useDeleteRundownsMutation,
  useCreateRundownMutation,
  useUnlockRundownMutation,
  useLockRundownMutation,
} from '../../services/api';
import { getUserFromStorage } from '../../util/helpers';
import { useRundownSocket } from '../../util/useRundownSocket';

interface RundownListProps {
  rundowns: Rundown[];
  activeRundownId: number | null;
  onSelect: (id: number) => void;
  onCreateNew: () => void;
  onDelete: (ids: number[]) => void;
  can_create_rundown: boolean;
}

const RundownList: React.FC<RundownListProps> = ({
  rundowns,
  activeRundownId,
  onSelect,
  onCreateNew,
  onDelete,
  can_create_rundown,
}) => {
  // Real-time updates — invalidates the `Rundown` RTK Query tag on WS broadcast
  useRundownSocket();

  const user = getUserFromStorage();
  const currentUserId = Number(user?.id);
  const can_delete_rundown = user?.permission?.can_delete_rundown || false;

  const [deleteRundowns] = useDeleteRundownsMutation();
  const [createRundown] = useCreateRundownMutation();
  const [unlockRundown] = useUnlockRundownMutation();
  const [lockRundown] = useLockRundownMutation();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({ open: false, message: '', severity: 'warning' });

  // ---------- Selection ----------
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ---------- Create ----------
  const verifyCreateRundownPermission = () => {
    if (!can_create_rundown) {
      setSnackbar({
        open: true,
        message: `You don't have permission to create rundown.`,
        severity: 'warning',
      });
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createRundown({
      sys_num: '0',
      name: newName,
      scheduled_time: newScheduledTime || new Date().toISOString(),
      story_ids: [],
      status: 'draft',
      is_locked: false,
    }).unwrap();
    setOpenDialog(false);
    setNewName('');
    setNewScheduledTime('');
    onCreateNew();
  };

  useEffect(() => {
    if (openDialog) {
      const now = new Date();
      const localDateTime = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      setNewScheduledTime(localDateTime);
    }
  }, [openDialog]);

  // ---------- Delete ----------
  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!can_delete_rundown) {
      setSnackbar({
        open: true,
        message: `You don't have permission to delete rundown(s).`,
        severity: 'warning',
      });
      return;
    }
    if (!confirm(`Delete ${selectedIds.length} rundown(s)?`)) return;
    await deleteRundowns({ ids: selectedIds.map(Number) }).unwrap();
    setSelectedIds([]);
    //onCreateNew();
  };

  // ---------- Unlock ----------
  const handleUnlock = async (id: number) => {
    try {
      await unlockRundown(id).unwrap();
      setSnackbar({
        open: true,
        message: 'Rundown unlocked',
        severity: 'success',
      });
      //onCreateNew();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.detail || 'Failed to unlock',
        severity: 'error',
      });
    }
  };

  // ---------- Take Over (non-admin lock only) ----------
  const handleTakeOver = async (id: number) => {
    try {
      await lockRundown({ id, force: true }).unwrap();
      setSnackbar({
        open: true,
        message: 'You now control this rundown',
        severity: 'success',
      });
      //onCreateNew();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.detail || 'Take over failed',
        severity: 'error',
      });
    }
  };

  // ---------- Click "Available" → lock it ----------
  const handleLockAvailable = async (rd: Rundown) => {
    try {
      const res = await lockRundown({ id: rd.id }).unwrap();

      if ((res as any).status === 'locked') {
        setSnackbar({
          open: true,
          message: `Rundown is locked by ${
            (res as any).locked_by_name || 'someone'
          }`,
          severity: 'warning',
        });
        //onCreateNew();
        return;
      }

      setSnackbar({
        open: true,
        message: 'Rundown locked — you can now edit',
        severity: 'success',
      });
     // onCreateNew();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.detail || 'Failed to lock rundown',
        severity: 'error',
      });
    }
  };

  // ---------- Sort ----------
  const sorted = [...rundowns].sort((a, b) => {
    const dateA = new Date(a.scheduled_time || 0);
    const dateB = new Date(b.scheduled_time || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 1 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
          RUNDOWNS
        </Typography>
        <Button
          size="small"
          variant="contained"
          onClick={() => verifyCreateRundownPermission() && setOpenDialog(true)}
        >
          + New
        </Button>
      </Box>

      {selectedIds.length > 0 && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          onClick={handleDeleteSelected}
          sx={{ mb: 1 }}
        >
          Delete Selected ({selectedIds.length})
        </Button>
      )}

      {/* Rundown list */}
      <List dense sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
        {sorted.map((rd) => {
          const isActive = rd.id === activeRundownId;
          
          const lockerId = rd.locked_by ? Number(rd.locked_by) : null;
          const isLocked = !!rd.is_locked && lockerId !== null;
          const isLockedByMe = isLocked && lockerId === currentUserId;
          const isLockedByOther = isLocked && lockerId !== currentUserId;
          const lockerIsAdmin =
            isLockedByOther &&
            (rd.locked_by_name || '').toLowerCase().includes('admin');
          
          return (
            <ListItem
              key={rd.id}
              button
              selected={isActive}
              onClick={() => onSelect(rd.id)}
              sx={{
                flexDirection: 'column',
                alignItems: 'stretch',
                borderLeft: isActive ? '3px solid #dc2626' : 'none',
                bgcolor: isActive ? '#fee2e2' : 'transparent',
                '&:hover': { bgcolor: isActive ? '#fdd8d8' : '#fef2f2' },
                cursor: 'pointer',
                borderBottom: '1px solid #f4f4f5',
                py: 1,
                px: 1.5,
              }}
            >
              {/* Top row: checkbox + name */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  size="small"
                  disabled={lockerIsAdmin}
                  checked={selectedIds.includes(String(rd.id))}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggleSelect(String(rd.id));
                  }}
                  sx={{ p: 0.3 }}
                />
                <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>
                  {rd.name}
                </Typography>
              </Box>

              {/* Middle row: sys_num + time */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11,
                  color: '#71717a',
                  mt: 0.5,
                  pl: 0.5,
                }}
              >
                <Typography variant="caption" fontWeight={700} color="error">
                  #{rd.sys_num}
                </Typography>
                <Typography variant="caption">
                  {new Date(rd.scheduled_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>

              {/* Bottom row: lock state */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 0.5,
                  pl: 0.5,
                  flexWrap: 'wrap',
                }}
              >
                {/* Locked by ME */}
                {isLockedByMe && (
                  <>
                    <Chip
                      icon={<LockIcon fontSize="small" />}
                      label="Locked by you"
                      size="small"
                      color="success"
                      sx={{ fontSize: 10, height: 20 }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<LockOpenIcon fontSize="small" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlock(rd.id);
                      }}
                      sx={{ fontSize: 10, py: 0, minHeight: 22 }}
                    >
                      Unlock
                    </Button>
                  </>
                )}

                {/* Locked by SOMEONE ELSE */}
                {isLockedByOther && (
                  <>
                    <Chip
                      icon={<LockIcon fontSize="small" />}
                      label={`Locked by ${rd.locked_by_name || 'someone'}`}
                      size="small"
                      color="warning"
                      sx={{ fontSize: 10, height: 20 }}
                    />
                    {lockerIsAdmin ? (
                      // Admin lock → no takeover possible
                      <Chip
                        label="View Only"
                        size="small"
                        color="default"
                        sx={{ fontSize: 10, height: 20 }}
                      />
                    ) : (
                      // Non-admin lock → takeover allowed
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTakeOver(rd.id);
                        }}
                        sx={{ fontSize: 10, py: 0, minHeight: 22 }}
                      >
                        Take Over
                      </Button>
                    )}
                  </>
                )}

                {/* Available */}
                {!isLocked && (
                  <Tooltip title="Click to lock this rundown and start editing">
                    <Chip
                      label="Available"
                      size="small"
                      color="success"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockAvailable(rd);
                      }}
                      sx={{
                        fontSize: 10,
                        height: 20,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#dcfce7' },
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
            </ListItem>
          );
        })}
      </List>

      {/* New Rundown Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>New Rundown</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rundown Name"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Scheduled Date & Time"
            type="datetime-local"
            fullWidth
            value={newScheduledTime}
            onChange={(e) => setNewScheduledTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default RundownList;