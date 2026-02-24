import { useAuthContext } from '@/context/AuthContext';

export interface User {
  id: string;
  email: string;
}

export function useAuth() {
  return useAuthContext();
}
