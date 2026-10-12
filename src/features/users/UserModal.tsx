import React, { useState, useEffect } from 'react';
  
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useCreateUserMutation, useUpdateUserMutation, useGetRolePermissionQuery } from '../../services/api';

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  user: any | null;
  onSuccess: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ open, onClose, user, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(''); 
  const [permission, setPermission] = useState(0); 
  const {data: rolePermissions} = useGetRolePermissionQuery();
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();

  useEffect(() => {

    if (user) {
      setFullName(user.full_name || '');
      setUsername(user.username || '');
      setRole(user.role); 
      setStatus(user.status || 'active');
      setPermission(user.permission || 0);
    } else {
      setFullName('');
      setUsername('');
      setPassword('');
      setRole('');
      setStatus('active');
      setPermission(0);
    }
  }, [user, open]);

  const handleSubmit = async () => {
    const payload = { full_name: fullName, username, permission, status, password: password || undefined };
    if (user) await updateUser({ id: user.id, body: payload }).unwrap();
    else await createUser(payload).unwrap();
    onSuccess();
    
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{user ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="Full Name" fullWidth value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <TextField margin="dense" label="Username (Login ID)" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} required />
        <TextField margin="dense" label="Password (Leave blank to keep unchanged)" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} helperText={user ? 'Leave blank to keep current password' : 'Required for new users'} />
        <FormControl fullWidth margin="dense">
          <InputLabel>Role</InputLabel>
          <Select value={permission} onChange={(e) => setPermission(parseInt(e.target.value as string, 0))}>
            <MenuItem value="0">-- Select Role --</MenuItem>
            {rolePermissions?.map((perm) => (
              <MenuItem key={perm.id} value={perm.id}>
                {perm.role_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="dense">
          <InputLabel>Account Status</InputLabel>
          <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <MenuItem value="active">Active (فعال - لاگ اِن کی اجازت ہے)</MenuItem>
            <MenuItem value="inactive">Inactive (معطل - لاگ اِن بند ہے)</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">{user ? 'Update' : 'Save'} Account</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserModal;