import { createFileRoute } from "@tanstack/react-router";
import { ContractorAvailability } from "@/features/dashboard/components";

export const Route = createFileRoute("/app/contractor-availability")({
  component: ContractorAvailability,
});