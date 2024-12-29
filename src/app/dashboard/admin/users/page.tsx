'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { logAuditEvent } from '@/utils/auditLogger';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useRateLimit } from '@/hooks/useRateLimit';
import { UserIcon, EnvelopeIcon, KeyIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  created_at: string;
}

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password: string) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Rate limit configurations
const createUserLimit = { windowMs: 15 * 60 * 1000, max: 5 };
const updateRoleLimit = { windowMs: 15 * 60 * 1000, max: 10 };
const deleteUserLimit = { windowMs: 15 * 60 * 1000, max: 5 };

export default function AdminUserManagement() {
  const { checkRateLimit: checkCreateUserLimit } = useRateLimit(createUserLimit);
  const { checkRateLimit: checkUpdateRoleLimit } = useRateLimit(updateRoleLimit);
  const { checkRateLimit: checkDeleteUserLimit } = useRateLimit(deleteUserLimit);
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user', name: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const supabase = createClientComponentClient();
  const usersPerPage = 10;

  const validateEmail = (email: string) => {
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (password: string) => {
    if (!isStrongPassword(password)) {
      setPasswordError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    } else {
      setPasswordError('');
    }
  };

  const fetchUsers = useCallback(async (page: number, emailSearch: string, nameSearch: string, role: string, start: Date | null, end: Date | null) => {
    setIsLoading(true);
    const startIndex = (page - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage - 1;

    let query = supabase.from('users').select('*', { count: 'exact' });

    if (emailSearch) {
      query = query.ilike('email', `%${emailSearch}%`);
    }

    if (nameSearch) {
      query = query.ilike('name', `%${nameSearch}%`);
    }

    if (role !== 'all') {
      query = query.eq('role', role);
    }

    if (start) {
      query = query.gte('created_at', start.toISOString());
    }

    if (end) {
      query = query.lte('created_at', end.toISOString());
    }

    const { data, error, count } = await query.range(startIndex, endIndex);

    if (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } else {
      setUsers(data || []);
      setTotalPages(Math.ceil((count || 0) / usersPerPage));
    }
    setIsLoading(false);
  }, [supabase, usersPerPage]);

  useEffect(() => {
    fetchUsers(currentPage, emailSearchTerm, nameSearchTerm, roleFilter, startDate, endDate);
  }, [fetchUsers, currentPage, emailSearchTerm, nameSearchTerm, roleFilter, startDate, endDate]);

  const handleEmailSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleNameSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (emailError || passwordError) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    if (!checkCreateUserLimit()) {
      toast.error('Too many user creation attempts. Please try again later.');
      return;
    }
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: { role: newUser.role, name: newUser.name },
      });

      if (error) {
        console.error('Error creating user:', error);
        toast.error('Failed to create user');
      } else {
        console.log('User created:', data);
        fetchUsers(currentPage, emailSearchTerm, nameSearchTerm, roleFilter, startDate, endDate);
        setNewUser({ email: '', password: '', role: 'user', name: '' });
        toast.success('User created successfully');

        // Log audit event
        const { data: { user } } = await supabase.auth.getUser();
        await logAuditEvent({
          action: 'CREATE_USER',
          userId: user?.id || 'unknown',
          targetUserId: data.user.id,
          details: `Created user with email ${newUser.email} and role ${newUser.role}`,
        });
      }
    } catch (error) {
      toast.error('Too many user creation attempts. Please try again later.');
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    if (!checkUpdateRoleLimit()) {
      toast.error('Too many role update attempts. Please try again later.');
      return;
    }
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole },
      });

      if (error) {
        console.error('Error updating user role:', error);
        toast.error('Failed to update user role');
      } else {
        fetchUsers(currentPage, emailSearchTerm, nameSearchTerm, roleFilter, startDate, endDate);
        toast.success('User role updated successfully');

        // Log audit event
        const { data: { user } } = await supabase.auth.getUser();
        await logAuditEvent({
          action: 'UPDATE_USER_ROLE',
          userId: user?.id || 'unknown',
          targetUserId: userId,
          details: `Updated user role to ${newRole}`,
        });
      }
    } catch (error) {
      toast.error('Too many role update attempts. Please try again later.');
    }
  }

  async function deleteUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      if (!checkDeleteUserLimit()) {
        toast.error('Too many user deletion attempts. Please try again later.');
        return;
      }
      try {
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
          console.error('Error deleting user:', error);
          toast.error('Failed to delete user');
        } else {
          fetchUsers(currentPage, emailSearchTerm, nameSearchTerm, roleFilter, startDate, endDate);
          toast.success('User deleted successfully');

          // Log audit event
          const { data: { user } } = await supabase.auth.getUser();
          await logAuditEvent({
            action: 'DELETE_USER',
            userId: user?.id || 'unknown',
            targetUserId: userId,
            details: 'Deleted user',
          });
        }
      } catch (error) {
        toast.error('Too many user deletion attempts. Please try again later.');
      }
    }
  }

  async function resetPassword(email: string) {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success('Password reset email sent');
    } else {
      toast.error(data.error || 'Failed to send password reset email');
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-8 text-gray-800">User Management</h1>

      <div className="flex flex-col gap-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Create New User</h2>
          <form onSubmit={createUser} className="space-y-4">
          <div className="flex items-center space-x-4">
            <EnvelopeIcon className="h-6 w-6 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => {
                setNewUser({ ...newUser, email: e.target.value });
                validateEmail(e.target.value);
              }}
              className={`flex-grow border rounded-md p-2 ${emailError ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
          </div>
          {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}

          <div className="flex items-center space-x-4">
            <KeyIcon className="h-6 w-6 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => {
                setNewUser({ ...newUser, password: e.target.value });
                validatePassword(e.target.value);
              }}
              className={`flex-grow border rounded-md p-2 ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
          </div>
          {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}

          <div className="flex items-center space-x-4">
            <UserIcon className="h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="flex-grow border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex items-center space-x-4">
            <PencilIcon className="h-6 w-6 text-gray-400" />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="flex-grow border border-gray-300 rounded-md p-2"
            >
              <option value="user">User</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition duration-300">
            Create User
          </button>
        </form>
      </div>

        </div>

        <div className="bg-white rounded-lg shadow-md p-6 w-full">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">User List</h2>
          <div className="mb-4 space-y-4">
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search by email"
              value={emailSearchTerm}
              onChange={handleEmailSearch}
              className="flex-grow border border-gray-300 rounded-md p-2"
            />
            <input
              type="text"
              placeholder="Search by name"
              value={nameSearchTerm}
              onChange={handleNameSearch}
              className="flex-grow border border-gray-300 rounded-md p-2"
            />
            <select
              value={roleFilter}
              onChange={handleRoleFilter}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex space-x-4 items-center">
            <span>Created between:</span>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              selectsStart
              startDate={startDate || undefined}
              endDate={endDate || undefined}
              placeholderText="Start Date"
              className="border border-gray-300 rounded-md p-2"
            />
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              selectsEnd
              startDate={startDate || undefined}
              endDate={endDate || undefined}
              minDate={startDate || undefined}
              placeholderText="End Date"
              className="border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>
        {isLoading ? (
          <p className="text-center text-gray-500">Loading users...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-b p-2 text-left">Email</th>
                    <th className="border-b p-2 text-left">Name</th>
                    <th className="border-b p-2 text-left">Role</th>
                    <th className="border-b p-2 text-left">Created At</th>
                    <th className="border-b p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="border-b p-2">{user.email}</td>
                      <td className="border-b p-2">{user.name}</td>
                      <td className="border-b p-2">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="border border-gray-300 rounded-md p-1"
                        >
                          <option value="user">User</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="border-b p-2">{new Date(user.created_at).toLocaleString()}</td>
                      <td className="border-b p-2">
                        <button
                          onClick={() => resetPassword(user.email)}
                          className="bg-blue-500 text-white p-1 rounded-md hover:bg-blue-600 transition duration-300 mr-2"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition duration-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-gray-200 text-gray-700 p-2 rounded-md hover:bg-gray-300 transition duration-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-gray-200 text-gray-700 p-2 rounded-md hover:bg-gray-300 transition duration-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
