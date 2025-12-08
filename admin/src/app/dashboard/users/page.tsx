'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
    isStaff: boolean;
    isSuperuser: boolean;
    dateJoined: string;
}

export default function UsersPage() {
    const { user, logout, getToken } = useAuthStore();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        isActive: true,
        isStaff: false,
        isSuperuser: false
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff' | 'user'>('all');

    // Redirect if not superuser
    useEffect(() => {
        if (user && !user.isSuperuser) {
            router.push('/dashboard');
        }
    }, [user, router]);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.users);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getToken();
            await axios.post(
                `${API_URL}/api/admin/users`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowCreateModal(false);
            setFormData({
                username: '',
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                isActive: true,
                isStaff: false,
                isSuperuser: false
            });
            loadUsers();
        } catch (error: any) {
            alert('Error creating user: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const token = getToken();
            await axios.put(
                `${API_URL}/api/admin/users/${editingUser.id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEditingUser(null);
            setFormData({
                username: '',
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                isActive: true,
                isStaff: false,
                isSuperuser: false
            });
            loadUsers();
        } catch (error: any) {
            alert('Error updating user: ' + (error.response?.data?.error || error.message));
        }
    };

    const editUser = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            password: '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            isActive: user.isActive,
            isStaff: user.isStaff,
            isSuperuser: user.isSuperuser
        });
    };

    const getRoleBadge = (user: User) => {
        if (user.isSuperuser) {
            return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">Admin</span>;
        }
        if (user.isStaff) {
            return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Staff</span>;
        }
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">User</span>;
    };

    // Filter users based on search term and role
    const filteredUsers = users.filter(u => {
        // Search filter
        const matchesSearch = searchTerm === '' ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.lastName && u.lastName.toLowerCase().includes(searchTerm.toLowerCase()));

        // Role filter
        const matchesRole =
            roleFilter === 'all' ||
            (roleFilter === 'admin' && u.isSuperuser) ||
            (roleFilter === 'staff' && u.isStaff && !u.isSuperuser) ||
            (roleFilter === 'user' && !u.isStaff && !u.isSuperuser);

        return matchesSearch && matchesRole;
    });

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-100">
                {/* Navigation */}
                <nav className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex">
                                <div className="flex-shrink-0 flex items-center">
                                    <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                                </div>
                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    <a
                                        href="/dashboard"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Dashboard
                                    </a>
                                    <a
                                        href="/dashboard/users"
                                        className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Users
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className="text-sm text-gray-700 mr-4">{user?.username}</span>
                                <button
                                    onClick={() => { logout(); router.push('/login'); }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Page Content */}
                <div className="py-10">
                    <header className="mb-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center mb-4">
                                <h1 className="text-3xl font-bold leading-tight text-gray-900">User Management</h1>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Create User
                                </button>
                            </div>

                            {/* Search and Filter */}
                            <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search by username, email, name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value as any)}
                                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="admin">Admin Only</option>
                                        <option value="staff">Staff Only</option>
                                        <option value="user">User Only</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main>
                        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                {loading ? (
                                    <div className="p-8 text-center">Loading...</div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                                        No users found matching your criteria.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map((u) => (
                                                    <tr key={u.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(u)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                {u.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button
                                                                onClick={() => editUser(u)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </main>
                </div>

                {/* Create/Edit Modal */}
                {(showCreateModal || editingUser) && (
                    <div className="fixed z-10 inset-0 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => { setShowCreateModal(false); setEditingUser(null); }}></div>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                            {editingUser ? 'Edit User' : 'Create New User'}
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Password {editingUser && '(leave blank to keep current)'}
                                                </label>
                                                <input
                                                    type="password"
                                                    required={!editingUser}
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.firstName}
                                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.lastName}
                                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isActive}
                                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Active</span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isStaff}
                                                        onChange={(e) => setFormData({ ...formData, isStaff: e.target.checked })}
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Staff</span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isSuperuser}
                                                        onChange={(e) => setFormData({ ...formData, isSuperuser: e.target.checked })}
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Superuser (Admin)</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="submit"
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                        >
                                            {editingUser ? 'Update' : 'Create'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowCreateModal(false); setEditingUser(null); }}
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
