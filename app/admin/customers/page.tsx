"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Mail, Phone, ShoppingBag, DollarSign, Calendar, Search, ArrowLeft, X, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { useAuth } from "@/components/AuthProvider";
import type { Customer } from "@/lib/offers-types";

export default function CustomersPage() {
  const router = useRouter();
  const { user, adminInfo } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user && !adminInfo) {
      router.replace("/");
      return;
    }
    
    if (!isAdminAuthenticated()) {
      router.replace("/login?mode=admin");
      return;
    }
    
    loadCustomers();
  }, [router, user, adminInfo]);

  // Filter customers with useMemo
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return customers;
    }
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
    );
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const res = await fetch("/api/admin/customers", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        console.log(`[Admin Customers] Loaded ${data.customers?.length || 0} customers`);
      } else {
        console.error(`[Admin Customers] Failed to load customers:`, data.error || data.message);
      }
    } catch (err: any) {
      console.error("[Admin Customers] Error loading customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedCustomer(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading customers...</p>
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {customers.length}
            </span>
          </div>
        </div>

        {/* Stats Summary - Compact */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-2 md:p-3 border dark:border-white/10">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300">Total</h3>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-[#D4AF37]" />
            </div>
            <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{customers.length}</p>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-2 md:p-3 border dark:border-white/10">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300">Orders</h3>
              <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-blue-600 dark:text-blue-500" />
            </div>
            <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
              {customers.reduce((sum, c) => sum + c.total_orders, 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-2 md:p-3 border dark:border-white/10">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300">Revenue</h3>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-green-600 dark:text-green-500" />
            </div>
            <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
              ₹{customers.reduce((sum, c) => sum + c.total_spent, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs md:text-sm border border-gray-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
        </div>

        {/* Customers List - Compact Cards */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? "No customers found" : "No customers yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-white/10 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.email}
                  className="p-2 md:p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-full bg-[#D4AF37]/20 dark:bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-[#D4AF37]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {customer.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {customer.email}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <ShoppingBag className="h-3 w-3" />
                            <span>{customer.total_orders}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <DollarSign className="h-3 w-3 text-green-600 dark:text-green-500" />
                            <span>₹{customer.total_spent.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(customer)}
                        className="h-7 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        <Link href={`/admin/offers?customer_email=${encodeURIComponent(customer.email)}`}>
                          Offer
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {showDetailModal && selectedCustomer && (
        <>
          <div
            className="fixed inset-0 bg-gray-900/20 dark:bg-black/40 z-50"
            onClick={handleCloseModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg border dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 md:p-4 border-b dark:border-white/10 sticky top-0 bg-white dark:bg-[#0a0a0a] z-10">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                  Customer Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-3 md:p-4 space-y-4">
                {/* Customer Info */}
                <div className="flex items-center gap-3 pb-3 border-b dark:border-white/10">
                  <div className="h-12 w-12 rounded-full bg-[#D4AF37]/20 dark:bg-[#D4AF37]/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {selectedCustomer.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedCustomer.email}
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Contact Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{selectedCustomer.email}</span>
                    </div>
                    {selectedCustomer.phone ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{selectedCustomer.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Phone className="h-4 w-4" />
                        <span>No phone number</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Statistics */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Order Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Total Orders</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedCustomer.total_orders}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Total Spent</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ₹{selectedCustomer.total_spent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedCustomer.last_order_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Last Order: {new Date(selectedCustomer.last_order_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Addresses */}
                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Addresses ({selectedCustomer.addresses.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedCustomer.addresses.map((address, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-start gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{address.name}</p>
                              <p className="text-gray-600 dark:text-gray-400">{address.address_line1}</p>
                              {address.address_line2 && (
                                <p className="text-gray-600 dark:text-gray-400">{address.address_line2}</p>
                              )}
                              <p className="text-gray-600 dark:text-gray-400">
                                {address.city}, {address.state} {address.pincode}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">{address.country}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t dark:border-white/10">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <Link href={`/admin/offers?customer_email=${encodeURIComponent(selectedCustomer.email)}`}>
                      Create Offer
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCloseModal}
                    className="flex-1 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

