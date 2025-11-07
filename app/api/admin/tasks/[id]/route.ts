import { NextRequest, NextResponse } from "next/server";
import { getTaskById, updateTask, deleteTask, getTasksByOrder, createTask, getOrderById, updateOrder } from "@/lib/orders-firestore";
import { requireAdmin, requireSuperUser } from "@/lib/admin-auth-server";
import { getNextStep, getStepByType, WORKFLOW_STEPS, isStepCompleted } from "@/lib/workflow";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single task
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update task
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const updates = await request.json();

    const task = await getTaskById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Workers can only update their own tasks (except reassignment which requires superuser)
    const workerUsername = request.headers.get("x-admin-username") || auth.uid;
    if (auth.role === "worker" && task.assigned_to !== workerUsername) {
      return NextResponse.json(
        { success: false, error: "You can only update your own tasks" },
        { status: 403 }
      );
    }

    // Only superusers can reassign tasks
    if (updates.assigned_to !== undefined && updates.assigned_to !== task.assigned_to) {
      if (auth.role !== "superuser") {
        return NextResponse.json(
          { success: false, error: "Only superusers can reassign tasks" },
          { status: 403 }
        );
      }
    }

    const updatedTask = await updateTask(id, updates);
    
    // Auto-create next task and update order status when current task is completed
    if (updates.status === "completed" && task.status !== "completed") {
      try {
        // Get all tasks for this order
        const orderTasks = await getTasksByOrder(task.order_id);
        
        // Get the current step
        const currentStep = getStepByType(task.type);
        if (currentStep) {
          // Get next step in workflow
          const nextStep = getNextStep(task.type);
          
          if (nextStep) {
            // Check if next task already exists
            const nextTaskExists = orderTasks.some(
              (t) => t.type === nextStep.type
            );
            
            if (!nextTaskExists) {
              // Get order details
              const order = await getOrderById(task.order_id);
              if (order) {
                // Create next task with same worker assignment
                await createTask({
                  order_id: task.order_id,
                  order_number: task.order_number,
                  type: nextStep.type,
                  assigned_to: task.assigned_to, // Assign to same worker
                  assigned_by: auth.uid || task.assigned_by,
                  priority: task.priority,
                  status: "pending",
                });
              }
            }
          }
        }

        // Check if all workflow tasks are completed and update order status accordingly
        const allOrderTasks = await getTasksByOrder(task.order_id);
        const allWorkflowTasksCompleted = WORKFLOW_STEPS.every(step => 
          isStepCompleted(step.type, allOrderTasks)
        );

        if (allWorkflowTasksCompleted) {
          const order = await getOrderById(task.order_id);
          if (order) {
            // Update order status based on workflow completion
            // If order is in processing/packing status, move to packed
            if (order.status === "processing" || order.status === "packing" || order.status === "confirmed") {
              await updateOrder(task.order_id, { status: "packed" });
            }
          }
        } else {
          // Update order status based on current task completion
          const order = await getOrderById(task.order_id);
          if (order) {
            // Map task types to order statuses
            if (task.type === "packing" && order.status === "confirmed") {
              await updateOrder(task.order_id, { status: "processing" });
            } else if (task.type === "quality_check" && order.status === "processing") {
              await updateOrder(task.order_id, { status: "packing" });
            }
          }
        }
      } catch (error) {
        // Log error but don't fail the task update
        console.error("Error updating order status after task completion:", error);
      }
    }
    
    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// DELETE - Delete task (superuser only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Only superusers can delete tasks" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const task = await getTaskById(id);
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    await deleteTask(id);
    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
