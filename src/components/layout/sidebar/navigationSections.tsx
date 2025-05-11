
import {
  LayoutDashboard,
  Settings,
  Book,
  AlertTriangle,
  Shield,
  FileText,
  BookCheck,
  BarChart3,
  Users,
  AlertCircle,
  FileChartLine,
} from "lucide-react";
import { NavSection } from './types';

export const navigationSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "My Profile",
    items: [
      {
        name: "My Trainings",
        href: "/my-trainings",
        icon: Book,
      },
      {
        name: "My Qualifications",
        href: "/my-qualifications",
        icon: Shield,
      },
      {
        name: "My Advancement",
        href: "/required-trainings",
        icon: FileText,
      },
    ],
  },
  {
    title: "Records",
    items: [
      {
        name: "Employees",
        href: "/employees",
        icon: Users,
      },
      {
        name: "Trainings",
        href: "/courses",
        icon: BookCheck,
      },
    ],
  },
  {
    title: "Reports",
    items: [
      {
        name: "Qualification Reports",
        href: "/admin-reports",
        icon: FileChartLine,
      },
      {
        name: "Training Impact",
        href: "/training-impact",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        name: "Position Management",
        href: "/position-management",
        icon: Users,
        admin: true,
      },
      {
        name: "Training Validation",
        href: "/training-validation",
        icon: AlertCircle,
        admin: true,
      },
      {
        name: "Admin Settings",
        href: "/admin-settings",
        icon: Settings,
        admin: true,
      },
      {
        name: "BambooHR Troubleshooting",
        href: "/bamboo-troubleshooting",
        icon: AlertTriangle,
        admin: true,
      },
    ],
  },
];
