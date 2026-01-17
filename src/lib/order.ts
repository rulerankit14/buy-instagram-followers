import { z } from "zod";

export type ServiceType = "followers" | "likes" | "views";

export type OrderPlan = {
  id: string;
  service: ServiceType;
  quantityLabel: string;
  priceLabel: string;
  amountInr: number;
  badge?: string;
  perks: string[];
};

export const orderDraftSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(30, "Username must be 30 characters or less")
    .regex(/^[a-zA-Z0-9._]+$/, "Only letters, numbers, . and _ allowed"),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number is too short")
    .max(16, "Phone number is too long")
    .regex(/^\+?[0-9 ]+$/, "Use digits only (optional +)")
    .transform((v) => v.replace(/\s+/g, "")),
});

export type OrderDraft = z.infer<typeof orderDraftSchema>;

export type Order = OrderDraft & {
  plan: OrderPlan;
  createdAt: string;
};


const ORDER_STORAGE_KEY = "ig_growth_order_v1";
const DRAFT_STORAGE_KEY = "ig_growth_draft_v1";

export function saveDraft(draft: OrderDraft) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function loadDraft(): OrderDraft | null {
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return orderDraftSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export function saveOrder(order: Order) {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
}

export function loadOrder(): Order | null {
  const raw = localStorage.getItem(ORDER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.plan) return null;
    return parsed as Order;
  } catch {
    return null;
  }
}

export function clearOrder() {
  localStorage.removeItem(ORDER_STORAGE_KEY);
}
