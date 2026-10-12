import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  TextareaAutosize,
  Grid,
  IconButton,
} from '@mui/material';
import { useCreateStoryMutation, useSetLiveStoryMutation, useGetRundownsQuery } from '../services/api';
import { getUserFromStorage } from '../util/helpers';

interface BreakingDrawerProps {
  open: boolean;
  onClose: () => void;
}

const BreakingDrawer: React.FC<BreakingDrawerProps> = ({ open, onClose }) => {
  const [slug, setSlug] = useState('');
  const [format, setFormat] = useState('OC-BREAKING');
  const [duration, setDuration] = useState('00:30');
  const [targetRundown, setTargetRundown] = useState('');
  const [ocText, setOcText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [templateCg, setTemplateCg] = useState('');
  const { data: rundowns } = useGetRundownsQuery();
  const [createStory] = useCreateStoryMutation();
  const [setLive] = useSetLiveStoryMutation();
  const user =  getUserFromStorage();
  const canThrowPrompter = user?.permission?.can_use_dash_prompter || false;

  const handleSave = async () => {
    await createStory({
      slug,
      format,
      duration,
      status: 'red',
      oc_text: ocText,
      body_text: bodyText,
      template_cg: templateCg,
      filed_by: user?.full_name || 'Admin',
      notes: '',
      targetRundown: 0
    }).unwrap();
    onClose();
  };

  const handleThrowToPrompter = async () => {
    await setLive({ slug: slug || 'BREAKING NEWS', text: ocText || bodyText || 'Breaking update' }).unwrap();
    onClose();
  };

  return (
    <Drawer anchor="top" open={open} onClose={onClose} PaperProps={{ sx: { height: 'auto', maxHeight: '85vh' } }}>
      <Box sx={{ p: 3, bgcolor: 'secondary.main', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
        <Typography fontWeight={900}>⚡ QUICK BREAKING NEWS / FLASH TO PROMPTER</Typography>
        <IconButton onClick={onClose} sx={{ color: '#fff' }}>✕</IconButton>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField label="Breaking Slug *" value={slug} onChange={(e) => setSlug(e.target.value)} fullWidth size="small" required />
          </Grid>
          <Grid item xs={6} md={2}>
            <Select value={format} onChange={(e) => setFormat(e.target.value)} fullWidth size="small">
              <MenuItem value="OC-BREAKING">OC-BREAKING</MenuItem>
              <MenuItem value="OC-VO">OC-VO</MenuItem>
              <MenuItem value="OC">OC</MenuItem>
              <MenuItem value="OC-SOT">OC-SOT</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField label="Duration" value={duration} onChange={(e) => setDuration(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Select value={targetRundown} onChange={(e) => setTargetRundown(e.target.value)} fullWidth size="small" displayEmpty>
              <MenuItem value="">-- Do Not Add to Rundown --</MenuItem>
              {rundowns?.map((rd) => (
                <MenuItem key={rd.id} value={rd.id}>{rd.name}</MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" fontWeight="bold" color="error">BREAKING OC TEXT (اردو نستعلیق)</Typography>
            <TextareaAutosize
              minRows={4}
              style={{ width: '100%', fontFamily: '"Jameel Noori Nastaleeq", serif', fontSize: 19, direction: 'rtl', padding: 8 }}
              value={ocText}
              onChange={(e) => setOcText(e.target.value)}
              placeholder="یہاں بریکنگ او سی ٹیکسٹ درج کریں..."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" fontWeight="bold" color="error">BREAKING DETAILS (اردو نستعلیق)</Typography>
            <TextareaAutosize
              minRows={4}
              style={{ width: '100%', fontFamily: '"Jameel Noori Nastaleeq", serif', fontSize: 19, direction: 'rtl', padding: 8 }}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="بریکنگ نیوز کی مزید تفصیلات..."
            />
          </Grid>
        </Grid>

        <Box>
          <Typography variant="caption" fontWeight="bold">TEMPLATE / LOWER THIRD / CG</Typography>
          <TextareaAutosize
            minRows={2}
            style={{ width: '100%', padding: 8 }}
            value={templateCg}
            onChange={(e) => setTemplateCg(e.target.value)}
            placeholder="یہاں بریکنگ پٹی، لوئر تھرڈ اور ٹیمپلیٹ لکھیں..."
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: 1, borderColor: 'divider' }}>
          {canThrowPrompter && (
            <Button variant="contained" color="secondary" startIcon={<span>⚡</span>} onClick={handleThrowToPrompter}>
              Throw Directly to Prompter (No Save)
            </Button>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleSave}>Save Story</Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default BreakingDrawer;