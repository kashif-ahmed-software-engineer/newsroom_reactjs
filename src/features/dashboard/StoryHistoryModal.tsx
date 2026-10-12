import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestoreIcon from '@mui/icons-material/Restore';
import { useGetStoryHistoryQuery, useRestoreStoryFromHistoryMutation } from '../../services/api';

interface Props {
  open: boolean;
  storyId: number | null;
  onClose: () => void;
  onRestored: () => void;
}

const StoryHistoryModal: React.FC<Props> = ({ open, storyId, onClose, onRestored }) => {
  const { data: history, isLoading, error, refetch } = useGetStoryHistoryQuery(
    storyId as number,
    { skip: !storyId }
  );
  const [restore, { isLoading: restoring }] = useRestoreStoryFromHistoryMutation();

  const handleRestore = async (historyId: number) => {
    if (!storyId) return;
    if (!confirm('Are you sure you want to restore this version? Current values will be overwritten.')) return;
    try {
      await restore({ storyId, historyId }).unwrap();
      onRestored();
      refetch();
      onClose();
    } catch (err) {
      alert('Failed to restore version');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#18181b',
          color: '#fff',
          fontWeight: 'bold',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: 20 }}>🕒</span>
          Story Revision History (ترمیم کی تاریخ)
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#fafafa', maxHeight: '70vh' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="info">No history available for this story.</Alert>}
        {history && history.length === 0 && (
          <Typography color="text.secondary" textAlign="center" sx={{ p: 3 }}>
            No revision history yet.
          </Typography>
        )}
        {history?.map((h) => (
          <Box
            key={h.id}
            sx={{
              mb: 1.5,
              p: 2,
              bgcolor: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: 1,
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
                  #{h.id}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {h.changed_by || 'system'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {h.changed_at && new Date(h.changed_at).toLocaleString()}
                </Typography>
                <Chip
                  label={h.action}
                  size="small"
                  color={
                    h.action === 'INSERT'
                      ? 'success'
                      : h.action === 'UPDATE'
                      ? 'primary'
                      : 'error'
                  }
                />
              </Box>
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<RestoreIcon />}
                disabled={restoring}
                onClick={() => handleRestore(h.id)}
              >
                Restore This
              </Button>
            </Box>

            <Divider sx={{ mb: 1 }} />

            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Slug:</strong> {h.slug} ({h.format})
            </Typography>
            {h.oc_text && (
              <Typography
                variant="body2"
                dir="rtl"
                sx={{
                  fontFamily: '"Jameel Noori Nastaleeq", serif',
                  fontSize: 18,
                  whiteSpace: 'pre-wrap',
                  mb: 1,
                }}
              >
                {h.oc_text}
              </Typography>
            )}
            {h.body_text && (
              <Typography
                variant="body2"
                dir="rtl"
                sx={{
                  fontFamily: '"Jameel Noori Nastaleeq", serif',
                  fontSize: 18,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {h.body_text}
              </Typography>
            )}
          </Box>
        ))}
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#f4f4f5' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StoryHistoryModal;