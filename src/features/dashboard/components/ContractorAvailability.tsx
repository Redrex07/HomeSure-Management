
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
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

  const { data: availability = [] } = useQuery({
    queryKey: ["contractor-availability"],
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
    .from("ContractorAvailability")
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

      <Card>
       

        <CardContent>

          <table className="w-full border-collapse">

            <thead>

              <tr className="border-b">

                <th className="py-3 text-left">Availability ID</th>
                

            <th>Contractor ID</th>
<th>Date</th>
<th>Available From</th>
<th>Available To</th>
<th>Status</th>
<th>Remarks</th>

              </tr>

            </thead>

            <tbody>

              {availability.map((item: any) => (

               <tr key={item.availability_id}>
    <td>{item.availability_id}</td>
    <td>{item.contractor_id}</td>
    <td>{item.available_date}</td>
    <td>{item.available_from}</td>
    <td>{item.available_to}</td>
    <td>{item.availability_status}</td>
    <td>{item.remarks}</td>
</tr>

              ))}

              {availability.length === 0 && (

                <tr>

                  <td
                    colSpan={6}
                    className="py-8 text-center text-gray-500"
                  >
                    No availability records found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </CardContent>

      </Card>
    </>
  );
}