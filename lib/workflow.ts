// Workflow configuration for order processing
import type { TaskType } from "./orders-types";

export interface WorkflowStep {
  type: TaskType;
  name: string;
  description: string;
  order: number; // Sequence order
  required: boolean; // Whether this step is required
}

// Define the workflow sequence
export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    type: "packing",
    name: "Packing",
    description: "Pack the order items",
    order: 1,
    required: true,
  },
  {
    type: "quality_check",
    name: "Quality Check",
    description: "Verify order quality and contents",
    order: 2,
    required: true,
  },
  {
    type: "shipping_prep",
    name: "Shipping Preparation",
    description: "Prepare order for shipping",
    order: 3,
    required: true,
  },
];

// Get next step in workflow
export function getNextStep(currentStepType: TaskType | null): WorkflowStep | null {
  if (!currentStepType) {
    return WORKFLOW_STEPS[0]; // Return first step if no current step
  }

  const currentStep = WORKFLOW_STEPS.find((step) => step.type === currentStepType);
  if (!currentStep) {
    return null;
  }

  const nextOrder = currentStep.order + 1;
  return WORKFLOW_STEPS.find((step) => step.order === nextOrder) || null;
}

// Get step by type
export function getStepByType(type: TaskType): WorkflowStep | null {
  return WORKFLOW_STEPS.find((step) => step.type === type) || null;
}

// Get all steps up to a certain step
export function getStepsUpTo(stepType: TaskType | null): WorkflowStep[] {
  if (!stepType) {
    return [];
  }

  const step = getStepByType(stepType);
  if (!step) {
    return [];
  }

  return WORKFLOW_STEPS.filter((s) => s.order <= step.order);
}

// Check if a step is completed
export function isStepCompleted(
  stepType: TaskType,
  tasks: Array<{ type: TaskType; status: string }>
): boolean {
  const task = tasks.find((t) => t.type === stepType);
  return task?.status === "completed" || false;
}

// Get workflow progress percentage
export function getWorkflowProgress(
  tasks: Array<{ type: TaskType; status: string }>
): number {
  const completedSteps = WORKFLOW_STEPS.filter((step) =>
    isStepCompleted(step.type, tasks)
  ).length;
  return Math.round((completedSteps / WORKFLOW_STEPS.length) * 100);
}

// Get current step (first incomplete step)
export function getCurrentStep(
  tasks: Array<{ type: TaskType; status: string }>
): WorkflowStep | null {
  for (const step of WORKFLOW_STEPS) {
    if (!isStepCompleted(step.type, tasks)) {
      return step;
    }
  }
  return null; // All steps completed
}

