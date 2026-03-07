import React, { useState } from 'react';
import { User } from '../types';
import { useApp } from '../store/AppContext';

interface AdminManagementProps {
    users: User[];
    onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<any>;
    onUpdateUser: (id: string, updates: Partial<User>) => Promise<void>;
    onDeleteUser: (id: string) => Promise<void>;
}

const AdminManagement: React.FC<AdminManagementProps> = ({
    users,
    onAddUser,
    onUpdateUser,
    onDeleteUser,
}) => {
    const { hasPermission, currentUser } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'admin' as const,
        department: 'IT Department',
    });

    // Only show admin-level users
    const adminUsers = users.filter(u =>
        u.role === 'admin' || u.role === 'subadmin' || u.role === 'superadmin'
    );

    const filteredUsers = adminUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const canManageAdmins = hasPermission('canManageAdmins');

    const handleAddAdmin = () => {
        if (!canManageAdmins) return;
        onAddUser({
            ...newUser,
            avatar: newUser.name.split(' ').map(n => n[0]).join('').toUpperCase(),
            status: 'active',
            employeeId: `ADM${Date.now()}`,
        });
        setShowAddModal(false);
        setNewUser({ name: '', email: '', role: 'admin', department: 'IT Department' });
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'superadmin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'admin': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'subadmin': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'superadmin': return 'Super Admin';
            case 'admin': return 'Admin';
            case 'subadmin': return 'Sub Admin';
            default: return role;
        }
    };

    if (!canManageAdmins) {
        return (
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-red-500 mb-4">block</span>
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Access Denied</h2>
                    <p className="text-red-600 dark:text-red-300">
                        You don't have permission to manage administrators. Only Super Admins can access this feature.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Admin Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage administrator accounts (Super Admin only)
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Add Administrator
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <span className="material-symbols-outlined">search</span>
                    </span>
                    <input
                        type="text"
                        placeholder="Search administrators..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                    />
                </div>
            </div>

            {/* Admin List */}
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">Administrator</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">Role</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">Department</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-6 py-4">
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
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(user.role || '')}`}>
                                            {getRoleLabel(user.role || '')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{user.department}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.status === 'active'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {user.id !== currentUser?.id && (
                                                <>
                                                    <button
                                                        onClick={() => onUpdateUser(user.id, {
                                                            status: user.status === 'active' ? 'inactive' : 'active'
                                                        })}
                                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                                                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">
                                                            {user.status === 'active' ? 'person_off' : 'person'}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteUser(user.id)}
                                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                                        title="Delete"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </>
                                            )}
                                            {user.id === currentUser?.id && (
                                                <span className="text-xs text-slate-400 italic">Current user</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">group_off</span>
                        <p className="text-slate-500">No administrators found</p>
                    </div>
                )}
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-background-card rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Add New Administrator</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                                >
                                    <option value="subadmin">Sub Admin</option>
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Department</label>
                                <input
                                    type="text"
                                    value={newUser.department}
                                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                                    placeholder="Enter department"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddAdmin}
                                disabled={!newUser.name || !newUser.email}
                                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold disabled:opacity-50"
                            >
                                Add Administrator
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
