import { ApiError, getApiBaseUrl } from "./client";

type ProjectsEnvelope<T> = {
  ok?: boolean;
  success?: boolean;
  data?: T;
  error?: { message?: string } | null;
  detail?: string;
  message?: string;
};

type ProjectsOptions = {
  token?: string | null;
  method?: "GET" | "POST";
  body?: unknown;
};

export type ProjectRow = {
  id: number;
  name: string;
  customer_id?: number | null;
  description?: string | null;
  budget?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  created_at?: string | null;
};

export type ProjectTaskRow = {
  id: number;
  project_id: number;
  name: string;
  allocated_budget?: number | null;
  estimated_hours?: number | null;
  status: string;
};

export type ProjectCostingSummary = {
  project_id: number;
  project_name: string;
  total_budget: number;
  total_labor_cost: number;
  total_material_cost: number;
  total_actual_cost: number;
  remaining_budget: number;
  profit_margin_percentage: number;
};

async function projectsRequest<T>(path: string, options: ProjectsOptions = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  let payload: ProjectsEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ProjectsEnvelope<T>;
  } catch {
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.detail ?? payload?.error?.message ?? `HTTP ${response.status}`, response.status);
  }

  if (!(payload?.ok ?? payload?.success)) {
    throw new ApiError(payload?.detail ?? payload?.error?.message ?? payload?.message ?? "Unknown API error", response.status);
  }

  return payload?.data as T;
}

export function getProjects(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return projectsRequest<{ projects: ProjectRow[]; total: number }>(`/projects/${query}`, { token });
}

export function createProject(
  token: string,
  payload: {
    name: string;
    customer_id?: number;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
  }
) {
  return projectsRequest<{ id: number }>(`/projects/`, {
    method: "POST",
    token,
    body: payload
  });
}

export function getProjectTasks(token: string, projectId: number) {
  return projectsRequest<{ tasks: ProjectTaskRow[] }>(`/projects/${projectId}/wbs`, { token });
}

export function createProjectTask(
  token: string,
  projectId: number,
  payload: {
    name: string;
    allocated_budget?: number;
    estimated_hours?: number;
    status?: string;
  }
) {
  return projectsRequest<{ id: number }>(`/projects/${projectId}/wbs`, {
    method: "POST",
    token,
    body: payload
  });
}

export function createProjectTimesheet(
  token: string,
  projectId: number,
  payload: {
    task_id?: number;
    employee_id?: number;
    date: string;
    hours_worked: number;
    hourly_rate: number;
    note?: string;
  }
) {
  return projectsRequest<{ id: number }>(`/projects/${projectId}/timesheets`, {
    method: "POST",
    token,
    body: payload
  });
}

export function createProjectMaterialConsumption(
  token: string,
  projectId: number,
  payload: {
    task_id?: number;
    product_id: number;
    quantity: number;
    note?: string;
  }
) {
  return projectsRequest<{ id: number }>(`/projects/${projectId}/materials`, {
    method: "POST",
    token,
    body: payload
  });
}

export function getProjectCostingSummary(token: string, projectId: number) {
  return projectsRequest<ProjectCostingSummary>(`/projects/${projectId}/costing`, { token });
}
