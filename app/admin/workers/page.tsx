"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus, Edit, Trash2, Shield, User, Mail, Calendar, ChevronDown, ChevronRight, Package, CheckCircle, Clock, XCircle, ArrowLeft, Search, X } from "lucide-react";
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
    name: "",
    email: "",
    role: "worker",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "worker" | "admin" | "superadmin">("all");

  const loadWorkersWithOrdersRef = React.useRef({ current: false });
  
  useEffect(() => {
    if (!isSuperUser()) {
      return;
    }
    
    let refreshInterval: NodeJS.Timeout | null = null;
    let focusTimeout: NodeJS.Timeout | null = null;
    
    // Initial load
    loadWorkers();
    loadWorkersWithOrders(true); // Show loading on initial load
    
    // Function to start polling interval
    const startInterval = () => {
      if (refreshInterval) clearInterval(refreshInterval);
      // Auto-refresh every 60 seconds (reduced from 3 seconds to minimize server load)
      refreshInterval = setInterval(() => {
        if (isSuperUser() && document.visibilityState === 'visible' && !loadWorkersWithOrdersRef.current.current) {
          loadWorkersWithOrders(false); // Silent refresh - no loading indicator
        }
      }, 60000); // 60 seconds - significantly reduced server load
    };
    
    // Refresh when page comes into focus (debounced)
    const handleFocus = () => {
      if (focusTimeout) clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        if (isSuperUser() && !loadWorkersWithOrdersRef.current.current) {
          loadWorkers();
          loadWorkersWithOrders(true); // Show loading when manually refreshing
        }
      }, 1000); // Debounce focus events
    };
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSuperUser()) {
        if (!loadWorkersWithOrdersRef.current.current) {
          loadWorkers();
          loadWorkersWithOrders(true); // Show loading when tab becomes visible
        }
        if (!refreshInterval) {
          startInterval();
        }
      } else {
        // Page is hidden, stop polling
        if (refreshInterval) {
          clearInterval(refreshInterval);
          refreshInterval = null;
        }
      }
    };
    
    // Start interval
    startInterval();
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      if (focusTimeout) clearTimeout(focusTimeout);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  const loadWorkersWithOrders = async (showLoading = false) => {
    // Prevent multiple simultaneous requests
    if (loadWorkersWithOrdersRef.current.current) {
      return;
    }
    
    try {
      loadWorkersWithOrdersRef.current.current = true;
      if (showLoading) {
        setIsLoading(true);
      }
      
      const sessionData = getAdminSession();
      if (!sessionData) {
        if (showLoading) {
          setError("Not authenticated");
        }
        return;
      }

      // Get all workers
      const workersRes = await fetch("/api/admin/workers", {
        headers: { "x-admin-username": sessionData.username },
      });
      const workersData = await workersRes.json();
      
      if (!workersRes.ok || !workersData.success) {
        const errorMsg = workersData.error || workersData.message || "Failed to load workers";
        if (showLoading) {
          setError(errorMsg);
        }
        setWorkersWithOrders([]);
        return;
      }

      // Filter only workers (not admins/superadmins)
      const workerList = workersData.workers.filter((w: Worker) => w.role === "worker");

      // For each worker, fetch their orders and tasks
      // Note: These API calls now use cache, so multiple workers won't cause multiple DB queries
      const workersWithOrdersData: WorkerWithOrders[] = await Promise.all(
        workerList.map(async (worker: Worker) => {
          // Fetch orders assigned to this worker (uses cache if available)
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
      if (showLoading) {
        setError(""); // Clear error on success
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to load workers with orders";
      if (showLoading) {
        setError(errorMsg);
      }
      setWorkersWithOrders([]);
    } finally {
      loadWorkersWithOrdersRef.current.current = false;
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
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "in_progress":
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case "pending":
        return <Clock className="h-3 w-3 text-gray-600" />;
      case "cancelled":
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getTaskStatusBadge = (status: string) => {
    const baseClasses = "px-1.5 py-0.5 text-[10px] rounded-full";
    switch (status) {
      case "completed":
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300`;
      case "in_progress":
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300`;
      case "pending":
        return `${baseClasses} bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300`;
      case "cancelled":
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300`;
    }
  };

  const loadWorkers = async () => {
    try {
      setIsLoading(true);
      setError(""); // Clear previous errors
      const sessionData = getAdminSession();
      if (!sessionData) {
        setError("Not authenticated");
        return;
      }

      const res = await fetch("/api/admin/workers", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();
      
      if (!res.ok) {
        // Handle HTTP error status codes
        const errorMsg = data.error || data.message || `Failed to load workers (${res.status})`;
        setError(errorMsg);
        setWorkers([]);
        return;
      }

      if (data.success && data.workers) {
        setWorkers(data.workers);
        setError(""); // Clear error on success
      } else {
        const errorMsg = data.error || data.message || "Failed to load workers";
        setError(errorMsg);
        setWorkers([]);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to load workers: Network error";
      setError(errorMsg);
      setWorkers([]);
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
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
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
        setFormData({ name: "", email: "", role: "worker" });
        await loadWorkers();
        await loadWorkersWithOrders();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to add worker");
      }
    } catch (err) {
      setError("Failed to add worker");
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


      const res = await fetch(`/api/admin/workers/${encodeURIComponent(editingWorker.email)}`, {
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
        setFormData({ name: "", email: "", role: "worker" });
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
    }
  };

  const handleDeleteWorker = async (email: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const res = await fetch(`/api/admin/workers/${encodeURIComponent(email)}`, {
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
      name: worker.name,
      email: worker.email,
      role: role, // Use exact role from Firestore
    });
    setShowEditModal(true);
  };

  // Filter workers
  const filteredWorkers = useMemo(() => {
    let filtered = workers;

    // Filter by role
    if (filterRole !== "all") {
      filtered = filtered.filter((w) => w.role === filterRole);
    }

    // Search by name, email, or UID
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.email?.toLowerCase().includes(query) ||
          w.uid.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [workers, searchQuery, filterRole]);

  const getRoleBadge = (role: string) => {
    if (role === "superadmin") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#D4AF37]/20 dark:bg-[#D4AF37]/10 text-[#D4AF37]">
          <Shield className="h-2.5 w-2.5" />
          Super Admin
        </span>
      );
    }
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">
          <Shield className="h-2.5 w-2.5" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300">
        <User className="h-2.5 w-2.5" />
        Worker
      </span>
    );
  };

  // Only superadmin can access workers management
  if (!isSuperUser()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-12">
            You don't have permission to access this page. Only superadmins can manage workers.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading workers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Workers</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {workers.length}
            </span>
          </div>
          <Button
            onClick={() => {
              setShowAddModal(true);
              setFormData({ name: "", email: "", role: "worker" });
              setError("");
            }}
            size="sm"
            className="h-8 px-2 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Worker
          </Button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-300">
            {success}
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs md:text-sm border border-gray-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "worker", "admin", "superadmin"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterRole(filter)}
                className={`px-2 py-1 text-xs rounded-md transition-colors capitalize ${
                  filterRole === filter
                    ? "bg-[#D4AF37] text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {filter === "all" ? "All" : filter}
              </button>
            ))}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {filteredWorkers.length}/{workers.length}
            </span>
          </div>
        </div>

        {/* Workers List - Compact Cards */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
          {filteredWorkers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {searchQuery || filterRole !== "all" ? "No workers found" : "No workers yet"}
              </p>
              {!searchQuery && filterRole === "all" && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  size="sm"
                  className="h-8 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Worker
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-white/10 max-h-[calc(100vh-350px)] overflow-y-auto">
              {filteredWorkers.map((worker) => {
                const workerData = workersWithOrders.find(w => w.uid === worker.uid);
                const ordersCount = workerData?.orders.length || 0;
                const isExpanded = expandedWorkers.has(worker.uid);
                
                return (
                  <React.Fragment key={worker.uid}>
                    <div className="p-2 md:p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {worker.role === "worker" && ordersCount > 0 && (
                            <button
                              onClick={() => toggleWorkerExpanded(worker.uid)}
                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Users className="h-4 w-4 text-[#D4AF37] flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {worker.name}
                              </span>
                              {getRoleBadge(worker.role)}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                              {worker.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{worker.email}</span>
                                </div>
                              )}
                              {worker.role === "worker" && (
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  <span>{ordersCount} orders</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className="font-mono text-[10px]">{worker.uid.substring(0, 8)}...</span>
                              </div>
                              {worker.createdAt && (
                                <span>{new Date(worker.createdAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            onClick={() => openEditModal(worker)}
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {worker.uid !== session?.username && (
                            <Button
                              onClick={() => handleDeleteWorker(worker.email)}
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Expanded Orders and Tasks */}
                    {isExpanded && workerData && workerData.orders.length > 0 && (
                      <div className="px-2 md:px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border-t dark:border-white/10">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Orders & Tasks for {worker.name}
                          </h4>
                          {workerData.orders.map((order) => {
                            const tasks = workerData.tasksByOrder[order.id] || [];
                            const isOrderExpanded = expandedOrders.has(order.id);
                            
                            return (
                              <div key={order.id} className="bg-white dark:bg-[#0a0a0a] border dark:border-white/10 rounded-md p-2">
                                <div 
                                  className="flex items-center justify-between cursor-pointer"
                                  onClick={() => toggleOrderExpanded(order.id)}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <button className="p-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0">
                                      {isOrderExpanded ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                    </button>
                                    <Package className="h-3.5 w-3.5 text-[#D4AF37] flex-shrink-0" />
                                    <Link 
                                      href={`/admin/orders/${order.id}`}
                                      className="text-xs font-medium hover:text-[#D4AF37] text-gray-900 dark:text-white truncate"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {order.order_number}
                                    </Link>
                                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full flex-shrink-0 ${
                                      order.status === "delivered" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" :
                                      order.status === "processing" || order.status === "packing" || order.status === "packed" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" :
                                      order.status === "cancelled" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" :
                                      "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300"
                                    }`}>
                                      {order.status}
                                    </span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                      {order.customer.name} • ₹{order.total.toLocaleString()} • {tasks.length} tasks
                                    </span>
                                  </div>
                                </div>
                                {/* Expanded Tasks */}
                                {isOrderExpanded && tasks.length > 0 && (
                                  <div className="mt-2 ml-6 space-y-1.5">
                                    {tasks.map((task) => (
                                      <div 
                                        key={task.id} 
                                        className="bg-gray-50 dark:bg-[#1a1a1a] rounded p-2 border-l-2 border-[#D4AF37]"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            {getTaskStatusIcon(task.status)}
                                            <span className="text-xs font-medium text-gray-900 dark:text-white">{task.type}</span>
                                            <span className={getTaskStatusBadge(task.status)}>
                                              {task.status}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                            Priority: {task.priority}
                                          </div>
                                        </div>
                                        {task.notes && (
                                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-5">
                                            {task.notes}
                                          </div>
                                        )}
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-5">
                                          Created: {new Date(task.created_at).toLocaleDateString()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {isOrderExpanded && tasks.length === 0 && (
                                  <div className="mt-2 ml-6 text-xs text-gray-500 dark:text-gray-400">
                                    No tasks for this order
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Worker Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg max-w-md w-full border dark:border-white/10">
              <div className="p-3 md:p-4 border-b dark:border-white/10 flex items-center justify-between">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Add Worker</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setError("");
                  }}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleAddWorker} className="p-3 md:p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    User must sign in with this email to access admin/worker panel
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter worker name"
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2 border-t dark:border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddModal(false);
                      setError("");
                    }}
                    className="flex-1 h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="flex-1 h-8 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]">
                    Add Worker
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Worker Modal */}
        {showEditModal && editingWorker && (
          <div className="fixed inset-0 bg-gray-900/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg max-w-md w-full border dark:border-white/10">
              <div className="p-3 md:p-4 border-b dark:border-white/10 flex items-center justify-between">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Edit Worker</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingWorker(null);
                    setError("");
                  }}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleEditWorker} className="p-3 md:p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter worker name"
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    disabled
                  />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                    disabled={editingWorker.email === session?.username || editingWorker.uid === session?.username}
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                  {(editingWorker.email === session?.username || editingWorker.uid === session?.username) && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">You cannot change your own role</p>
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t dark:border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingWorker(null);
                      setError("");
                    }}
                    className="flex-1 h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="flex-1 h-8 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]">
                    Update Worker
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

