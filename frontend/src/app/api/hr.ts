import { ApiError, getApiBaseUrl } from "./client";

type HrEnvelope<T> = {
  ok?: boolean;
  success?: boolean;
  data?: T;
  error?: { message?: string } | null;
  detail?: string;
  message?: string;
};

type HrOptions = {
  token?: string | null;
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
};

export type HrJobRow = {
  id: number;
  title: string;
  department: string;
  description?: string | null;
  requirements?: string | null;
  status: string;
  created_at?: string | null;
  closed_at?: string | null;
};

export type HrApplicantRow = {
  id: number;
  job_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  resume_url?: string | null;
  status: string;
  applied_at?: string | null;
};

export type HrInterviewRow = {
  id: number;
  applicant_id: number;
  interviewer_id: number;
  scheduled_at: string;
  feedback?: string | null;
  rating?: number | null;
  status: string;
  created_at?: string | null;
};

async function hrRequest<T>(path: string, options: HrOptions = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  let payload: HrEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as HrEnvelope<T>;
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

export function getHrJobs(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return hrRequest<{ jobs: HrJobRow[] }>(`/hr/jobs${query}`, { token });
}

export function createHrJob(
  token: string,
  payload: {
    title: string;
    department: string;
    description?: string;
    requirements?: string;
    status?: string;
  }
) {
  return hrRequest<{ id: number }>(`/hr/jobs`, {
    method: "POST",
    token,
    body: payload
  });
}

export function getHrApplicants(token: string, jobId: number) {
  return hrRequest<{ applicants: HrApplicantRow[] }>(`/hr/jobs/${jobId}/applicants`, { token });
}

export function createHrApplicant(
  token: string,
  payload: {
    job_id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    resume_url?: string;
    status?: string;
  }
) {
  return hrRequest<{ id: number }>(`/hr/applicants`, {
    method: "POST",
    token,
    body: payload
  });
}

export function updateHrApplicantStatus(token: string, applicantId: number, status: string) {
  return hrRequest<unknown>(`/hr/applicants/${applicantId}/status`, {
    method: "PATCH",
    token,
    body: { status }
  });
}

export function getHrInterviews(token: string, applicantId: number) {
  return hrRequest<{ interviews: HrInterviewRow[] }>(`/hr/applicants/${applicantId}/interviews`, { token });
}

export function createHrInterview(
  token: string,
  payload: {
    applicant_id: number;
    interviewer_id: number;
    scheduled_at: string;
    status?: string;
  }
) {
  return hrRequest<{ id: number }>(`/hr/interviews`, {
    method: "POST",
    token,
    body: payload
  });
}

export function submitHrInterviewFeedback(
  token: string,
  interviewId: number,
  payload: {
    feedback: string;
    rating: number;
    status?: string;
  }
) {
  return hrRequest<unknown>(`/hr/interviews/${interviewId}/feedback`, {
    method: "PATCH",
    token,
    body: payload
  });
}
