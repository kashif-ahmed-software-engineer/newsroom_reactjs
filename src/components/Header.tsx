// src/components/Header.tsx
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { useLogoutMutation } from '../services/api';
import { logout } from '../app/authSlice';
import { setSearchQuery } from '../app/searchSlice';
import BreakingDrawer from './BreakingDrawer';
import { getUserFromStorage, clearAuthFromStorage } from '../util/helpers';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = getUserFromStorage();
  const [logoutApi] = useLogoutMutation();
  const [breakingOpen, setBreakingOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({ open: false, message: '', severity: 'warning' });

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    {
      label: '+ Story',
      path: '/create-story',
      permissionKey: 'can_create_story',
      deniedMessage: "You don't have permission to create story.",
    },
    { label: 'Rundowns', path: '/rundowns' },
    { label: 'Ticker', path: '/tickers' },
    { label: 'Staff', path: '/users', adminOnly: true,
      permissionKey: 'can_manage_users',
      deniedMessage: "You don't have permission to manage users.",
     },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Resolve effective permission: per-user override first, else role permission
  const hasPermission = (key?: string): boolean => {
    if (!key) return true;
    const custom = (user as any)?.custom_permissions;
    if (custom && Object.prototype.hasOwnProperty.call(custom, key)) {
      return !!custom[key];
    }
    const rolePerms = (user as any)?.permission;
    if (rolePerms && typeof rolePerms === 'object') {
      return !!rolePerms[key];
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthFromStorage();
      dispatch(logout());
      navigate('/login');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    dispatch(setSearchQuery(value));
  };

  const handleNavClick = (item: {
    label: string;
    path: string;
    permissionKey?: string;
    adminOnly?: boolean;
    deniedMessage?: string;
  }) => {
    // ✅ Block + Story when user lacks can_create_story
    if (item.permissionKey && !hasPermission(item.permissionKey)) {
      setSnackbar({
        open: true,
        message: item.deniedMessage ?? `You don't have permission for ${item.label}.`,
        severity: 'warning',
      });
      return;
    }
    
    navigate(item.path);
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={1} sx={{ height: 56, bgcolor: '#18181b' }}>
        <Toolbar sx={{ minHeight: 56, display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Logo */}
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, color: '#fff', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            NEWS 14 HD
            <Typography
              component="span"
              sx={{ fontSize: 10, bgcolor: '#990000', color: '#fff', p: 0.5, borderRadius: 1, ml: 0.5 }}
            >
              1.07
            </Typography>
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {navItems.map((item) => {
              const allowed = item.permissionKey ? hasPermission(item.permissionKey) : true;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? 'contained' : 'text'}
                  color={isActive(item.path) ? 'primary' : 'inherit'}
                  size="small"
                  onClick={() => handleNavClick(item)}
                  title={!allowed ? item.deniedMessage ?? `You don't have permission for ${item.label}.` : undefined}
                  sx={{
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: 13,
                    color: isActive(item.path) ? '#fff' : '#a1a1aa',
                    opacity: 1,
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* Search field */}
          <TextField
            size="small"
            placeholder="Search slug/stories..."
            value={searchValue}
            onChange={handleSearchChange}
            sx={{ flex: 1, maxWidth: 300, '& .MuiInputBase-root': { bgcolor: '#27272a', color: '#fff', height: 32 } }}
            InputProps={{ style: { padding: '2px 8px', fontSize: 12 } }}
          />

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<span>⚡</span>}
              onClick={() => setBreakingOpen(true)}
              sx={{ fontWeight: 700, boxShadow: 2 }}
            >
              Breaking ▾
            </Button>

            <Button
              component="a"
              href="/prompter"
              target="_blank"
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<span>⚡</span>}
              sx={{ fontWeight: 700 }}
            >
              Prompter
            </Button>

            <Box sx={{ borderLeft: 1, borderColor: '#3f3f46', pl: 1, ml: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#e4e4e7' }}>
                {user?.full_name || 'Admin'}
              </Typography>
              <Typography
                variant="caption"
                sx={{ ml: 0.5, bgcolor: '#27272a', px: 1, py: 0.3, borderRadius: 1, color: '#a1a1aa' }}
              >
                {(user as any)?.permission?.role_name || 'admin'}
              </Typography>
              <IconButton
                size="small"
                onClick={handleLogout}
                sx={{ ml: 0.5, color: '#ef4444', fontSize: 14 }}
                title="Logout"
              >
                Logout
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <BreakingDrawer open={breakingOpen} onClose={() => setBreakingOpen(false)} />

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
    </>
  );
};

export default Header;