
import { User } from "@/lib/types";

export interface AdminSettings {
  adminEmails: string[];
  adminGroups: string[];
}

export interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  authAttempted: boolean;
  login: () => Promise<void>;
  logout: () => void;
  refreshEmployeeId: () => Promise<string | null>;
}
