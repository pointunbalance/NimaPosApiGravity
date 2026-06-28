import { apiRequest } from "./client";

export type LabelTemplateRow = {
  id: number;
  name: string;
  type: string;
  width: number;
  height: number;
  horizontal_gap?: number;
  vertical_gap?: number;
  font_size?: number;
  show_name?: boolean | number;
  show_price?: boolean | number;
  show_code?: boolean | number;
  show_store_name?: boolean | number;
  custom_text?: string | null;
  barcode_format?: string | null;
  paper_type?: string | null;
  labels_per_row?: number | null;
  design_type?: string | null;
  config_json?: string | null;
  created_at?: string | null;
};

export type PrintableProductRow = {
  id: number;
  name: string;
  barcode?: string | null;
  price?: number | null;
  sku?: string | null;
  stock_qty?: number | null;
};

export function getLabelTemplates(token: string, type?: string) {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiRequest<LabelTemplateRow[]>(`/label-templates${query}`, { token });
}

export function createLabelTemplate(
  token: string,
  payload: {
    name: string;
    type: string;
    width?: number;
    height?: number;
    horizontal_gap?: number;
    vertical_gap?: number;
    font_size?: number;
    show_name?: boolean;
    show_price?: boolean;
    show_code?: boolean;
    show_store_name?: boolean;
    custom_text?: string;
    barcode_format?: string;
    paper_type?: string;
    labels_per_row?: number;
    design_type?: string;
    config_json?: string;
  }
) {
  return apiRequest<{ id: number }>(`/label-templates`, {
    method: "POST",
    token,
    body: payload
  });
}

export function getPrintableProducts(token: string, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiRequest<PrintableProductRow[]>(`/printing/products${query}`, { token });
}
