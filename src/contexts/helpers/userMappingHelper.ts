
import { AccountInfo } from "@azure/msal-browser";
import { User } from "@/lib/types";
import { AdminSettings } from "../types/userTypes";

// Helper to convert MSAL account to our User type
export const mapAccountToUser = async (
  account: AccountInfo, 
  settings: AdminSettings,
  getEmployeeIdByEmail: (email: string) => Promise<string | null>
): Promise<User> => {
  // Determine user role based on email or group membership
  let role: 'user' | 'admin' = 'user';
  
  // Check if user is an admin based on their email
  if (settings.adminEmails.includes(account.username.toLowerCase())) {
    role = 'admin';
  }
  
  // Also check for admin group membership in token claims
  const groups = account.idTokenClaims?.groups as string[] | undefined;
  if (groups && groups.some(group => settings.adminGroups.includes(group))) {
    role = 'admin';
  }

  // Try to get the BambooHR employee ID from our mapping
  const employeeId = await getEmployeeIdByEmail(account.username);
  console.log(`Mapped employee ID for ${account.username}:`, employeeId);

  return {
    id: account.localAccountId,
    name: account.name || "Unknown User",
    email: account.username,
    role: role,
    employeeId: employeeId || account.localAccountId // Use the mapped ID if available, otherwise fall back to the account ID
  };
};
