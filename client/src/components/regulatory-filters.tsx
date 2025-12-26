import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

const colors = {
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  borderLight: "#E5E7EB",
  accentTeal: "#00A3A1",
};

export type JurisdictionFilter = "all" | "FDA" | "EMA" | "ISO";
export type ProductClassFilter = "all" | "I" | "II" | "III";

interface RegulatoryFiltersProps {
  jurisdiction: JurisdictionFilter;
  productClass: ProductClassFilter;
  onJurisdictionChange: (value: JurisdictionFilter) => void;
  onProductClassChange: (value: ProductClassFilter) => void;
}

export function RegulatoryFilters({
  jurisdiction,
  productClass,
  onJurisdictionChange,
  onProductClassChange,
}: RegulatoryFiltersProps) {
  return (
    <div 
      className="flex items-center gap-4 px-4 py-3 border-b"
      style={{ backgroundColor: colors.bgMain, borderColor: colors.borderLight }}
    >
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4" style={{ color: colors.textSecondary }} />
        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
          Filters:
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: colors.textSecondary }}>Jurisdiction:</span>
        <Select value={jurisdiction} onValueChange={(v) => onJurisdictionChange(v as JurisdictionFilter)}>
          <SelectTrigger 
            className="w-40 h-8 text-sm"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}
            data-testid="select-jurisdiction"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jurisdictions</SelectItem>
            <SelectItem value="FDA">US / FDA</SelectItem>
            <SelectItem value="EMA">EU / EMA</SelectItem>
            <SelectItem value="ISO">Global / ISO</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: colors.textSecondary }}>Product Class:</span>
        <Select value={productClass} onValueChange={(v) => onProductClassChange(v as ProductClassFilter)}>
          <SelectTrigger 
            className="w-32 h-8 text-sm"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}
            data-testid="select-product-class"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            <SelectItem value="I">Class I</SelectItem>
            <SelectItem value="II">Class II</SelectItem>
            <SelectItem value="III">Class III</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(jurisdiction !== "all" || productClass !== "all") && (
        <button
          className="text-sm underline"
          style={{ color: colors.accentTeal }}
          onClick={() => {
            onJurisdictionChange("all");
            onProductClassChange("all");
          }}
          data-testid="button-clear-filters"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
