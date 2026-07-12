import { createFileRoute } from "@tanstack/react-router";
import { ContractorServiceRequests } from "@/features/dashboard/components";

export const Route = createFileRoute("/app/service-requests")({
  component: ContractorServiceRequests,
});