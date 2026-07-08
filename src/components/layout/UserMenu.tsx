import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { LogOut, CreditCard, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["my-profile-menu", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name, name")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  if (!user) return null;

  const displayName =
    profile?.display_name ||
    (profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null) ||
    profile?.name ||
    user.user_metadata?.name ||
    user.email ||
    "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/billing")} className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" /> Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
