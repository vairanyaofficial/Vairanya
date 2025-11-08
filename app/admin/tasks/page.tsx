"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Search,
  User,
  RefreshCw,
  Trash2,
  UserCog,
  FileText,
} from "lucide-react";
import { getAdminSession, isSuperUser } from "@/lib/admin-auth";
import type { Task, Order } from "@/lib/orders-types";
import { useToast } from "@/components/ToastProvider";

interface Worker {
  uid: string;
  name: string;
  email: string;
  role: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workerFilter, setWorkerFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [reassignWorker, setReassignWorker] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [newTask, setNewTask] = useState({
    order_id: "",
    type: "packing" as Task["type"],
    assigned_to: "",
    priority: "medium" as Task["priority"],
  });
  const session = getAdminSession();
  const { showError, showSuccess, showWarning } = useToast();

  useEffect(() => {
    // Initial load
    loadTasks(true); // Show loading on initial load
    if (isSuperUser()) {
      loadOrders();
      loadWorkers();
    }
    
    // Auto-refresh every 3 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadTasks(false); // Silent refresh - no loading indicator
      }
    }, 3000); // 3 seconds
    
    // Refresh when page comes into focus
    const handleFocus = () => {
      loadTasks(true); // Show loading when manually refreshing
      if (isSuperUser()) {
        loadOrders();
        loadWorkers();
      }
    };
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadTasks(true); // Show loading when tab becomes visible
        if (isSuperUser()) {
          loadOrders();
          loadWorkers();
        }
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

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, workerFilter]);

  const loadTasks = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const url =
        sessionData.role === "worker"
          ? `/api/admin/tasks?assigned_to=${sessionData.username}`
          : "/api/admin/tasks";

      const response = await fetch(url, {
        headers: { "x-admin-username": sessionData.username },
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const loadOrders = async () => {
    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const response = await fetch("/api/admin/orders?status=confirmed,processing", {
        headers: { "x-admin-username": sessionData.username },
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
    }
  };

  const loadWorkers = async () => {
    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const res = await fetch("/api/admin/workers", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();
      if (data.success) {
        // Filter only workers (not superusers)
        const workerList = data.workers.filter(
          (w: Worker) => w.role === "worker"
        );
        setWorkers(workerList);
      }
    } catch (err) {
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Filter by worker
    if (workerFilter !== "all") {
      filtered = filtered.filter((t) => t.assigned_to === workerFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.order_number.toLowerCase().includes(term) ||
          t.type.toLowerCase().includes(term)
      );
    }

    setFilteredTasks(filtered);
  };

  const createTask = async () => {
    if (!newTask.order_id || !newTask.assigned_to) {
      showWarning("Please select order and worker");
      return;
    }

    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const order = orders.find((o) => o.id === newTask.order_id);
      if (!order) {
        showError("Order not found");
        return;
      }

      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
        },
        body: JSON.stringify({
          ...newTask,
          order_number: order.order_number,
        }),
      });

      const data = await response.json();
      if (data.success) {
        loadTasks();
        setShowCreateModal(false);
        setNewTask({
          order_id: "",
          type: "packing",
          assigned_to: "",
          priority: "medium",
        });
        showSuccess("Task created successfully");
      }
    } catch (err) {
      showError("Failed to create task");
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        loadTasks();
        showSuccess("Task updated successfully");
      } else {
        showError(data.error || "Failed to update task");
      }
    } catch (err) {
      showError("Failed to update task");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "x-admin-username": sessionData.username,
        },
      });

      const data = await response.json();
      if (data.success) {
        loadTasks();
        setShowDeleteConfirm(null);
        showSuccess("Task deleted successfully");
      } else {
        showError(data.error || "Failed to delete task");
      }
    } catch (err) {
      showError("Failed to delete task");
    }
  };

  const reassignTask = async () => {
    if (!selectedTask || !reassignWorker) {
      showWarning("Please select a worker");
      return;
    }

    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const response = await fetch(`/api/admin/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
        },
        body: JSON.stringify({ assigned_to: reassignWorker }),
      });

      const data = await response.json();
      if (data.success) {
        loadTasks();
        setShowReassignModal(false);
        setSelectedTask(null);
        setReassignWorker("");
        showSuccess("Task reassigned successfully");
      } else {
        showError(data.error || "Failed to reassign task");
      }
    } catch (err) {
      showError("Failed to reassign task");
    }
  };

  const updateTaskNotes = async () => {
    if (!selectedTask) return;

    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const response = await fetch(`/api/admin/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
        },
        body: JSON.stringify({ notes: taskNotes }),
      });

      const data = await response.json();
      if (data.success) {
        loadTasks();
        setShowNotesModal(false);
        setSelectedTask(null);
        setTaskNotes("");
        showSuccess("Task notes updated successfully");
      } else {
        showError(data.error || "Failed to update notes");
      }
    } catch (err) {
      showError("Failed to update notes");
    }
  };

  const openReassignModal = (task: Task) => {
    setSelectedTask(task);
    setReassignWorker(task.assigned_to);
    setShowReassignModal(true);
  };

  const openNotesModal = (task: Task) => {
    setSelectedTask(task);
    setTaskNotes(task.notes || "");
    setShowNotesModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
      case "in_progress":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "low":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
    }
  };


  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-gray-900 dark:text-white">Tasks</h1>
        <div className="flex gap-3">
          {isSuperUser() && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#D4AF37] hover:bg-[#C19B2E]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
          <Button onClick={() => loadTasks(true)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-4 border dark:border-white/10 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by order number or task type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {isSuperUser() && (
            <select
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
              className="px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
            >
              <option value="all">All Workers</option>
              {workers.map((worker) => (
                <option key={worker.uid} value={worker.uid}>
                  {worker.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b dark:border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Task Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${task.order_id}`}
                        className="text-sm font-medium text-[#D4AF37] hover:underline"
                      >
                        {task.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm capitalize text-gray-900 dark:text-white">
                        {task.type.replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {workers.find((w) => w.uid === task.assigned_to)?.name ||
                            task.assigned_to}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {task.status === "pending" && (
                          <Button
                            onClick={() => updateTaskStatus(task.id, "in_progress")}
                            variant="outline"
                            size="sm"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {task.status === "in_progress" && (
                          <Button
                            onClick={() => updateTaskStatus(task.id, "completed")}
                            variant="outline"
                            size="sm"
                            className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Button
                          onClick={() => openNotesModal(task)}
                          variant="outline"
                          size="sm"
                          title="Edit Notes"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {isSuperUser() && (
                          <>
                            <Button
                              onClick={() => openReassignModal(task)}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Reassign Task"
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => setShowDeleteConfirm(task.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete Task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/orders/${task.order_id}`}>
                            View Order
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 max-w-md w-full mx-4 border dark:border-white/10">
            <h3 className="font-serif text-xl mb-4 text-gray-900 dark:text-white">Create New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Order</label>
                <select
                  value={newTask.order_id}
                  onChange={(e) => setNewTask({ ...newTask, order_id: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                >
                  <option value="">Select an order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} - {order.customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Task Type</label>
                <select
                  value={newTask.type}
                  onChange={(e) =>
                    setNewTask({ ...newTask, type: e.target.value as Task["type"] })
                  }
                  className="w-full px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                >
                  <option value="packing">Packing</option>
                  <option value="quality_check">Quality Check</option>
                  <option value="shipping_prep">Shipping Prep</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Assign To</label>
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                >
                  <option value="">Select a worker</option>
                  {workers.map((worker) => (
                    <option key={worker.uid} value={worker.uid}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })
                  }
                  className="w-full px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={createTask}
                disabled={!newTask.order_id || !newTask.assigned_to}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E]"
              >
                Create Task
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTask({
                    order_id: "",
                    type: "packing",
                    assigned_to: "",
                    priority: "medium",
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Task Modal */}
      {showReassignModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 max-w-md w-full mx-4 border dark:border-white/10">
            <h3 className="font-serif text-xl mb-4 text-gray-900 dark:text-white">Reassign Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Current Worker</label>
                <div className="px-4 py-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg text-gray-900 dark:text-white">
                  {workers.find((w) => w.uid === selectedTask.assigned_to)?.name ||
                    selectedTask.assigned_to}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Assign To</label>
                <select
                  value={reassignWorker}
                  onChange={(e) => setReassignWorker(e.target.value)}
                  className="w-full px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                >
                  <option value="">Select a worker</option>
                  {workers.map((worker) => (
                    <option key={worker.uid} value={worker.uid}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={reassignTask}
                disabled={!reassignWorker || reassignWorker === selectedTask.assigned_to}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E]"
              >
                Reassign
              </Button>
              <Button
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedTask(null);
                  setReassignWorker("");
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 max-w-md w-full mx-4 border dark:border-white/10">
            <h3 className="font-serif text-xl mb-4 text-gray-900 dark:text-white">Task Notes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Notes</label>
                <textarea
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Add notes about this task..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={updateTaskNotes}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E]"
              >
                Save Notes
              </Button>
              <Button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedTask(null);
                  setTaskNotes("");
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 max-w-md w-full mx-4 border dark:border-white/10">
            <h3 className="font-serif text-xl mb-4 text-gray-900 dark:text-white">Delete Task</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => deleteTask(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

