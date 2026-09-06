import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export function useRoles() {
  const { user } = useSession();

  const query = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as string);
    },
  });

  const roles = query.data ?? [];
  return {
    roles,
    isAdmin: roles.includes("admin"),
    isOperator: roles.includes("operator"),
    isStaff: roles.includes("admin") || roles.includes("operator"),
    isLoading: query.isLoading,
  };
}
