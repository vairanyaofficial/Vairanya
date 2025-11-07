"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  Package,
  Search,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  FileText,
  MapPin,
  User,
  Loader2,
  Printer,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { useToast } from "@/components/ToastProvider";
import type { Task, Order } from "@/lib/orders-types";

type TaskWithOrderFlag = Task & { isOrder?: boolean; orderStatus?: string };

export default function WorkerDashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<TaskWithOrderFlag | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ taskId: string; action: "start" | "complete" } | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const session = getAdminSession();
  const { showToast } = useToast();

  // Group tasks by order_id
  const ordersWithTasks = React.useMemo(() => {
    // Group tasks by order_id
    const tasksByOrder: Record<string, Task[]> = {};
    const standaloneTasks: Task[] = [];
    
    tasks.forEach(task => {
      if (task.order_id) {
        if (!tasksByOrder[task.order_id]) {
          tasksByOrder[task.order_id] = [];
        }
        tasksByOrder[task.order_id].push(task);
      } else {
        standaloneTasks.push(task);
      }
    });

    // Create structure: orders with their tasks
    const ordersWithTasksData = assignedOrders.map(order => ({
      order,
      tasks: tasksByOrder[order.id] || [],
    }));

    return {
      ordersWithTasks: ordersWithTasksData,
      standaloneTasks,
    };
  }, [tasks, assignedOrders]);

  // For stats calculation - use all items (orders + standalone tasks only)
  // Don't count tasks that belong to assigned orders, as the order itself is counted
  const allItems = React.useMemo(() => {
    // Get set of assigned order IDs for quick lookup
    const assignedOrderIds = new Set(assignedOrders.map(order => order.id));
    
    // Create items from orders
    const orderItems: TaskWithOrderFlag[] = assignedOrders.map(order => ({
      id: `order-${order.id}`,
      order_id: order.id,
      order_number: order.order_number,
      type: "packing" as const,
      status: order.status === "processing" || order.status === "packing" ? "in_progress" as const : 
              order.status === "packed" || order.status === "shipped" ? "completed" as const : 
              order.status === "delivered" ? "completed" as const :
              "pending" as const,
      assigned_to: order.assigned_to || "",
      assigned_by: "",
      created_at: order.created_at,
      updated_at: order.updated_at,
      priority: "medium" as const,
      order_details: {
        customer_name: order.customer.name,
        items: order.items,
        shipping_address: order.shipping_address,
      },
      isOrder: true,
      orderStatus: order.status,
    }));
    
    // Only include standalone tasks (tasks that don't belong to any assigned order)
    // This prevents double-counting: if an order is assigned, count the order, not its individual tasks
    const standaloneTaskItems: TaskWithOrderFlag[] = tasks
      .filter(task => !task.order_id || !assignedOrderIds.has(task.order_id))
      .map(t => ({ ...t, isOrder: false }));
    
    return [...orderItems, ...standaloneTaskItems];
  }, [tasks, assignedOrders]);

  // Calculate stats
  const stats = {
    pending: allItems.filter((t) => t.status === "pending").length,
    in_progress: allItems.filter((t) => t.status === "in_progress").length,
    completed: allItems.filter((t) => t.status === "completed").length,
    total: allItems.length,
  };

  useEffect(() => {
    loadTasks();
    loadAssignedOrders();
  }, []);

  // Auto-expand orders that have tasks when data is loaded (only once)
  useEffect(() => {
    if (ordersWithTasks.ordersWithTasks.length > 0 && expandedOrders.size === 0 && tasks.length > 0) {
      const ordersWithTasksIds = ordersWithTasks.ordersWithTasks
        .filter(({ tasks }) => tasks.length > 0)
        .map(({ order }) => order.id);
      if (ordersWithTasksIds.length > 0) {
        setExpandedOrders(new Set(ordersWithTasksIds));
      }
    }
  }, [tasks.length, assignedOrders.length]);

  const loadTasks = async () => {
    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const response = await fetch(
        `/api/admin/tasks?assigned_to=${sessionData.username}`,
        {
          headers: { 
            "x-admin-username": sessionData.username,
            "x-admin-role": sessionData.role,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
    }
  };

  const loadAssignedOrders = async () => {
    try {
      setIsLoading(true);
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const response = await fetch(
        `/api/admin/orders?assigned_to=${sessionData.username}`,
        {
          headers: { 
            "x-admin-username": sessionData.username,
            "x-admin-role": sessionData.role,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAssignedOrders(data.orders || []);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
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


  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      // Check if this is an order (not a task)
      if (taskId.startsWith("order-")) {
        showToast("Please view the order details to update its status");
        return;
      }

      setUpdatingTaskId(taskId);
      const sessionData = getAdminSession();
      if (!sessionData) {
        showToast("Session expired. Please login again.");
        return;
      }

      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
          "x-admin-role": sessionData.role,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        const statusMessage = newStatus === "completed" 
          ? "Task completed successfully! ✅" 
          : newStatus === "in_progress"
          ? "Task started! 🚀"
          : "Task updated successfully!";
        
        showToast(statusMessage);
        
        // Reload tasks and orders to get updated data
        await loadTasks();
        await loadAssignedOrders();
        
        // Update selected task if modal is open
        if (selectedTask?.id === taskId) {
          setSelectedTask(data.task);
        }
        
        // Close confirmation dialog if open
        setShowConfirmDialog(null);
      } else {
        showToast(data.error || "Failed to update task");
      }
    } catch (err) {
      showToast("Failed to update task. Please try again.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleStartTask = (taskId: string) => {
    setShowConfirmDialog({ taskId, action: "start" });
  };

  const handleCompleteTask = (taskId: string) => {
    setShowConfirmDialog({ taskId, action: "complete" });
  };

  const confirmAction = () => {
    if (!showConfirmDialog) return;
    
    if (showConfirmDialog.action === "complete") {
      updateTaskStatus(showConfirmDialog.taskId, "completed");
    } else if (showConfirmDialog.action === "start") {
      updateTaskStatus(showConfirmDialog.taskId, "in_progress");
    }
  };

  const viewTaskDetails = async (task: TaskWithOrderFlag) => {
    // Load full task details and order information
    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      let taskWithDetails = task;

      // If this is an order (not a task), load order details directly
      if (task.isOrder || task.id.startsWith("order-")) {
        try {
          const orderResponse = await fetch(`/api/admin/orders/${task.order_id}`, {
            headers: { 
              "x-admin-username": sessionData.username,
              "x-admin-role": sessionData.role,
            },
          });
          const orderData = await orderResponse.json();
          
          if (orderData.success && orderData.order) {
            const order = orderData.order;
            taskWithDetails = {
              ...task,
              order_details: {
                customer_name: order.customer?.name || "",
                items: order.items || [],
                shipping_address: order.shipping_address || {},
              },
            };
          }
        } catch (orderErr) {
        }
      } else {
        // Load task details
        const taskResponse = await fetch(`/api/admin/tasks/${task.id}`, {
          headers: { 
            "x-admin-username": sessionData.username,
            "x-admin-role": sessionData.role,
          },
        });
        const taskData = await taskResponse.json();
        
        if (taskData.success) {
          taskWithDetails = taskData.task;
        }

        // If order_details are not present, load order information
        if (!taskWithDetails.order_details) {
          try {
            const orderResponse = await fetch(`/api/admin/orders/${task.order_id}`, {
              headers: { 
                "x-admin-username": sessionData.username,
                "x-admin-role": sessionData.role,
              },
            });
            const orderData = await orderResponse.json();
            
            if (orderData.success && orderData.order) {
              const order = orderData.order;
              taskWithDetails = {
                ...taskWithDetails,
                order_details: {
                  customer_name: order.customer?.name || "",
                  items: order.items || [],
                  shipping_address: order.shipping_address || {},
                },
              };
            }
          } catch (orderErr) {
          }
        }
      }

      setSelectedTask(taskWithDetails);
      setShowTaskDetails(true);
    } catch (err) {
      setSelectedTask(task);
      setShowTaskDetails(true);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "pending":
      case "confirmed":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
      case "processing":
      case "packing":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
      case "packed":
      case "shipped":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return "bg-gray-100 text-gray-800 border-gray-300";
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "packing":
        return <Package className="h-5 w-5" />;
      case "quality_check":
        return <CheckCircle className="h-5 w-5" />;
      case "shipping_prep":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-2">
          Welcome, {session?.name || session?.username || "Worker"}!
        </h1>
        <p className="text-gray-600">Manage your assigned tasks and track your progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-[#2E2E2E]">{stats.total}</p>
            </div>
            <div className="bg-[#D4AF37]/10 rounded-full p-3">
              <FileText className="h-6 w-6 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
            </div>
            <div className="bg-gray-100 rounded-full p-3">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, task type, or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <Button onClick={() => {
            loadTasks();
            loadAssignedOrders();
          }} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Orders and Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {ordersWithTasks.ordersWithTasks.length === 0 && ordersWithTasks.standaloneTasks.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No orders or tasks found</p>
            <p className="text-gray-400 text-sm">
              You don't have any assigned orders or tasks yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Display Orders with Tasks */}
            {ordersWithTasks.ordersWithTasks.map(({ order, tasks: orderTasks }) => {
              const isExpanded = expandedOrders.has(order.id);
              
              // Filter tasks based on search and status
              const filteredOrderTasks = orderTasks.filter(task => {
                const matchesSearch = !searchTerm || 
                  task.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  task.type?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === "all" || task.status === statusFilter;
                return matchesSearch && matchesStatus;
              });

              // Check if order matches filters
              const orderMatchesSearch = !searchTerm || 
                order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
              
              const orderStatus = order.status === "processing" || order.status === "packing" ? "in_progress" : 
                                 order.status === "packed" || order.status === "shipped" || order.status === "delivered" ? "completed" : 
                                 "pending";
              const orderMatchesStatus = statusFilter === "all" || orderStatus === statusFilter;

              // Show order if it matches filters OR if it has tasks that match filters
              if (!orderMatchesSearch && !orderMatchesStatus && filteredOrderTasks.length === 0) {
                return null;
              }

              return (
                <div key={order.id} className="border-b border-gray-200">
                  {/* Order Header */}
                  <div className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            onClick={() => toggleOrderExpanded(order.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                          <div className="text-[#D4AF37]">
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              Order {order.order_number}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Status: <span className="font-medium capitalize">{order.status}</span>
                              {filteredOrderTasks.length > 0 && (
                                <> • {filteredOrderTasks.length} task(s)</>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-3 ml-11">
                          <span
                            className={`px-3 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            Assigned: {new Date(order.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {order.customer.name}
                          </span>
                          {order.shipping_address && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {order.shipping_address.city}, {order.shipping_address.state}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/worker/orders/${order.id}`}>
                          <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white">
                            View & Update Order
                          </Button>
                        </Link>
                        <Link href={`/worker/orders/${order.id}`}>
                          <Button
                            variant="outline"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Expanded Tasks Section */}
                    {isExpanded && filteredOrderTasks.length > 0 && (
                      <div className="mt-4 ml-11 space-y-3 border-t pt-4">
                        <h4 className="font-semibold text-sm text-gray-700 mb-3">
                          Tasks for this order:
                        </h4>
                        {filteredOrderTasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-gray-50 rounded-lg p-4 border-l-2 border-[#D4AF37]"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="text-[#D4AF37]">
                                    {getTaskTypeIcon(task.type)}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">
                                      {(task.type || "task").replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </h4>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 ml-8">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)}`}
                                  >
                                    {(task.priority || "medium").toUpperCase()} Priority
                                  </span>
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}
                                  >
                                    {(task.status || "unknown").replace("_", " ").toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Created: {new Date(task.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {task.notes && (
                                  <p className="text-xs text-gray-600 mt-2 ml-8">
                                    {task.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {task.status === "pending" && (
                                  <Button
                                    onClick={() => handleStartTask(task.id)}
                                    disabled={updatingTaskId === task.id}
                                    size="sm"
                                    className="bg-[#D4AF37] hover:bg-[#C19B2E] disabled:opacity-50"
                                  >
                                    {updatingTaskId === task.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Starting...
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-4 w-4 mr-2" />
                                        Start
                                      </>
                                    )}
                                  </Button>
                                )}
                                {task.status === "in_progress" && (
                                  <Button
                                    onClick={() => handleCompleteTask(task.id)}
                                    disabled={updatingTaskId === task.id}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                  >
                                    {updatingTaskId === task.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Completing...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Complete
                                      </>
                                    )}
                                  </Button>
                                )}
                                {task.status === "completed" && (
                                  <div className="flex items-center gap-2 text-green-600 text-sm">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Completed</span>
                                    {task.completed_at && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(task.completed_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <Button
                                  onClick={() => viewTaskDetails({ ...task, isOrder: false })}
                                  variant="outline"
                                  size="sm"
                                  disabled={updatingTaskId === task.id}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isExpanded && filteredOrderTasks.length === 0 && (
                      <div className="mt-4 ml-11 text-sm text-gray-500">
                        No tasks for this order
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Standalone Tasks (tasks without assigned orders) */}
            {ordersWithTasks.standaloneTasks
              .filter(task => {
                const matchesSearch = !searchTerm || 
                  task.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  task.type?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === "all" || task.status === statusFilter;
                return matchesSearch && matchesStatus;
              })
              .map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-[#D4AF37]">
                          {getTaskTypeIcon(task.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {(task.type || "task").replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </h3>
                          {task.order_number && (
                            <p className="text-sm text-gray-500">
                              Order:{" "}
                              <Link
                                href={`/worker/orders/${task.order_id}`}
                                className="text-[#D4AF37] hover:underline"
                              >
                                {task.order_number}
                              </Link>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span
                          className={`px-3 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)}`}
                        >
                          {(task.priority || "medium").toUpperCase()} Priority
                        </span>
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}
                        >
                          {(task.status || "unknown").replace("_", " ").toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          Created: {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {task.status === "pending" && (
                        <Button
                          onClick={() => handleStartTask(task.id)}
                          disabled={updatingTaskId === task.id}
                          className="bg-[#D4AF37] hover:bg-[#C19B2E] disabled:opacity-50"
                        >
                          {updatingTaskId === task.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 mr-2" />
                              Start Task
                            </>
                          )}
                        </Button>
                      )}
                      {task.status === "in_progress" && (
                        <Button
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={updatingTaskId === task.id}
                          className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                        >
                          {updatingTaskId === task.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Completing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete
                            </>
                          )}
                        </Button>
                      )}
                      {task.status === "completed" && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Completed</span>
                          {task.completed_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(task.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                      <Button
                        onClick={() => viewTaskDetails({ ...task, isOrder: false })}
                        variant="outline"
                        disabled={updatingTaskId === task.id}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Showing {ordersWithTasks.ordersWithTasks.length} order(s) with {tasks.length} task(s) total
      </div>

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl">Task Details</h3>
              <Button
                onClick={() => {
                  setShowTaskDetails(false);
                  setSelectedTask(null);
                }}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Task Type</h4>
                <p className="text-lg capitalize">
                  {(selectedTask.type || "task").replace("_", " ")}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Order Number</h4>
                <Link
                  href={`/worker/orders/${selectedTask.order_id}`}
                  className="text-[#D4AF37] hover:underline"
                >
                  {selectedTask.order_number}
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Status</h4>
                  <span
                    className={`inline-block px-3 py-1 text-xs rounded-full ${getStatusColor(
                      selectedTask.status
                    )}`}
                  >
                    {(selectedTask.status || "unknown").replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Priority</h4>
                  <span
                    className={`inline-block px-3 py-1 text-xs rounded-full border ${getPriorityColor(
                      selectedTask.priority
                    )}`}
                  >
                    {(selectedTask.priority || "medium").toUpperCase()}
                  </span>
                </div>
              </div>

              {selectedTask.order_details && (
                <>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Customer Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p>
                        <span className="font-medium">Name:</span>{" "}
                        {selectedTask.order_details.customer_name}
                      </p>
                      {selectedTask.order_details.shipping_address && (
                        <div>
                          <p className="font-medium mb-1">Shipping Address:</p>
                          <p className="text-sm text-gray-600">
                            {selectedTask.order_details.shipping_address.name}
                            <br />
                            {selectedTask.order_details.shipping_address.address_line1}
                            {selectedTask.order_details.shipping_address.address_line2 && (
                              <>
                                <br />
                                {selectedTask.order_details.shipping_address.address_line2}
                              </>
                            )}
                            <br />
                            {selectedTask.order_details.shipping_address.city},{" "}
                            {selectedTask.order_details.shipping_address.state} -{" "}
                            {selectedTask.order_details.shipping_address.pincode}
                            <br />
                            {selectedTask.order_details.shipping_address.country}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedTask.order_details.items && selectedTask.order_details.items.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-2">Order Items</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2">
                          {selectedTask.order_details.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>
                                {item.title} (Qty: {item.quantity})
                              </span>
                              <span className="font-medium">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedTask.notes && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Notes</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {selectedTask.notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(selectedTask.created_at).toLocaleString()}
                </div>
                {selectedTask.completed_at && (
                  <div>
                    <span className="font-medium">Completed:</span>{" "}
                    {new Date(selectedTask.completed_at).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                {selectedTask.isOrder ? (
                  <>
                    <Link href={`/worker/orders/${selectedTask.order_id}`} className="flex-1">
                      <Button className="w-full bg-[#D4AF37] hover:bg-[#C19B2E]">
                        View Order Details
                      </Button>
                    </Link>
                    <Link href={`/worker/orders/${selectedTask.order_id}`} className="flex-1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <Printer className="h-4 w-4 mr-2" />
                        Print Options
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    {selectedTask.status === "pending" && (
                      <Button
                        onClick={() => handleStartTask(selectedTask.id)}
                        disabled={updatingTaskId === selectedTask.id}
                        className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E] disabled:opacity-50"
                      >
                        {updatingTaskId === selectedTask.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Start Task
                          </>
                        )}
                      </Button>
                    )}
                    {selectedTask.status === "in_progress" && (
                      <Button
                        onClick={() => handleCompleteTask(selectedTask.id)}
                        disabled={updatingTaskId === selectedTask.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      >
                        {updatingTaskId === selectedTask.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Completing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Completed
                          </>
                        )}
                      </Button>
                    )}
                    {selectedTask.status === "completed" && (
                      <div className="flex-1 flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Task Completed</span>
                        {selectedTask.completed_at && (
                          <span className="text-sm text-gray-500">
                            on {new Date(selectedTask.completed_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-serif text-xl">
                {showConfirmDialog.action === "complete" ? "Complete Task?" : "Start Task?"}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {showConfirmDialog.action === "complete"
                ? "Are you sure you want to mark this task as completed? This action cannot be undone."
                : "Are you sure you want to start working on this task?"}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmDialog(null)}
                variant="outline"
                className="flex-1"
                disabled={updatingTaskId !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                disabled={updatingTaskId !== null}
                className={`flex-1 ${
                  showConfirmDialog.action === "complete"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-[#D4AF37] hover:bg-[#C19B2E]"
                } disabled:opacity-50`}
              >
                {updatingTaskId !== null ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : showConfirmDialog.action === "complete" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Yes, Complete
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Yes, Start
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

