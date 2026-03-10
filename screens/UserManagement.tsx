import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { useApp } from '../store/AppContext';
import type { CreateUserResult } from '../services/userService';

interface Props {
  users: User[];
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<CreateUserResult>;
  onUpdateUser: (id: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

const UserManagement: React.FC<Props> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const { currentUser, hasPermission, loadUsers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdUserName, setCreatedUserName] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student' as Role,
    department: '',
    enrollmentId: '',
    employeeId: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
  });

  useEffect(() => { loadUsers(); }, []);

  // Sub admins can only see/manage students and professors (not admins)
  const canManageAdmins = hasPermission('canManageAdmins');
  const manageableUsers = canManageAdmins
    ? users
    : users.filter(u => u.role === 'student' || u.role === 'professor');

  const filteredUsers = manageableUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const result = await onAddUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        enrollmentId: formData.enrollmentId || undefined,
        employeeId: formData.employeeId || undefined,
        status: formData.status,
        avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      });
      setShowCreateModal(false);
      resetForm();
      if (result.generatedPassword) {
        setCreatedUserName(result.user.name);
        setCreatedPassword(result.generatedPassword);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onUpdateUser(editingUser.id, {
        name: formData.name,
        role: formData.role,
        department: formData.department,
        enrollmentId: formData.enrollmentId || undefined,
        employeeId: formData.employeeId || undefined,
        status: formData.status,
      });
      setEditingUser(null);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setErrorMsg('');
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      enrollmentId: user.enrollmentId || '',
      employeeId: user.employeeId || '',
      status: user.status,
    });
    setEditingUser(user);
  };

  const resetForm = () => {
    setErrorMsg('');
    setFormData({
      name: '',
      email: '',
      role: 'student',
      department: '',
      enrollmentId: '',
      employeeId: '',
      status: 'active',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'student': return 'school';
      case 'professor': return 'co_present';
      case 'admin': return 'admin_panel_settings';
      default: return 'person';
    }
  };

  const stats = {
    total: manageableUsers.length,
    students: manageableUsers.filter(u => u.role === 'student').length,
    professors: manageableUsers.filter(u => u.role === 'professor').length,
    admins: manageableUsers.filter(u => u.role === 'admin').length,
    active: manageableUsers.filter(u => u.status === 'active').length,
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage all platform users and their permissions
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: 'groups', color: 'primary' },
          { label: 'Students', value: stats.students, icon: 'school', color: 'blue' },
          { label: 'Professors', value: stats.professors, icon: 'co_present', color: 'purple' },
          { label: 'Admins', value: stats.admins, icon: 'admin_panel_settings', color: 'amber' },
          { label: 'Active', value: stats.active, icon: 'check_circle', color: 'green' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-500`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="professor">Professors</option>
              {canManageAdmins && <option value="admin">Admins</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Enrollment Number</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Last Login</th>
              <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-bold">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-slate-400">
                      {getRoleIcon(user.role)}
                    </span>
                    <span className="capitalize">{user.role}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-400">
                  {user.enrollmentId || user.employeeId || '-'}
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteUserId(user.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-500 hover:text-red-500"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
            <p className="font-bold mt-2">No users found</p>
            <p className="text-sm text-slate-500">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-card rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); setEditingUser(null); resetForm(); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Role *</label>
                <div className={`grid gap-2 ${canManageAdmins ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {(['student', 'professor', ...(canManageAdmins ? ['admin'] : [])] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: role as Role })}
                      className={`p-3 rounded-lg border-2 text-center capitalize transition-all ${formData.role === role
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                    >
                      <span className="material-symbols-outlined text-lg mb-1 block">
                        {getRoleIcon(role as Role)}
                      </span>
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {formData.role === 'student' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Enrollment Number</label>
                  <input
                    type="text"
                    value={formData.enrollmentId}
                    onChange={(e) => setFormData({ ...formData, enrollmentId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              )}

              {(formData.role === 'professor' || formData.role === 'admin') && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              {errorMsg && (
                <p className="text-red-500 text-sm flex-1 flex items-center">{errorMsg}</p>
              )}
              <button
                onClick={() => { setShowCreateModal(false); setEditingUser(null); resetForm(); }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                disabled={!formData.name || !formData.email || isSubmitting}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Password Modal */}
      {createdPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-card rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-green-500">check_circle</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Account Created</h3>
                <p className="text-sm text-slate-500">Save these credentials — the password won't be shown again.</p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Name</span>
                <span className="font-medium">{createdUserName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Password</span>
                <span className="font-mono font-bold text-primary">{createdPassword}</span>
              </div>
            </div>
            <button
              onClick={() => { setCreatedPassword(null); setCreatedUserName(''); }}
              className="w-full px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-card rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-red-500">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Delete User?</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteUserId(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => { try { await onDeleteUser(deleteUserId); } catch {} setDeleteUserId(null); }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
