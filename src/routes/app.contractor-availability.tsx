import { createFileRoute } from "@tanstack/react-router";
import { ContractorAvailability } from "@/features/dashboard/components/ContractorAvailability";

export const Route = createFileRoute("/app/contractor-availability")({
  component: ContractorAvailability,
});