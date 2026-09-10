"use client";

import React, { useState } from "react";
import { User, api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import {
  Plus,
  X,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface AdminUsersViewProps {
  initialUsers: User[];
}

export function AdminUsersView({ initialUsers }: AdminUsersViewProps) {
  const { user: currentUser, switchUser } = useAuth();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New user form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [password, setPassword] = useState("Welcome@123");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Authorization: Only Admin and Lead can add and edit roles for employees
  const canManageRoles =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "LEAD" ||
    currentUser?.email === "dharunkumar.j@solidpro-es.com";

  const showNotice = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (targetUser: User, newRole: string) => {
    if (!canManageRoles) {
      showNotice("error", "Permission Denied: Only Admin and Lead can edit employee roles.");
      return;
    }
    try {
      await api.updateUser(targetUser.id, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      showNotice("success", `Updated ${targetUser.name}'s role to ${newRole}`);
    } catch (err: any) {
      showNotice("error", err?.message || "Failed to update role");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRoles) {
      showNotice("error", "Permission Denied: Only Admin and Lead can add new members.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createUser({
        name,
        email: email.trim().toLowerCase(),
        role,
        password: password || "Welcome@123",
        is_active: true,
      });
      setShowModal(false);
      setName("");
      setEmail("");
      setPassword("Welcome@123");
      setRole("EMPLOYEE");
      showNotice("success", `Successfully added new team member ${name}`);
      fetchUsers();
    } catch (err: any) {
      showNotice("error", err?.message || "Failed to create member");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (r: string) => {
    switch (r.toUpperCase()) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "LEAD":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "QC":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center space-x-2.5 p-3.5 rounded-xl text-xs font-medium border animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {users.length} Registered Personnel
          </span>
          {!canManageRoles && (
            <span className="text-[11px] text-slate-500 italic">
              (View Only — Only Admin and Lead can edit roles)
            </span>
          )}
        </div>

        {canManageRoles && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Full Name</th>
                <th className="p-3.5">Corporate Email</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5 text-right">Switch Active Persona</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400">#{u.id}</td>
                    <td className="p-3.5 font-bold text-slate-900 flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-blue-600 font-semibold">
                            (Currently Active)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 text-[11px]">{u.email}</td>
                    <td className="p-3.5">
                      {canManageRoles ? (
                        <div className="relative inline-block">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className={`text-xs font-semibold py-1 px-2.5 rounded-lg border outline-none cursor-pointer transition-all ${getRoleBadgeStyle(
                              u.role
                            )}`}
                          >
                            <option value="EMPLOYEE">EMPLOYEE (CAD Engineer)</option>
                            <option value="QC">QC (Quality Control Member)</option>
                            <option value="LEAD">LEAD (Team / QC Lead)</option>
                            <option value="ADMIN">ADMIN (System Admin)</option>
                          </select>
                        </div>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => switchUser(u.email)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200"
                        }`}
                      >
                        {isCurrent ? "Active Persona" : "Switch To"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-700 text-white">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm">Add New Team Member</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@solidpro-es.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="EMPLOYEE">EMPLOYEE (CAD Engineer)</option>
                  <option value="QC">QC (Quality Control Member)</option>
                  <option value="LEAD">LEAD (Team / QC Lead)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Welcome@123"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono text-slate-700"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Default corporate password is Welcome@123
                </span>
              </div>

              <div className="pt-3 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Add Member</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
