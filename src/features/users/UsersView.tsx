import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, IconButton, Tabs, Tab,
} from '@mui/material';
import { useGetUsersQuery, useDeleteUserMutation } from '../../services/api';
import UserModal from './UserModal';
import PermissionsMatrix from './PermissionsMatrix';
import IndividualOverrides from './IndividualOverrides';
import { getUserFromStorage } from '../../util/helpers';

const UsersView: React.FC = () => {
  const { data: users, refetch } = useGetUsersQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [tab, setTab] = useState(0);
  //const [user] = getUserFromStorage();

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete user?')) {
      await deleteUser(id).unwrap();
      refetch();
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', height: '100%', overflow: 'auto' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" fontWeight={900} color="secondary.main">
              STAFF & ROLE ACCESS CONTROL
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manage user accounts, assign newsroom designations, and customize role permission matrices.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => { setEditingUser(null); setModalOpen(true); }}
          >
            + Add New Staff Member
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label={`👥 Staff Accounts (${users?.length || 0})`} />
          <Tab label="🛡️ Roles & Permissions Matrix" />
          <Tab label="🎚️ Individual Overrides" />
        </Tabs>

        {tab === 0 && (
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f4f4f5' }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.status}
                      color={u.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => { setEditingUser(u); setModalOpen(true); }}
                    >
                      ✏️
                    </IconButton>
                    {u.id !== 1 && (
                      <IconButton size="small" color="error" onClick={() => handleDelete(u.id)}>
                        🗑
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {tab === 1 && <PermissionsMatrix />}

        {tab === 2 && <IndividualOverrides />}
      </Paper>

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editingUser}
        onSuccess={() => { setModalOpen(false); refetch(); }}
      />
    </Box>
  );
};

export default UsersView;