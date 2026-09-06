import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export function useWalletBalance() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("wallets").select("balance").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return Number(data?.balance ?? 0);
    },
  });
}
