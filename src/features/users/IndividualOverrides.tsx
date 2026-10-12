import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Checkbox, Snackbar, Alert, CircularProgress,
  FormControl, Select, MenuItem, SelectChangeEvent,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import {
  useGetUsersQuery,
  useGetUserPermissionsQuery,
  useSetUserPermissionsMutation,
} from '../../services/api';

// -------- Permission groups (same as PermissionsMatrix) --------
const PERMISSION_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: 'DASHBOARD / STORY',
    keys: [
      'can_create_story', 'can_edit_story_full', 'can_edit_story_slug',
      'can_delete_story', 'can_send_to_rundown', 'can_view_story_history',
      'can_use_dash_prompter',
    ],
  },
  {
    title: 'RUNDOWN',
    keys: [
      'can_create_rundown', 'can_delete_rundown',
      'can_edit_rundown_preview_full', 'can_edit_rundown_preview_slug',
      'can_reorder_rundown', 'can_remove_story_from_rundown',
      'can_print_rundown', 'can_use_rd_prompter', 'can_takeover_rundown',
    ],
  },
  {
    title: 'HEADLINES',
    keys: [
      'can_create_headline_bulletin', 'can_delete_headline_bulletin',
      'can_edit_headline', 'can_delete_headline', 'can_copy_headline',
      'can_reorder_headline', 'can_assign_headline_to_rundown',
    ],
  },
  {
    title: 'TICKER',
    keys: ['can_edit_ticker', 'can_delete_ticker', 'can_set_live_ticker'],
  },
  {
    title: 'STAFF & SYSTEM',
    keys: ['can_manage_users', 'can_manage_role_permissions'],
  },
];

const ALL_KEYS = PERMISSION_GROUPS.flatMap((g) => g.keys);

const permissionLabels: Record<string, string> = {
  can_create_story: 'Create New Story',
  can_edit_story_full: 'Edit Story (Full)',
  can_edit_story_slug: 'Edit Story Slug Only',
  can_delete_story: 'Delete Story',
  can_send_to_rundown: 'Send Story to Rundown',
  can_use_dash_prompter: 'Send to Prompter (Dashboard)',
  can_view_story_history: 'View Story History',
  can_create_rundown: 'Create Rundown',
  can_delete_rundown: 'Delete Rundown',
  can_edit_rundown_preview_full: 'Edit Story in Rundown Preview (Full)',
  can_edit_rundown_preview_slug: 'Edit Slug in Rundown Preview',
  can_reorder_rundown: 'Reorder Stories in Rundown',
  can_remove_story_from_rundown: 'Remove Story from Rundown',
  can_print_rundown: 'Print Rundown',
  can_use_rd_prompter: 'Send to Prompter (Rundown)',
  can_takeover_rundown: 'Take Over Locked Rundown',
  can_create_headline_bulletin: 'Create Hour / Bulletin',
  can_delete_headline_bulletin: 'Delete Hour / Bulletin',
  can_edit_headline: 'Add / Edit Headline',
  can_delete_headline: 'Delete Headline',
  can_copy_headline: 'Copy Headline Across Hours',
  can_reorder_headline: 'Reorder Headlines',
  can_assign_headline_to_rundown: 'Assign Headline to Rundown',
  can_edit_ticker: 'Add / Edit Ticker',
  can_delete_ticker: 'Delete Ticker',
  can_set_live_ticker: 'Set Ticker Live',
  can_manage_users: 'Manage Staff Accounts',
  can_manage_role_permissions: 'Manage Role Permission Matrix',
};

const IndividualOverrides: React.FC = () => {
  const { data: users } = useGetUsersQuery();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);

  const selectedUser = useMemo(
    () => users?.find((u) => u.id === selectedUserId),
    [users, selectedUserId],
  );

  const {
    data: serverPerms,
    isFetching,
    refetch,
  } = useGetUserPermissionsQuery(selectedUserId as number, {
    skip: selectedUserId == null,
  });

  const [setUserPermissions, { isLoading: isSaving }] = useSetUserPermissionsMutation();

  const [snackbar, setSnackbar] = useState<{
    open: boolean; message: string; severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Default to first user
  useEffect(() => {
    if (!selectedUserId && users && users.length > 0) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  // Seed local state whenever server data changes for the selected user
  useEffect(() => {
    if (serverPerms) {
      const seeded: Record<string, boolean> = {};
      ALL_KEYS.forEach((k) => { seeded[k] = !!serverPerms[k]; });
      setLocalPerms(seeded);
      setDirty(false);
    }
  }, [serverPerms]);

  const handleUserChange = (e: SelectChangeEvent<number>) => {
    setSelectedUserId(Number(e.target.value));
    setDirty(false);
  };

  const handleToggle = (key: string) => {
    setLocalPerms((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    try {
      await setUserPermissions({
        userId: selectedUserId,
        permissions: localPerms,
      }).unwrap();
      setDirty(false);
      refetch();
      setSnackbar({
        open: true,
        message: `Overrides saved for ${selectedUser?.full_name ?? 'user'}`,
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to save overrides',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" color="secondary.main">
        Individual Staff Overrides
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Fine-tune one specific staff member's permissions — promote a worker above their
        role, or restrict a manager below theirs, without changing anyone else.
      </Typography>

      {/* User selector */}
      <FormControl size="small" sx={{ minWidth: 420, mb: 1 }}>
        <Select
          value={selectedUserId ?? ''}
          onChange={handleUserChange}
          displayEmpty
          sx={{ fontWeight: 600 }}
        >
          {users?.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.full_name} ({u.username}) — {u.role ?? 'no role'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedUser && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Base role: <b>{selectedUser.role ?? '—'}</b> — checkboxes below start from the role's
          defaults; tick or untick any to override just for <b>{selectedUser.full_name}</b>.
        </Typography>
      )}

      {isFetching && <CircularProgress size={20} />}

      {/* Permission grid */}
      {!isFetching && selectedUserId != null && (
        <>
          {PERMISSION_GROUPS.map((group, gIdx) => (
            <Box key={group.title} mb={gIdx === PERMISSION_GROUPS.length - 1 ? 3 : 2}>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ letterSpacing: 0.5, display: 'block', mb: 0.75 }}
              >
                {group.title}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  },
                  columnGap: 2,
                  rowGap: 0.25,
                }}
              >
                {group.keys.map((key) => (
                  <Box key={key} display="flex" alignItems="center" sx={{ minWidth: 0 }}>
                    <Checkbox
                      size="small"
                      checked={!!localPerms[key]}
                      onChange={() => handleToggle(key)}
                      sx={{ p: 0.5 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: 13,
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {permissionLabels[key]}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}

          <Button
            variant="contained"
            color="success"
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isSaving || !dirty}
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            {isSaving ? 'Saving...' : 'Save Overrides for this User'}
          </Button>
        </>
      )}

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
    </Box>
  );
};

export default IndividualOverrides;