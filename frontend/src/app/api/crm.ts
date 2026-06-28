import { apiRequest } from "./client";

export type CrmSegmentRow = {
  id: number;
  name: string;
  criteria_json: string;
  created_at?: string | null;
};

export type CrmCampaignRow = {
  id: number;
  name: string;
  type: string;
  segment_id: number;
  message_template: string;
  scheduled_at?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export type CrmInteractionRow = {
  id: number;
  customer_id: number;
  type: string;
  notes: string;
  user_id: number;
  created_at?: string | null;
  agent_name?: string | null;
};

export function getCrmSegments(token: string) {
  return apiRequest<CrmSegmentRow[]>("/crm/segments", { token });
}

export function createCrmSegment(token: string, payload: { name: string; criteria_json: string }) {
  return apiRequest<number>("/crm/segments", {
    method: "POST",
    token,
    body: payload
  });
}

export function getCrmCampaigns(token: string) {
  return apiRequest<CrmCampaignRow[]>("/crm/campaigns", { token });
}

export function createCrmCampaign(
  token: string,
  payload: {
    name: string;
    type: string;
    segment_id: number;
    message_template: string;
    scheduled_at?: string;
  }
) {
  return apiRequest<number>("/crm/campaigns", {
    method: "POST",
    token,
    body: payload
  });
}

export function executeCrmCampaign(token: string, campaignId: number) {
  return apiRequest<boolean>(`/crm/campaigns/${campaignId}/execute`, {
    method: "POST",
    token
  });
}

export function getCustomerCrmHistory(token: string, customerId: number) {
  return apiRequest<CrmInteractionRow[]>(`/crm/customers/${customerId}/history`, { token });
}

export function createCrmInteraction(
  token: string,
  payload: {
    customer_id: number;
    type: string;
    notes: string;
  }
) {
  return apiRequest<number>("/crm/interactions", {
    method: "POST",
    token,
    body: payload
  });
}
