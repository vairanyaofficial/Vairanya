"use client";

import React from "react";
import { CheckCircle, Circle, Clock, Package, Truck } from "lucide-react";

interface OrderWorkflowProgressProps {
  orderStatus?: string;
}

// Simple order status steps
const ORDER_STEPS = [
  { status: "pending", label: "Pending", icon: Clock, description: "Order is pending confirmation" },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle, description: "Order has been confirmed" },
  { status: "processing", label: "Processing", icon: Package, description: "Order is being processed and packed" },
  { status: "packed", label: "Packed", icon: Package, description: "Order has been packed and ready for shipping" },
  { status: "shipped", label: "Shipped", icon: Truck, description: "Order has been shipped" },
  { status: "delivered", label: "Delivered", icon: CheckCircle, description: "Order has been delivered" },
];

export default function OrderWorkflowProgress({ orderStatus = "pending" }: OrderWorkflowProgressProps) {
  const getCurrentStepIndex = () => {
    const index = ORDER_STEPS.findIndex(step => step.status === orderStatus);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();
  const progress = Math.round(((currentStepIndex + 1) / ORDER_STEPS.length) * 100);

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "current";
    return "pending";
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
      <div className="mb-4">
        <h3 className="font-serif text-xl mb-2 text-gray-900 dark:text-white">Order Processing Progress</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-2">
            <div
              className="bg-[#D4AF37] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {ORDER_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const isCompleted = stepStatus === "completed";
          const isCurrent = stepStatus === "current";
          const isPending = stepStatus === "pending";
          const IconComponent = step.icon;

          return (
            <div
              key={step.status}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                isCompleted
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50"
                  : isCurrent
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-[#D4AF37] dark:border-[#D4AF37]"
                  : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
              }`}
            >
              <div
                className={`flex-shrink-0 mt-0.5 ${
                  isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : isCurrent
                    ? "text-[#D4AF37]"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : isCurrent ? (
                  <Clock className="h-6 w-6" />
                ) : (
                  <IconComponent className="h-6 w-6" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className={`font-semibold ${
                      isCompleted
                        ? "text-green-800 dark:text-green-300"
                        : isCurrent
                        ? "text-[#C19B2E] dark:text-[#D4AF37]"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-xs bg-[#D4AF37] text-white rounded-full">
                      Current
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-2 py-0.5 text-xs bg-green-600 dark:bg-green-700 text-white rounded-full">
                      Completed
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {orderStatus && (
        <div className="mt-4 pt-4 border-t dark:border-white/10">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">Order Status:</span>{" "}
            <span className="capitalize text-gray-900 dark:text-white">{orderStatus}</span>
          </p>
        </div>
      )}
    </div>
  );
}
