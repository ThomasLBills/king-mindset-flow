import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Declaration {
  id: string;
  user_id: string;
  declaration_text: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export const useDeclarations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["user-declarations", user?.id];

  const { data: declarations = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_declarations")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as Declaration[];
    },
    enabled: !!user,
  });

  const addDeclaration = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error("Not authenticated");
      if (declarations.length >= 5) throw new Error("Maximum 5 declarations");
      const usedPositions = declarations.map((d) => d.position);
      let nextPos = 1;
      while (usedPositions.includes(nextPos) && nextPos <= 5) nextPos++;
      const { error } = await supabase.from("user_declarations").insert({
        user_id: user.id,
        declaration_text: text.trim(),
        position: nextPos,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateDeclaration = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_declarations")
        .update({ declaration_text: text.trim(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteDeclaration = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_declarations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { declarations, isLoading, addDeclaration, updateDeclaration, deleteDeclaration };
};
