"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus, Edit, Trash2, Shield, User, Mail, Calendar, ChevronDown, ChevronRight, Package, CheckCircle, Clock, XCircle } from "lucide-react";
import { getAdminSession, isSuperUser } from "@/lib/admin-auth";
import type { Order } from "@/lib/orders-types";
import type { Task } from "@/lib/orders-types";
import Link from "next/link";

interface Worker {
  uid: string;
  name: string;
  email: string;
  role: string;
  createdAt: string | null;
}

interface WorkerWithOrders extends Worker {
  orders: Order[];
  tasksByOrder: Record<string, Task[]>;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workersWithOrders, setWorkersWithOrders] = useState<WorkerWithOrders[]>([]);
  const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(getAdminSession());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState({
    uid: "",
    name: "",
    email: "",
    role: "worker",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isSuperUser()) {
      return;
    }
    
    // Initial load
    loadWorkers();
    loadWorkersWithOrders(true); // Show loading on initial load
    
    // Auto-refresh every 3 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      if (isSuperUser() && document.visibilityState === 'visible') {
        loadWorkersWithOrders(false); // Silent refresh - no loading indicator
      }
    }, 3000); // 3 seconds
    
    // Refresh when page comes into focus
    const handleFocus = () => {
      if (isSuperUser()) {
        loadWorkers();
        loadWorkersWithOrders(true); // Show loading when manually refreshing
      }
    };
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSuperUser()) {
        loadWorkers();
        loadWorkersWithOrders(true); // Show loading when tab becomes visible
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadWorkersWithOrders = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      const sessionData = getAdminSession();
      if (!sessionData) return;

      // Get all workers
      const workersRes = await fetch("/api/admin/workers", {
        headers: { "x-admin-username": sessionData.username },
      });
      const workersData = await workersRes.json();
      
      if (!workersData.success) return;

      // Filter only workers (not admins/superadmins)
      const workerList = workersData.workers.filter((w: Worker) => w.role === "worker");

      // For each worker, fetch their orders and tasks
      const workersWithOrdersData: WorkerWithOrders[] = await Promise.all(
        workerList.map(async (worker: Worker) => {
          // Fetch orders assigned to this worker
          const ordersRes = await fetch(`/api/admin/orders?assigned_to=${worker.uid}`, {
            headers: { "x-admin-username": sessionData.username },
          });
          const ordersData = await ordersRes.json();
          const orders: Order[] = ordersData.success ? ordersData.orders : [];

          // For each order, fetch tasks
          const tasksByOrder: Record<string, Task[]> = {};
          await Promise.all(
            orders.map(async (order: Order) => {
              const tasksRes = await fetch(`/api/admin/tasks?order_id=${order.id}`, {
                headers: { "x-admin-username": sessionData.username },
              });
              const tasksData = await tasksRes.json();
              if (tasksData.success) {
                tasksByOrder[order.id] = tasksData.tasks || [];
              }
            })
          );

          return {
            ...worker,
            orders,
            tasksByOrder,
          };
        })
      );

      setWorkersWithOrders(workersWithOrdersData);
    } catch (err) {
      console.error("Error loading workers with orders:", err);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const toggleWorkerExpanded = (workerUid: string) => {
    const newExpanded = new Set(expandedWorkers);
    if (newExpanded.has(workerUid)) {
      newExpanded.delete(workerUid);
    } else {
      newExpanded.add(workerUid);
    }
    setExpandedWorkers(newExpanded);
  };

  const toggleOrderExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTaskStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full";
    switch (status) {
      case "completed":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "in_progress":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "pending":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case "cancelled":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const loadWorkers = async () => {
    try {
      setIsLoading(true);
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const res = await fetch("/api/admin/workers", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();
      if (data.success) {
        setWorkers(data.workers);
      } else {
        setError(data.error || "Failed to load workers");
      }
    } catch (err) {
      setError("Failed to load workers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      // Ensure role is exactly what was selected (superadmin, admin, or worker)
      const requestBody = {
        uid: formData.uid.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role, // Keep exact role value from dropdown
      };


      const res = await fetch("/api/admin/workers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Worker added successfully!");
        setShowAddModal(false);
        setFormData({ uid: "", name: "", email: "", role: "worker" });
        await loadWorkers();
        await loadWorkersWithOrders();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to add worker");
      }
    } catch (err) {
      setError("Failed to add worker");
      console.error("Error adding worker:", err);
    }
  };

  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editingWorker) {
      setError("No worker selected for editing");
      return;
    }

    // Validation
    if (!formData.name || formData.name.trim() === "") {
      setError("Name is required");
      return;
    }

    if (!formData.role) {
      setError("Role is required");
      return;
    }

    const sessionData = getAdminSession();
    if (!sessionData) {
      setError("Session expired. Please login again.");
      return;
    }

    try {
      const requestBody = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role, // Ensure role is included
      };


      const res = await fetch(`/api/admin/workers/${editingWorker.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || data.message || `HTTP error! status: ${res.status}`;
        setError(errorMsg);
        return;
      }

      if (data.success) {
        setSuccess("Worker updated successfully!");
        setShowEditModal(false);
        setEditingWorker(null);
        setFormData({ uid: "", name: "", email: "", role: "worker" });
        await loadWorkers();
        await loadWorkersWithOrders();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMsg = data.error || data.message || "Failed to update worker";
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMessage = err.message || err.toString() || "Unknown error occurred";
      setError(`Failed to update worker: ${errorMessage}`);
      console.error("Error updating worker:", err);
    }
  };

  const handleDeleteWorker = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const res = await fetch(`/api/admin/workers/${uid}`, {
        method: "DELETE",
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Worker deleted successfully!");
        await loadWorkers();
        await loadWorkersWithOrders();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to delete worker");
      }
    } catch (err) {
      setError("Failed to delete worker");
    }
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    // Ensure we use the exact role from Firestore (superadmin, admin, or worker)
    const role = worker.role || "worker";
    setFormData({
      uid: worker.uid,
      name: worker.name,
      email: worker.email,
      role: role, // Use exact role from Firestore
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: string) => {
    if (role === "superadmin") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/20 text-[#D4AF37]">
          <Shield className="h-3 w-3" />
          Super Admin
        </span>
      );
    }
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-700">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <User className="h-3 w-3" />
        Worker
      </span>
    );
  };

  // Only superadmin can access workers management
  if (!isSuperUser()) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You don't have permission to access this page. Only superadmins can manage workers.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Workers Management
          </h1>
          <p className="text-gray-600">Manage workers and their roles</p>
        </div>
        <Button
          onClick={() => {
            setShowAddModal(true);
            setFormData({ uid: "", name: "", email: "", role: "worker" });
            setError("");
          }}
          className="bg-[#D4AF37] hover:bg-[#C19B2E]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Worker
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading workers...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Workers Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      UID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {workers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No workers found. Add your first worker to get started.
                      </td>
                    </tr>
                  ) : (
                    workers.map((worker) => {
                      const workerData = workersWithOrders.find(w => w.uid === worker.uid);
                      const ordersCount = workerData?.orders.length || 0;
                      const isExpanded = expandedWorkers.has(worker.uid);
                      
                      return (
                        <React.Fragment key={worker.uid}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              {worker.role === "worker" && ordersCount > 0 && (
                                <button
                                  onClick={() => toggleWorkerExpanded(worker.uid)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-5 w-5" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5" />
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">{worker.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2">
                              {worker.email && (
                                <>
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  {worker.email}
                                </>
                              )}
                              {!worker.email && <span className="text-gray-400">No email</span>}
                            </td>
                            <td className="px-6 py-4">{getRoleBadge(worker.role)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {worker.role === "worker" ? (
                                <span className="font-medium">{ordersCount} order(s)</span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                              {worker.uid.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {worker.createdAt ? (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  {new Date(worker.createdAt).toLocaleDateString()}
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  onClick={() => openEditModal(worker)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {worker.uid !== session?.username && (
                                  <Button
                                    onClick={() => handleDeleteWorker(worker.uid)}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {/* Expanded Orders and Tasks */}
                          {isExpanded && workerData && workerData.orders.length > 0 && (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 bg-gray-50">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm text-gray-700 mb-3">
                                    Orders & Tasks for {worker.name}
                                  </h4>
                                  {workerData.orders.map((order) => {
                                    const tasks = workerData.tasksByOrder[order.id] || [];
                                    const isOrderExpanded = expandedOrders.has(order.id);
                                    
                                    return (
                                      <div key={order.id} className="bg-white border rounded-lg p-4">
                                        <div 
                                          className="flex items-center justify-between cursor-pointer"
                                          onClick={() => toggleOrderExpanded(order.id)}
                                        >
                                          <div className="flex items-center gap-3 flex-1">
                                            <button className="text-gray-500">
                                              {isOrderExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4" />
                                              )}
                                            </button>
                                            <Package className="h-5 w-5 text-[#D4AF37]" />
                                            <div className="flex-1">
                                              <div className="flex items-center gap-3">
                                                <Link 
                                                  href={`/admin/orders/${order.id}`}
                                                  className="font-medium text-sm hover:text-[#D4AF37]"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  {order.order_number}
                                                </Link>
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                  order.status === "delivered" ? "bg-green-100 text-green-800" :
                                                  order.status === "processing" || order.status === "packing" || order.status === "packed" ? "bg-yellow-100 text-yellow-800" :
                                                  order.status === "cancelled" ? "bg-red-100 text-red-800" :
                                                  "bg-gray-100 text-gray-800"
                                                }`}>
                                                  {order.status}
                                                </span>
                                              </div>
                                              <div className="text-xs text-gray-500 mt-1">
                                                {order.customer.name} • ₹{order.total.toLocaleString()} • {tasks.length} task(s)
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {/* Expanded Tasks */}
                                        {isOrderExpanded && tasks.length > 0 && (
                                          <div className="mt-3 ml-8 space-y-2">
                                            {tasks.map((task) => (
                                              <div 
                                                key={task.id} 
                                                className="bg-gray-50 rounded p-3 border-l-2 border-[#D4AF37]"
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    {getTaskStatusIcon(task.status)}
                                                    <span className="text-sm font-medium">{task.type}</span>
                                                    <span className={getTaskStatusBadge(task.status)}>
                                                      {task.status}
                                                    </span>
                                                  </div>
                                                  <div className="text-xs text-gray-500">
                                                    Priority: {task.priority}
                                                  </div>
                                                </div>
                                                {task.notes && (
                                                  <div className="text-xs text-gray-600 mt-1 ml-6">
                                                    {task.notes}
                                                  </div>
                                                )}
                                                <div className="text-xs text-gray-400 mt-1 ml-6">
                                                  Created: {new Date(task.created_at).toLocaleDateString()}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {isOrderExpanded && tasks.length === 0 && (
                                          <div className="mt-3 ml-8 text-sm text-gray-500">
                                            No tasks for this order
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {workerData.orders.length === 0 && (
                                    <div className="text-sm text-gray-500 py-4">
                                      No orders assigned to this worker
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="font-serif text-2xl mb-4">Add New Worker</h2>
            <form onSubmit={handleAddWorker}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firebase UID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.uid}
                    onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                    placeholder="Enter Firebase UID"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get this from Firebase Authentication console
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter worker name"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email (optional)"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setError("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E]">
                  Add Worker
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Worker Modal */}
      {showEditModal && editingWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="font-serif text-2xl mb-4">Edit Worker</h2>
            <form onSubmit={handleEditWorker}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UID</label>
                  <input
                    type="text"
                    value={editingWorker.uid}
                    disabled
                    className="w-full rounded-md border border-gray-300 px-4 py-2 bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">UID cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter worker name"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email (optional)"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    disabled={editingWorker.uid === session?.username}
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                  {editingWorker.uid === session?.username && (
                    <p className="text-xs text-gray-500 mt-1">You cannot change your own role</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingWorker(null);
                    setError("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E]">
                  Update Worker
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

