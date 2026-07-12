import { createFileRoute } from "@tanstack/react-router";
import { ContractorProfile } from "@/features/dashboard/components/ContractorProfile";

export const Route = createFileRoute("/app/contractor-profile")({
  component: ContractorProfile,
});