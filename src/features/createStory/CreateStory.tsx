import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  TextareaAutosize,
  Snackbar,
  Alert,
  Grid,
} from '@mui/material';
import { useCreateStoryMutation, useGetRundownsQuery } from '../../services/api';
import { getUserFromStorage } from '../../util/helpers';

const CreateStory: React.FC = () => {
  const navigate = useNavigate();
  const user = getUserFromStorage();
  const { data: rundowns } = useGetRundownsQuery();
  const [createStory] = useCreateStoryMutation();

  const [slug, setSlug] = useState('');
  const [format, setFormat] = useState('OC-VO');
  const [duration, setDuration] = useState('00:30');
  const [targetRundown, setTargetRundown] = useState('');
  const [ocText, setOcText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [templateCg, setTemplateCg] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ✅ Only run when permission changes
  const canCreate = !!user?.permission?.can_create_story;

  useEffect(() => {
    if (!canCreate) {
      setSnackbar({
        open: true,
        message: "You don't have permission to create a story.",
        severity: 'error',
      });
    }
  }, [canCreate]);

  const handleSubmit = async () => {
    if (!canCreate) return;
    if (!slug.trim()) {
      alert('Slug is required');
      return;
    }
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
    navigate('/dashboard');
  };

  // ✅ Redirect if no permission (optional, but cleaner than rendering Snackbar)
  if (!canCreate) {
    return (
      <>
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
      </>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', height: '100%', overflow: 'auto' }}>
      <Paper sx={{ maxWidth: 1100, mx: 'auto', p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 2,
            borderColor: 'secondary.main',
            pb: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={900} color="secondary.main">
              FULL STORY CREATOR & PRODUCER DESK
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Write, format, assign rundown, and publish comprehensive news packages.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Publish Story
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={5}>
            <TextField
              label="STORY SLUG *"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              fullWidth
              size="small"
              required
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <Select value={format} onChange={(e) => setFormat(e.target.value)} fullWidth size="small">
              <MenuItem value="OC-VO">OC-VO</MenuItem>
              <MenuItem value="OC">OC</MenuItem>
              <MenuItem value="OC-SOT">OC-SOT</MenuItem>
              <MenuItem value="OC-PACKAGE">OC-PACKAGE</MenuItem>
              <MenuItem value="OC-GRAPHICS">OC-GRAPHICS</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="EST. DURATION"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Select
              value={targetRundown}
              onChange={(e) => setTargetRundown( e.target.value)}
              fullWidth
              size="small"
              displayEmpty
              sx={{
                bgcolor: '#fff1f2',
                '& .MuiSelect-select': { fontWeight: 700, color: 'secondary.main' },
              }}
            >
              <MenuItem value="0">-- Do Not Add to Rundown --</MenuItem>
              {rundowns?.map((rd) => (
                <MenuItem key={rd.id} value={rd.id}>
                  {rd.name}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
            ON-CAMERA (OC) SCRIPT
          </Typography>
          <TextareaAutosize
            minRows={4}
            style={{
              width: '100%',
              fontFamily: '"Jameel Noori Nastaleeq", serif',
              fontSize: 20,
              direction: 'rtl',
              padding: 10,
            }}
            value={ocText}
            onChange={(e) => setOcText(e.target.value)}
            placeholder="یہاں آن کیمرہ (OC) ٹیکسٹ درج کریں..."
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
            VO / PACKAGE / SOT / BODY DETAILS
          </Typography>
          <TextareaAutosize
            minRows={5}
            style={{
              width: '100%',
              fontFamily: '"Jameel Noori Nastaleeq", serif',
              fontSize: 20,
              direction: 'rtl',
              padding: 10,
            }}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="یہاں خبر کی مکمل تفصیلات، وی او اور پیکیج اسکرپٹ لکھیں..."
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
            TEMPLATE / LOWER THIRD / CG / GRAPHICS
          </Typography>
          <TextareaAutosize
            minRows={3}
            style={{ width: '100%', padding: 10 }}
            value={templateCg}
            onChange={(e) => setTemplateCg(e.target.value)}
            placeholder="یہاں ٹیمپلیٹ، سی جی، لوئر تھرڈ اور گرافکس کی تفصیلات لکھیں..."
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            mt: 3,
            borderTop: 1,
            borderColor: 'divider',
            pt: 2,
          }}
        >
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Publish Story
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateStory;