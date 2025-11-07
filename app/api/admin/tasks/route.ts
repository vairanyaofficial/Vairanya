import { NextRequest, NextResponse } from "next/server";
import {
  getAllTasks,
  createTask,
  getTasksByWorker,
  getTasksByOrder,
} from "@/lib/orders-firestore";
import { requireAdmin, requireSuperUser } from "@/lib/admin-auth-server";
import type { Task } from "@/lib/orders-types";

// GET - List all tasks
export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const workerUsername = searchParams.get("assigned_to");
    const orderId = searchParams.get("order_id");
    const status = searchParams.get("status");

    let tasks: Task[];

    if (orderId) {
      tasks = await getTasksByOrder(orderId);
    } else if (workerUsername) {
      tasks = await getTasksByWorker(workerUsername);
    } else {
      tasks = await getAllTasks();
    }

    // Filter by status
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }

    // Sort by created_at (newest first)
    tasks.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new task (superuser only)
export async function POST(request: NextRequest) {
  const auth = requireSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Only superusers can create tasks" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const task: Omit<Task, "id" | "created_at" | "updated_at"> = {
      ...body,
      assigned_by: auth.uid || "",
    };

    // Validate required fields
    if (!task.order_id || !task.assigned_to || !task.type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newTask = await createTask(task);
    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

