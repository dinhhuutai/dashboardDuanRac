// Icon của mẫu đề xuất (lưu tên trong rq_Types.icon). Import từng icon — không import cả bộ lucide.
import {
  Banknote, Briefcase, Building2, CalendarDays, Car, ClipboardCheck, Clock, Coffee, FileText, GraduationCap, HardHat, HeartPulse,
  Laptop, Megaphone, Package, Plane, Printer, Receipt, ShieldCheck, ShoppingCart, Truck, Users, Wallet, Wrench,
} from "lucide-react";

export const TYPE_ICONS = {
  FileText, Wallet, Banknote, Receipt, CalendarDays, Clock, Plane, Car, Truck, ShoppingCart, Package, Wrench, HardHat, Laptop, Printer,
  Users, Briefcase, Building2, ClipboardCheck, ShieldCheck, HeartPulse, GraduationCap, Coffee, Megaphone,
};

export const TYPE_COLORS = ["#2563eb", "#0891b2", "#16a34a", "#65a30d", "#ca8a04", "#ea580c", "#dc2626", "#db2777", "#9333ea", "#4f46e5", "#475569"];

export function TypeIcon({ icon, color = "#2563eb", size = "md", className = "" }) {
  const Icon = TYPE_ICONS[icon] || FileText;
  const box = size === "sm" ? "h-8 w-8 rounded-lg" : size === "lg" ? "h-12 w-12 rounded-xl" : "h-10 w-10 rounded-xl";
  const ic = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${box} ${className}`} style={{ background: `${color}1a`, color }}>
      <Icon className={ic} />
    </span>
  );
}
