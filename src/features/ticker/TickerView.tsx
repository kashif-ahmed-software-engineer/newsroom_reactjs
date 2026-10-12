import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Select,
  MenuItem,
} from '@mui/material';
import { useGetTickersQuery, useCreateTickerMutation } from '../../services/api';

const TickerView: React.FC = () => {
  const { data: tickers, refetch } = useGetTickersQuery();
  const [createTicker] = useCreateTickerMutation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<'breaking' | 'urgent' | 'routine'>('routine');
  const [text, setText] = useState('');

  const handleCreate = async () => {
    if (!text.trim()) return;
    await createTicker({ category: category, ticker_text: text.trim(), is_live: false }).unwrap();
    setOpen(false);
    refetch();
  };

  const liveTicker = tickers?.find(t => t.is_live);

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', gap: 2 }}>
      <Paper sx={{ width: '40%', p: 2, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography fontWeight="bold">Tickers</Typography>
          <Button variant="contained" size="small" onClick={() => setOpen(true)}>+ New</Button>
        </Box>
        <List dense>
          {tickers?.map((t) => (
            <ListItem key={t.id} button>
              <ListItemText primary={t.ticker_text} secondary={<Box>
                          <Chip label={t.category} size="small" color={t.is_live ? 'success' : 'default'} />
                          {t.is_live && ' 🔴 LIVE'}
                          </Box>} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" fontWeight="bold">LIVE TICKER</Typography>
        <Typography variant="body1" sx={{ mt: 2, fontWeight: 700 }}>{liveTicker?.ticker_text || 'Ready for broadcast...'}</Typography>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Ticker</DialogTitle>
        <DialogContent>
          <Select value={category} onChange={(e) => setCategory(e.target.value as any)} fullWidth sx={{ mb: 2, mt: 1 }}>
            <MenuItem value="breaking">🔴 BREAKING</MenuItem>
            <MenuItem value="urgent">🟡 URGENT</MenuItem>
            <MenuItem value="routine">🔵 ROUTINE</MenuItem>
          </Select>
          <TextField label="Ticker Text" multiline rows={3} fullWidth value={text} onChange={(e) => setText(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TickerView;