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
    last_sign_in_at?: string;
}

export default function UsersPage() {
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'user' as 'admin' | 'user'
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();
    const router = useRouter();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data as UserProfile[]);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [supabase]);

    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({ email: '', password: '', role: 'user' });
        setError(null);
        setShowModal(true);
    };

    const handleOpenEdit = (user: UserProfile) => {
        setEditingUser(user);
        setFormData({ email: user.email, password: '', role: user.role });
        setError(null);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const method = editingUser ? 'PUT' : 'POST';
            const body = {
                ...formData,
                id: editingUser?.id
            };

            const res = await fetch('/api/admin/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Operation failed');
            }

            setShowModal(false);
            fetchUsers();
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingUser) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/admin/users?id=${deletingUser.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Delete failed');
            }

            setDeletingUser(null);
            fetchUsers();
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
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
                    onClick={handleOpenCreate}
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
                            <th className="py-5 px-8 text-left font-bold font-sans">Email</th>
                            <th className="py-5 px-8 text-left font-bold font-sans">Uloga</th>
                            <th className="py-5 px-8 text-left font-bold font-sans">Registrovan</th>
                            <th className="py-5 px-8 text-left font-bold font-sans">Poslednja prijava</th>
                            <th className="py-5 px-8 text-right font-bold w-40 font-sans">Akcije</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
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
                                        {new Date(user.created_at).toLocaleDateString('sr-RS')}
                                    </td>
                                    <td className="py-4 px-8 text-slate-500 text-sm">
                                        {user.last_sign_in_at ? (
                                            <span className="text-slate-700">
                                                {new Date(user.last_sign_in_at).toLocaleString('sr-RS', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic">Nikad</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-8 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(user)}
                                                className="p-2 text-slate-400 hover:text-[#9cbe48] hover:bg-[#9cbe48]/10 rounded-lg transition-colors"
                                                title="Izmeni"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                            </button>
                                            <button
                                                onClick={() => setDeletingUser(user)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Obriši"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit User Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-[#121333]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-[#121333] transition-colors"
                            >
                                ✕
                            </button>

                            <h2 className="text-2xl font-bold text-[#121333] mb-6">
                                {editingUser ? 'Izmeni Korisnika' : 'Novi Korisnik'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
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
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9cbe48]/20 focus:border-[#9cbe48]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        {editingUser ? 'Nova Lozinka (opciono)' : 'Lozinka'}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={editingUser ? "Ostavite prazno ako ne menjate" : ""}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9cbe48]/20 focus:border-[#9cbe48]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Uloga</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9cbe48]/20 focus:border-[#9cbe48]"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#121333] text-white py-4 rounded-xl font-bold hover:bg-[#121333]/90 transition-all mt-4 disabled:opacity-50"
                                >
                                    {submitting ? 'Čuvanje...' : (editingUser ? 'Sačuvaj Izmene' : 'Kreiraj Korisnika')}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deletingUser && (
                    <div className="fixed inset-0 bg-[#121333]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 relative animate-in fade-in zoom-in duration-200 text-center">
                            <h3 className="text-xl font-bold text-[#121333] mb-2">Obriši korisnika?</h3>
                            <p className="text-slate-500 mb-6">
                                Da li ste sigurni da želite da obrišete korisnika <strong>{deletingUser.email}</strong>?
                                Ova akcija je nepovratna.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingUser(null)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Odustani
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={submitting}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Brisanje...' : 'Obriši'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
