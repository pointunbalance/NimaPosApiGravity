import { apiRequest } from "./client";

export type ScaleConfigRow = {
  id: number;
  name?: string;
  device_name?: string;
  model?: string;
  ip_address?: string;
  port?: number;
  prefix?: string;
  barcode_type?: string;
  is_active?: boolean;
};

export type LabelTemplateRow = {
  id: number;
  name?: string;
  width_mm?: number;
  height_mm?: number;
  template_json?: string;
  is_default?: boolean;
};

export type ParsedBarcodeRow = {
  product_code?: string;
  weight?: number;
  price?: number;
  embedded_price?: number;
  embedded_weight?: number;
};

export function getScales(token: string) {
  return apiRequest<ScaleConfigRow[]>("/hardware/scales", { token });
}

export function createScale(
  token: string,
  payload: {
    name: string;
    prefix?: string;
    barcode_type?: string;
    ip_address?: string;
    port?: number;
    is_active?: boolean;
  }
) {
  return apiRequest<number>("/hardware/scales", {
    method: "POST",
    token,
    body: payload
  });
}

export function parseScaleBarcode(token: string, barcode: string) {
  return apiRequest<ParsedBarcodeRow>(`/hardware/barcode/parse?barcode=${encodeURIComponent(barcode)}`, { token });
}

export function getLabelTemplates(token: string) {
  return apiRequest<LabelTemplateRow[]>("/hardware/labels/templates", { token });
}

export function createLabelTemplate(
  token: string,
  payload: {
    name: string;
    width_mm: number;
    height_mm: number;
    template_json?: string;
    is_default?: boolean;
  }
) {
  return apiRequest<number>("/hardware/labels/templates", {
    method: "POST",
    token,
    body: payload
  });
}
