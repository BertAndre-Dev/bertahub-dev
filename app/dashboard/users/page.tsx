"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Filter,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import { toast } from "react-toastify";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const handleDeleteUser = (name: string) => {
    confirmDeleteToast({
      name,
      onConfirm: async () => {
        // This page is using mock data (no API/delete yet).
        toast.success(`${name} deleted successfully!`);
      },
    });
  };

  // Mock user data
  const allUsers = [
    {
      id: "1",
      name: "John Smith",
      email: "john@estate.com",
      role: "Admin",
      status: "Active",
      unit: "101",
      joinDate: "2024-01-15",
      avatar: "JS",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah@estate.com",
      role: "Manager",
      status: "Active",
      unit: "102",
      joinDate: "2024-02-20",
      avatar: "SJ",
    },
    {
      id: "3",
      name: "Michael Brown",
      email: "michael@estate.com",
      role: "Resident",
      status: "Active",
      unit: "103",
      joinDate: "2024-03-10",
      avatar: "MB",
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily@estate.com",
      role: "Resident",
      status: "Inactive",
      unit: "104",
      joinDate: "2024-01-05",
      avatar: "ED",
    },
    {
      id: "5",
      name: "David Wilson",
      email: "david@estate.com",
      role: "Staff",
      status: "Active",
      unit: "105",
      joinDate: "2024-04-12",
      avatar: "DW",
    },
    {
      id: "6",
      name: "Lisa Anderson",
      email: "lisa@estate.com",
      role: "Resident",
      status: "Active",
      unit: "201",
      joinDate: "2024-02-28",
      avatar: "LA",
    },
  ];

  // Filter users
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.unit.includes(searchTerm);

    const matchesRole =
      selectedRole === "all" ||
      user.role.toLowerCase() === selectedRole.toLowerCase();
    const matchesStatus =
      selectedStatus === "all" ||
      user.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-500/10 text-red-700";
      case "Manager":
        return "bg-blue-500/10 text-blue-700";
      case "Staff":
        return "bg-purple-500/10 text-purple-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Active"
      ? "bg-green-500/10 text-green-700"
      : "bg-gray-500/10 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage estate residents, staff, and administrators
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 w-full md:w-auto"
          onClick={() => setShowAddUser(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="users-role">
                Role
              </label>
              <select
                id="users-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="resident">Resident</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="users-status">
                Status
              </label>
              <select
                id="users-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
              >
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Unit
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Join Date
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.unit}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.joinDate}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(user.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
                          onClick={() => handleDeleteUser(user.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-muted-foreground">
                      No users found matching your criteria
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {allUsers.length} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="cursor-pointer"
            >
              Previous
            </Button>
            <Button className="cursor-pointer" variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit User Modal */}
      {(showAddUser || editingUser) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <h2 className="font-heading text-xl font-bold">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>

              <div className="space-y-3">
                <div>
                  <label
                    className="text-sm font-medium"
                    htmlFor="user-full-name"
                  >
                    Full Name
                  </label>
                  <Input
                    id="user-full-name"
                    placeholder="John Doe"
                    className="mt-1 h-10"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" htmlFor="user-email">
                    Email
                  </label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="john@estate.com"
                    className="mt-1 h-10"
                  />
                </div>

                <div>
                  <label
                    className="text-sm font-medium"
                    htmlFor="user-modal-role"
                  >
                    Role
                  </label>
                  <select
                    id="user-modal-role"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm mt-1"
                  >
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Staff</option>
                    <option>Resident</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium" htmlFor="user-unit">
                    Unit
                  </label>
                  <Input
                    id="user-unit"
                    placeholder="101"
                    className="mt-1 h-10"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setShowAddUser(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setShowAddUser(false);
                    setEditingUser(null);
                  }}
                >
                  {editingUser ? "Update" : "Add"} User
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
