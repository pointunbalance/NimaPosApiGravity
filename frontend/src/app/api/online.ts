import { apiRawRequest } from "./client";

export type OnlineChannelRow = {
  id?: number;
  key: string;
  name: string;
  is_active: number;
  settings_json: string;
};

export type OnlineOrderRow = {
  id?: number;
  order_no: string;
  external_ref?: string | null;
  channel_id: number;
  customer_id?: number | null;
  branch_id: number;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total: number;
  shipping_address?: string | null;
};

export function getOnlineChannels(token: string) {
  return apiRawRequest<OnlineChannelRow[]>("/online/channels", { token });
}

export function createOnlineChannel(
  token: string,
  payload: {
    key: string;
    name: string;
    is_active?: number;
    settings_json?: string;
  }
) {
  return apiRawRequest<OnlineChannelRow>("/online/channels", {
    method: "POST",
    token,
    body: payload
  });
}

export function getOnlineOrders(token: string, channelId?: number, status?: string) {
  const params = new URLSearchParams();
  if (channelId) params.set("channel_id", String(channelId));
  if (status) params.set("status", status);
  const query = params.toString();
  return apiRawRequest<OnlineOrderRow[]>(`/online/orders${query ? `?${query}` : ""}`, { token });
}
