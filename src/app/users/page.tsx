"use client";

"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfile {
    id: string;
    email: string;
    role: 'admin' | 'user';
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();
    const router = useRouter();

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setUsers(data as UserProfile[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [supabase]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);

        try {
            // Call API route to create user (since client SDK cannot create other users easily without being admin/service role)
            // Wait, we need an API route for this because RLS prevents 'creating a user in auth.users' from client side?
            // Yes, client side `signUp` logs you in. `admin.createUser` is only server side.
            // So we need POST /api/admin/users

            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                    role: newUserRole
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            setShowModal(false);
            setNewUserEmail('');
            setNewUserPassword('');
            fetchUsers();
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif text-[#121333]">Korisnici</h1>
                    <p className="text-slate-500 mt-2">Upravljanje pristupom sistemu</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#121333] text-white px-6 py-3 rounded-xl hover:bg-[#121333]/90 transition-all font-medium shadow-lg shadow-[#121333]/20"
                >
                    <UserPlus className="w-5 h-5" />
                    Dodaj Korisnika
                </button>
            </div>

            <div className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#121333] text-white">
                            <th className="py-5 px-8 text-left font-bold">Email</th>
                            <th className="py-5 px-8 text-left font-bold">Uloga</th>
                            <th className="py-5 px-8 text-left font-bold">Registrovan</th>
                            <th className="py-5 px-8 text-right font-bold">ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Učitavanje...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nema korisnika</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="py-4 px-8">
                                        <span className="font-medium text-[#121333]">{user.email}</span>
                                    </td>
                                    <td className="py-4 px-8">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-8 text-slate-500 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-8 text-right text-slate-400 font-mono text-xs">
                                        {user.id.substring(0, 8)}...
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[#121333]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-[#121333] transition-colors"
                        >
                            ✕
                        </button>

                        <h2 className="text-2xl font-bold text-[#121333] mb-6">Novi Korisnik</h2>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9cbe48]/20 focus:border-[#9cbe48]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Lozinka</label>
                                <input
                                    type="password"
                                    required
                                    value={newUserPassword}
                                    onChange={e => setNewUserPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9cbe48]/20 focus:border-[#9cbe48]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Uloga</label>
                                <select
                                    value={newUserRole}
                                    onChange={e => setNewUserRole(e.target.value as 'admin' | 'user')}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9cbe48]/20 focus:border-[#9cbe48]"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full bg-[#121333] text-white py-4 rounded-xl font-bold hover:bg-[#121333]/90 transition-all mt-4 disabled:opacity-50"
                            >
                                {creating ? 'Kreiranje...' : 'Kreiraj Korisnika'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
