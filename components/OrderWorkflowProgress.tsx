"use client";

import React from "react";
import { CheckCircle, Circle, Clock, Package, CheckSquare, Truck } from "lucide-react";
import { WORKFLOW_STEPS, isStepCompleted, getCurrentStep, getWorkflowProgress } from "@/lib/workflow";
import type { Task } from "@/lib/orders-types";

interface OrderWorkflowProgressProps {
  tasks: Task[];
  orderStatus?: string;
}

export default function OrderWorkflowProgress({ tasks, orderStatus }: OrderWorkflowProgressProps) {
  const progress = getWorkflowProgress(tasks);
  const currentStep = getCurrentStep(tasks);

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case "packing":
        return <Package className="h-5 w-5" />;
      case "quality_check":
        return <CheckSquare className="h-5 w-5" />;
      case "shipping_prep":
        return <Truck className="h-5 w-5" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  const getStepTask = (stepType: string) => {
    return tasks.find((t) => t.type === stepType);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="mb-4">
        <h3 className="font-serif text-xl mb-2">Order Processing Progress</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#D4AF37] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {WORKFLOW_STEPS.map((step, index) => {
          const stepTask = getStepTask(step.type);
          const isCompleted = isStepCompleted(step.type, tasks);
          const isCurrent = currentStep?.type === step.type;
          const isPending = !isCompleted && !isCurrent;

          return (
            <div
              key={step.type}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                isCompleted
                  ? "bg-green-50 border-green-200"
                  : isCurrent
                  ? "bg-yellow-50 border-[#D4AF37]"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div
                className={`flex-shrink-0 mt-0.5 ${
                  isCompleted
                    ? "text-green-600"
                    : isCurrent
                    ? "text-[#D4AF37]"
                    : "text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : isCurrent ? (
                  <Clock className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`${
                      isCompleted
                        ? "text-green-600"
                        : isCurrent
                        ? "text-[#D4AF37]"
                        : "text-gray-400"
                    }`}
                  >
                    {getStepIcon(step.type)}
                  </div>
                  <h4
                    className={`font-semibold ${
                      isCompleted
                        ? "text-green-800"
                        : isCurrent
                        ? "text-[#C19B2E]"
                        : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </h4>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-xs bg-[#D4AF37] text-white rounded-full">
                      Current
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">
                      Completed
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>

                {stepTask && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      Status:{" "}
                      <span className="font-medium capitalize">
                        {stepTask.status.replace("_", " ")}
                      </span>
                    </p>
                    {stepTask.assigned_to && (
                      <p>
                        Assigned to: <span className="font-medium">{stepTask.assigned_to}</span>
                      </p>
                    )}
                    {stepTask.completed_at && (
                      <p>
                        Completed:{" "}
                        {new Date(stepTask.completed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {isPending && !stepTask && (
                  <p className="text-xs text-gray-400 italic">Waiting for previous step...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {orderStatus && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Order Status:</span>{" "}
            <span className="capitalize">{orderStatus}</span>
          </p>
        </div>
      )}
    </div>
  );
}

