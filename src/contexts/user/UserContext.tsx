
import { createContext } from "react";
import { UserContextType } from "../types/userTypes";

export const UserContext = createContext<UserContextType | undefined>(undefined);
