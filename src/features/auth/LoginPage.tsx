// src/features/auth/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useLoginMutation } from '../../services/api';
import { setUser } from '../../app/authSlice';


const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ... inside handleSubmit
      const data = await login({ username, password }).unwrap();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch(setUser(data.user));
      navigate('/dashboard');


      // The auth slice's extraReducer will set the user automatically
      navigate('/dashboard');
     } catch (err) {
      console.error(err);     
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#09090b',
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={4}
          sx={{
            bgcolor: '#18181b',
            color: '#f4f4f5',
            p: 4,
            borderRadius: 2,
            border: '1px solid #27272a',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 900, color: '#ef4444', letterSpacing: 1 }}
            >
              NEWS 14 HD
            </Typography>
            <Typography variant="caption" sx={{ color: '#a1a1aa' }}>
              NEWSROOM MANAGEMENT SYSTEM v1.07
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: '#fee2e2', color: '#dc2626' }}>
              {'data' in error
                ? (error.data as any)?.message || 'Invalid credentials'
                : 'Login failed'}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              sx={{
                mb: 2,
                '& .MuiInputLabel-root': { color: '#a1a1aa' },
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: '#3f3f46' },
                  '&:hover fieldset': { borderColor: '#ef4444' },
                  '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#ef4444' },
              }}
              InputProps={{ style: { background: '#09090b' } }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{
                mb: 3,
                '& .MuiInputLabel-root': { color: '#a1a1aa' },
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: '#3f3f46' },
                  '&:hover fieldset': { borderColor: '#ef4444' },
                  '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#ef4444' },
              }}
              InputProps={{ style: { background: '#09090b' } }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                bgcolor: '#dc2626',
                color: '#fff',
                fontWeight: 700,
                py: 1.2,
                '&:hover': { bgcolor: '#b91c1c' },
                '&:disabled': { bgcolor: '#7f1d1d' },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Desk'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#71717a' }}>
              Default: <strong style={{ color: '#f4f4f5' }}>admin</strong> /{' '}
              <strong style={{ color: '#f4f4f5' }}>admin123</strong>
              <br />
              (پاس ورڈ ڈیٹا بیس میں محفوظ bcrypt hash ہے)
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;