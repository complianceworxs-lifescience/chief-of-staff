import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUser, type UserRole } from "@/contexts/user-context";
import { User, Shield, Eye, Upload } from "lucide-react";

const colors = {
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  borderLight: "#E5E7EB",
  accentTrust: "#002D62",
  accentWellness: "#2D5A27",
  accentWarm: "#FF6B6B",
};

const roleIcons: Record<UserRole, typeof Shield> = {
  strategic_architect: Shield,
  qa_lead: Eye,
  operator: Upload
};

const roleBadgeColors: Record<UserRole, { bg: string; text: string }> = {
  strategic_architect: { bg: "rgba(0, 45, 98, 0.15)", text: colors.accentTrust },
  qa_lead: { bg: "rgba(45, 90, 39, 0.15)", text: colors.accentWellness },
  operator: { bg: "rgba(255, 107, 107, 0.15)", text: colors.accentWarm }
};

export function UserRoleSelector() {
  const { currentUser, setCurrentUser, availableRoles } = useUser();
  const RoleIcon = roleIcons[currentUser.role];
  const badgeColor = roleBadgeColors[currentUser.role];

  const handleRoleChange = (role: UserRole) => {
    setCurrentUser({
      ...currentUser,
      role,
      name: role === "strategic_architect" ? "Demo Admin" : 
            role === "qa_lead" ? "QA Manager" : "Operator User"
    });
  };

  return (
    <div 
      className="p-4 rounded-lg border"
      style={{ backgroundColor: colors.bgMain, borderColor: colors.borderLight }}
    >
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4" style={{ color: colors.textSecondary }} />
        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
          Active Role
        </span>
      </div>
      
      <Select value={currentUser.role} onValueChange={handleRoleChange}>
        <SelectTrigger 
          className="w-full h-auto py-2"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}
          data-testid="select-user-role"
        >
          <div className="flex items-center gap-2">
            <RoleIcon className="w-4 h-4" style={{ color: badgeColor.text }} />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map(role => {
            const Icon = roleIcons[role.value];
            const color = roleBadgeColors[role.value];
            return (
              <SelectItem key={role.value} value={role.value}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: color.text }} />
                  <div>
                    <p className="font-medium text-sm">{role.label}</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {role.description.split(" - ")[0]}
                    </p>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <div className="mt-3">
        <Badge 
          className="text-xs w-full justify-center"
          style={{ backgroundColor: badgeColor.bg, color: badgeColor.text }}
        >
          {availableRoles.find(r => r.value === currentUser.role)?.description.split(" - ")[0]}
        </Badge>
      </div>
    </div>
  );
}
