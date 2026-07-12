import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/contractor-quotations/new")({
  component: NewQuotation,
});

function NewQuotation() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Create Quotation</h1>

      <p>Quotation Form will come here.</p>
    </div>
  );
}