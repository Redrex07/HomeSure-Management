
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/common/DataTable";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { getContractorAvailability } from "@/core/db/supabase-queries";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/core/db/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";


const contractorId = 3001;

export function ContractorAvailability() {
  const contractorId = 3001;

  const { data: availability = [], isLoading, isError } = useQuery({
    queryKey: ["contractor-availability", contractorId],
    queryFn: () => getContractorAvailability(contractorId),
  });
  const [date, setDate] = useState("");
const [from, setFrom] = useState("");
const [to, setTo] = useState("");
const [status, setStatus] = useState("Available");
const [remarks, setRemarks] = useState("");
const queryClient = useQueryClient();

const handleSaveAvailability = async () => {

  const { error } = await supabase
    .from("contractor_availability")
    .insert({
      contractor_id: contractorId,
      available_date: date,
      available_from: from,
      available_to: to,
      availability_status: status,
      remarks: remarks,
    });

  if (error) {
    toast.error(error.message);
    return;
  }

  toast.success("Availability added");

  setDate("");
  setFrom("");
  setTo("");
  setStatus("Available");
  setRemarks("");

  queryClient.invalidateQueries({
    queryKey: ["contractor-availability"],
  });
};

  return (
    <>
     <PageHeader
  title="Availability"
  description="Manage your working schedule."
  actions={
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Availability</Button>
      </DialogTrigger>

      <DialogContent>

        <DialogHeader>
          <DialogTitle>Add Availability</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div>
            <Label>Contractor ID</Label>
            <Input
              value={contractorId}
              readOnly
            />
          </div>

          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Available From</Label>
            <Input
              type="time"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div>
            <Label>Available To</Label>
            <Input
              type="time"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div>
            <Label>Status</Label>

            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="Available">
                  Available
                </SelectItem>

                <SelectItem value="Busy">
                  Busy
                </SelectItem>

                <SelectItem value="On Leave">
                  On Leave
                </SelectItem>

              </SelectContent>

            </Select>

          </div>

          <div>
            <Label>Remarks</Label>

            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

          </div>

          <Button
            onClick={handleSaveAvailability}
            className="w-full"
          >
            Save Availability
          </Button>

        </div>

      </DialogContent>

    </Dialog>
  }
/>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <p className="animate-pulse text-sm text-slate-500">Loading availability...</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load availability. Please try again.
        </div>
      ) : (
        <DataTable
          rows={availability}
          filterKeys={["availability_id", "available_date", "availability_status", "remarks"]}
          empty="No availability records found."
          columns={[
            {
              key: "availability_id",
              header: "Availability ID",
              sortable: true,
              render: (item) => <span className="font-mono text-xs">#{item.availability_id}</span>,
            },
            { key: "contractor_id", header: "Contractor ID", render: (item) => `#${item.contractor_id}` },
            {
              key: "available_date",
              header: "Available date",
              sortable: true,
              render: (item) =>
                item.available_date
                  ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(item.available_date))
                  : "—",
            },
            { key: "available_from", header: "From" },
            { key: "available_to", header: "To" },
            {
              key: "availability_status",
              header: "Status",
              render: (item) => <StatusBadge value={item.availability_status} />,
            },
            {
              key: "remarks",
              header: "Remarks",
              render: (item) => <span className="block max-w-72 truncate" title={item.remarks || undefined}>{item.remarks || "—"}</span>,
            },
          ]}
        />
      )}
    </>
  );
}
