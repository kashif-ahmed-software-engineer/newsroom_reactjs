import React, { useState, useEffect, useMemo } from 'react';
import {
  Checkbox,
  Box,
  Typography,
  Snackbar,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import {
  useGetRolePermissionQuery,
  useUpdateSinglePermissionMutation,
} from '../../services/api';

// -------- Permission groups (drive UI layout) --------
type PermissionGroup = {
  title: string;
  keys: string[];
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: 'DASHBOARD / STORY',
    keys: [
      'can_create_story',
      'can_edit_story_full',
      'can_edit_story_slug',
      'can_delete_story',
      'can_send_to_rundown',
      'can_view_story_history',
      'can_use_dash_prompter',
    ],
  },
  {
    title: 'RUNDOWN',
    keys: [
      'can_create_rundown',
      'can_delete_rundown',
      'can_edit_rundown_preview_full',
      'can_edit_rundown_preview_slug',
      'can_reorder_rundown',
      'can_remove_story_from_rundown',
      'can_print_rundown',
      'can_use_rd_prompter',
      'can_takeover_rundown',
    ],
  },
  {
    title: 'HEADLINES',
    keys: [
      'can_create_headline_bulletin',
      'can_delete_headline_bulletin',
      'can_edit_headline',
      'can_delete_headline',
      'can_copy_headline',
      'can_reorder_headline',
      'can_assign_headline_to_rundown',
    ],
  },
  {
    title: 'TICKER',
    keys: [
      'can_create_ticker',
      'can_edit_ticker',
      'can_delete_ticker',
      'can_set_live_ticker',
    ],
  },
  {
    title: 'STAFF & SYSTEM',
    keys: [
      'can_manage_users',
      'can_manage_role_permissions',
    ],
  },
];

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.keys);

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
  can_create_ticker: 'Create Ticker',
  can_edit_ticker: 'Edit Ticker',
  can_delete_ticker: 'Delete Ticker',
  can_set_live_ticker: 'Set Ticker Live',
  can_manage_users: 'Manage Staff Accounts',
  can_manage_role_permissions: 'Manage Role Permission Matrix',
};

interface RoleRow {
  id: number;
  role_name: string;
  role_name_rtl?: string | null;
  hierarchy_rank?: number | null;
  [key: string]: any;
}

const PermissionsMatrix: React.FC = () => {
  const { data: roles, refetch } = useGetRolePermissionQuery();
  const [updateSinglePermission] = useUpdateSinglePermissionMutation();

  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  // ✅ Single open role at a time — null means all closed
  const [openRole, setOpenRole] = useState<string | null>(null);
  

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // -------- Load roles -> matrix; open the first role by default --------
  useEffect(() => {
    if (!roles) return;
    const newMatrix: Record<string, Record<string, boolean>> = {};
    (roles as RoleRow[]).forEach((r) => {
      newMatrix[r.role_name] = {};
      ALL_PERMISSION_KEYS.forEach((key) => {        
        newMatrix[r.role_name][key] = !!r[key];
      });
    });
    setMatrix(newMatrix);

    // Open first role by default (or leave closed if you prefer)
    const first = (roles as RoleRow[])[0];
    setOpenRole(first ? first.role_name : null);
  }, [roles]);

  const roleRows: RoleRow[] = useMemo(() => (roles as RoleRow[]) || [], [roles]);

  const grantedCount = (role: string) =>
    ALL_PERMISSION_KEYS.reduce(
      (acc, key) => acc + (matrix[role]?.[key] ? 1 : 0),
      0,
    );

  // -------- Toggle single permission (optimistic) --------
  const handleToggle = async (role: string, key: string) => {
    const currentValue = matrix[role]?.[key] ?? false;
    const newValue = !currentValue;

    setMatrix((prev) => ({
      ...prev,
      [role]: { ...prev[role], [key]: newValue },
    }));

    try {
      await updateSinglePermission({
        role_name: role,
        column_name: key,
        value: newValue,
      }).unwrap();

      setSnackbar({
        open: true,
        message: `'${permissionLabels[key]}' updated for '${role}'`,
        severity: 'success',
      });
    } catch (err) {
      setMatrix((prev) => ({
        ...prev,
        [role]: { ...prev[role], [key]: currentValue },
      }));
      setSnackbar({
        open: true,
        message: 'Failed to update permission',
        severity: 'error',
      });
    }
  };

  // -------- Accordion: only one role open at a time --------
  // Clicking the currently-open role closes it; clicking another opens it
  // and automatically closes the previous one.
  const toggleRoleOpen = (role: string) => {
    setOpenRole((prev) => (prev === role ? null : role));
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={2}
      >
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="secondary.main"
          >
            Role-Based Access Control Matrix
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Changes applied here immediately affect all staff assigned to that
            specific role.
          </Typography>
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap={1.5}>
        {roleRows.map((role) => {
          const granted = grantedCount(role.role_name);
          const total = ALL_PERMISSION_KEYS.length;
          // ✅ isOpen is now derived from the single openRole
          const isOpen = openRole === role.role_name;

          return (
            <Box
              key={role.role_name}
              sx={{
                border: '1px solid #e5e7eb',
                borderRadius: 1,
                bgcolor: '#fff',
                overflow: 'hidden',
              }}
            >
              {/* Role header row */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                px={2}
                py={1.25}
                sx={{
                  bgcolor: role.role_name === 'Admin' ? '#fdecec' : '#fafafa',
                  cursor: 'pointer',
                  borderBottom: isOpen ? '1px solid #e5e7eb' : 'none',
                }}
                onClick={() => toggleRoleOpen(role.role_name)}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="secondary.main"
                  >
                    {role.role_name}
                  </Typography>
                  {role.role_name_rtl && (
                    <Typography variant="body2" color="text.secondary">
                      ({role.role_name_rtl})
                    </Typography>
                  )}
                  {typeof role.hierarchy_rank === 'number' && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontStyle: 'italic' }}
                    >
                      rank {role.hierarchy_rank}
                    </Typography>
                  )}
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" color="text.secondary">
                    {granted}/{total} granted
                  </Typography>
                  <IconButton size="small">
                    {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Box>

              {/* Collapsible permission groups */}
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <Box px={2} py={1.5}>
                  {PERMISSION_GROUPS.map((group, gIdx) => (
                    <Box
                      key={group.title}
                      mb={gIdx === PERMISSION_GROUPS.length - 1 ? 0 : 2}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.secondary"
                        sx={{
                          letterSpacing: 0.5,
                          display: 'block',
                          mb: 0.75,
                        }}
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
                          <Box
                            key={key}
                            display="flex"
                            alignItems="center"
                            sx={{ minWidth: 0 }}
                          >
                            <Checkbox
                              size="small"
                              checked={!!matrix[role.role_name]?.[key]}
                              onChange={() => handleToggle(role.role_name, key)}
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
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>

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

export default PermissionsMatrix;