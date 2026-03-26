import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "professor" | "student" | null;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  const checkPasswordFlag = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("user_id", userId)
      .single();
    setMustChangePassword(data?.must_change_password === true);
  };

  const detectRole = async (userId: string) => {
    const { data } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setRole("student");
      setStudentId(data.id);
    } else {
      setRole("professor");
      setStudentId(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkPasswordFlag(session.user.id);
        detectRole(session.user.id);
      } else {
        setMustChangePassword(false);
        setRole(null);
        setStudentId(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkPasswordFlag(session.user.id);
        detectRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut, mustChangePassword, role, studentId };
};
