// src/features/rundown/RundownView.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import {
  useGetRundownsQuery,
  useCreateRundownMutation,
  useDeleteRundownsMutation,
  useGetStoriesQuery,
} from '../../services/api';
import { getUserFromStorage } from '../../util/helpers';
import RundownList from './RundownList';
import RundownWorkspace from './RundownWorkspace';

const RundownView: React.FC = () => {
  
  const { data: rundowns, refetch: refetchRundowns } = useGetRundownsQuery();
  const { data: stories } = useGetStoriesQuery();
  const [createRundown] = useCreateRundownMutation();
  const [deleteRundowns] = useDeleteRundownsMutation();
  const user = getUserFromStorage();

  const [selectedRundownId, setSelectedRundownId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('');

  const [snackbar, setSnackbar] = useState<{
          open: boolean;
          message: string;
          severity: 'success' | 'info' | 'warning' | 'error';
        }>({ open: false, message: '', severity: 'warning' });


  const can_create_rundown = user?.permission?.can_create_rundown || false;

  const selectedRundown = rundowns?.find((r) => r.id === selectedRundownId) || null;

  const handleSelect = (id: number) => {
    setSelectedRundownId(id);
  };

  const handleDelete = async (ids: number[]) => {
    if (window.confirm('Delete this rundown permanently?')) {
      await deleteRundowns({ ids: ids }).unwrap();
      refetchRundowns();
      if (selectedRundownId === ids[0]) 
        setSelectedRundownId(null);
    }
  };

  const verifyCreateRundownPermission = () => {
    if (can_create_rundown === false) {
      setSnackbar({
        open: true,
        message: `You don't have permission to create rundown.`,
        severity: 'warning',
      });
      return false;
    }
    return true;
  }

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createRundown({
      name: newName,
      scheduled_time: newScheduledTime || new Date().toISOString(),
      story_ids: [],
      status: 'draft',
      is_locked: false,
    }).unwrap();
    setDialogOpen(false);
    setNewName('');
    refetchRundowns();
  };

  // If no rundown exists, show empty state
  
  if (!rundowns || rundowns.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No rundowns available. Create one to get started.
        </Typography>
        
          <Button variant="contained" color="primary" onClick={() => {
                if(verifyCreateRundownPermission())
                {
                  setDialogOpen(true);
                }
            }} sx={{ mt: 2 }}>
            + Create Rundown
          </Button>
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
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
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Select first rundown if none selected
  if (!selectedRundownId && rundowns.length > 0) {
    setSelectedRundownId(rundowns[0].id);
  }

  const activeRundown = rundowns.find((r) => r.id === selectedRundownId) || rundowns[0];

  return (
    <Box sx={{ display: 'flex', height: '100%', bgcolor: '#f8fafc' }}>
      {/* Left panel: Rundown list */}
      <Paper
        sx={{
          width: 260,
          minWidth: 200,
          maxWidth: 320,
          borderRight: 1,
          borderColor: 'divider',
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        <RundownList
          rundowns={rundowns}
          activeRundownId={selectedRundownId || activeRundown.id}
          onSelect={handleSelect}
          onCreateNew={() => setDialogOpen(true)}
          onDelete={handleDelete}
          can_create_rundown={can_create_rundown}
        />
      </Paper>

      {/* Right panel: Workspace */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeRundown && (
          <RundownWorkspace
            id={activeRundown.id}
            rundown={activeRundown}
            allRundowns={rundowns}
            allStories={stories || []}
            onStoriesChanged={refetchRundowns}
            onSelectRundown={(newId) => setSelectedRundownId(newId)}
            onAddWorkspace={() => {
              // Example: open a dialog letting the user pick a second rundown
              // For now, cycle to the next rundown in the list
              const nextIdx = (rundowns.findIndex((r) => r.id === activeRundown.id) + 1) % rundowns.length;
              setSelectedRundownId(rundowns[nextIdx].id);
            }}
          />
        )}
      </Box>

      {/* Dialog for new rundown */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

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

export default RundownView;