// src/features/ticker/TickerEditor.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Chip,
  Paper,
} from '@mui/material';
import { Ticker } from '../../types';
import { useUpdateTickerMutation } from '../../services/api';

interface TickerEditorProps {
  ticker: Ticker | null;
  onUpdate: () => void;
}

const TickerEditor: React.FC<TickerEditorProps> = ({ ticker, onUpdate }) => {
  const [updateTicker] = useUpdateTickerMutation();
  const [category, setCategory] = useState<'breaking' | 'urgent' | 'routine'>('routine');
  const [text, setText] = useState('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (ticker) {
      setCategory(ticker.category);
      setText(ticker.ticker_text);
      setIsLive(ticker.is_live);
    }
  }, [ticker]);

  const handleSave = async () => {
    if (!ticker) return;
    await updateTicker({
      id: ticker.id,
      body: { category, ticker_text: text, is_live: isLive },
    }).unwrap();
    onUpdate();
  };

  if (!ticker) {
    return (
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="text.secondary">Select a ticker to edit</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Edit Ticker</Typography>
        <Chip label={`ID: ${ticker.id}`} size="small" />
      </Box>

      <FormControl fullWidth>
        <InputLabel>Category</InputLabel>
        <Select
          value={category}
          label="Category"
          onChange={(e) => setCategory(e.target.value as any)}
        >
          <MenuItem value="breaking">🔴 BREAKING</MenuItem>
          <MenuItem value="urgent">🟡 URGENT</MenuItem>
          <MenuItem value="routine">🔵 ROUTINE</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Ticker Text"
        multiline
        rows={4}
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        dir="rtl"
        sx={{ fontFamily: '"Jameel Noori Nastaleeq", serif', fontSize: 16 }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant={isLive ? 'contained' : 'outlined'}
          color={isLive ? 'success' : 'primary'}
          onClick={() => setIsLive(!isLive)}
        >
          {isLive ? '🔴 Live' : 'Set Live'}
        </Button>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save Ticker
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', mt: 2 }}>
        <Typography variant="caption" fontWeight="bold" color="text.secondary">
          Preview
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
          {text || 'Empty'}
        </Typography>
        <Chip label={category.toUpperCase()} size="small" sx={{ mt: 1 }} />
        {isLive && <Chip label="LIVE" color="error" size="small" sx={{ ml: 1 }} />}
      </Paper>
    </Box>
  );
};

export default TickerEditor;