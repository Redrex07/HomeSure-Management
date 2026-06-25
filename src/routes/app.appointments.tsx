import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointments,
  createAppointment,
  updateAppointmentDateTime,
  getServiceRequests,
  getContractors,
} from "@/core/db/supabase-queries";
import { Plus, Calendar as CalIcon, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export const Route = createFileRoute("/app/appointments")({
  head: () => ({ meta: [{ title: "Appointments — HomeSure" }] }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  // Mock calendar: week strip
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dates = [1, 2, 3, 4, 5, 6, 7];

  const queryClient = useQueryClient();

  const [openCreate, setOpenCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createRequestId, setCreateRequestId] = useState("");
  const [createContractorId, setCreateContractorId] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createTime, setCreateTime] = useState("");

  const [reschedulingAppointment, setReschedulingAppointment] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const { data: appointmentList = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  const {
    data: serviceRequests = [],
    isLoading: isLoadingServiceRequests,
    isError: isServiceRequestsError,
    error: serviceRequestsError,
  } = useQuery({
    queryKey: ["service-requests"],
    queryFn: getServiceRequests,
  });

  useEffect(() => {
    if (isServiceRequestsError && serviceRequestsError) {
      console.error("Failed to load service requests for appointments:", serviceRequestsError);
      toast.error(
        "Failed to load service requests: " +
          (serviceRequestsError instanceof Error
            ? serviceRequestsError.message
            : String(serviceRequestsError)),
      );
    }
  }, [isServiceRequestsError, serviceRequestsError]);

  const formatServiceRequestLabel = (sr: { id: string; title: string; property?: string }) =>
    `${sr.id} - ${sr.title}${sr.property ? ` - ${sr.property}` : ""}`;

  const { data: contractors = [] } = useQuery({
    queryKey: ["contractors"],
    queryFn: getContractors,
  });

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment scheduled successfully!");
      setOpenCreate(false);
      setCreateTitle("");
      setCreateRequestId("");
      setCreateContractorId("");
      setCreateDate("");
      setCreateTime("");
    },
    onError: (err: any) => {
      toast.error("Error scheduling appointment: " + (err.message || String(err)));
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: (payload: { id: string; date: string; time: string }) =>
      updateAppointmentDateTime(payload.id, { appointment_date: payload.date, appointment_time: payload.time }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment rescheduled successfully!");
      setReschedulingAppointment(null);
      setRescheduleDate("");
      setRescheduleTime("");
    },
    onError: (err: any) => {
      toast.error("Error rescheduling appointment: " + (err.message || String(err)));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRequestId || !createContractorId) {
      toast.error("Please select a service request and contractor.");
      return;
    }
    createMutation.mutate({
      title: createTitle,
      service_request_id: parseInt(createRequestId.replace("SR-", ""), 10),
      contractor_id: parseInt(createContractorId.replace("C-", ""), 10),
      appointment_date: createDate,
      appointment_time: createTime,
    });
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingAppointment) return;
    rescheduleMutation.mutate({
      id: reschedulingAppointment.id,
      date: rescheduleDate,
      time: rescheduleTime,
    });
  };

  const openRescheduleDialog = (appt: any) => {
    setReschedulingAppointment(appt);
    setRescheduleDate(appt.date);
    setRescheduleTime(appt.time);
  };

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Schedule and manage service visits."
        actions={
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> New appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Appointment</DialogTitle>
                <DialogDescription>
                  Schedule a contractor visit for a service request.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreateSubmit}>
                <div className="space-y-1.5">
                  <Label>Appointment Title / Purpose</Label>
                  <Input
                    placeholder="e.g. Initial Inspection, Leak Repair"
                    required
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Service Request</Label>
                  <Select
                    value={createRequestId}
                    onValueChange={setCreateRequestId}
                    disabled={
                      isLoadingServiceRequests ||
                      isServiceRequestsError ||
                      serviceRequests.length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingServiceRequests
                            ? "Loading service requests..."
                            : isServiceRequestsError
                              ? "Unable to load service requests"
                              : serviceRequests.length === 0
                                ? "No service requests available"
                                : "Select service request"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingServiceRequests && (
                        <SelectItem value="__loading__" disabled>
                          Loading service requests...
                        </SelectItem>
                      )}
                      {!isLoadingServiceRequests && isServiceRequestsError && (
                        <SelectItem value="__error__" disabled>
                          Failed to load service requests
                        </SelectItem>
                      )}
                      {!isLoadingServiceRequests &&
                        !isServiceRequestsError &&
                        serviceRequests.length === 0 && (
                          <SelectItem value="__empty__" disabled>
                            No service requests available
                          </SelectItem>
                        )}
                      {!isLoadingServiceRequests &&
                        !isServiceRequestsError &&
                        serviceRequests.map((sr) => (
                          <SelectItem key={sr.id} value={sr.id}>
                            {formatServiceRequestLabel(sr)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Contractor</Label>
                  <Select value={createContractorId} onValueChange={setCreateContractorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign a contractor" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.trade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      required
                      value={createDate}
                      onChange={(e) => setCreateDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      required
                      value={createTime}
                      onChange={(e) => setCreateTime(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpenCreate(false);
                      setCreateTitle("");
                      setCreateRequestId("");
                      setCreateContractorId("");
                      setCreateDate("");
                      setCreateTime("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Scheduling..." : "Schedule"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center border border-border/60 rounded-md bg-background/50">
          <p className="text-sm text-muted-foreground animate-pulse">Loading appointments...</p>
        </div>
      ) : (
        <>
          <Card className="border-border/70 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">June 2026 · This week</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="sm">
                  Today
                </Button>
                <Button variant="outline" size="sm">
                  Week
                </Button>
                <Button variant="outline" size="sm">
                  Month
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {days.map((d, i) => (
                  <div key={d} className="rounded-lg border border-border bg-background p-3">
                    <div className="text-xs font-medium text-muted-foreground">{d}</div>
                    <div className="mt-1 text-2xl font-bold tracking-tight">{dates[i]}</div>
                    <div className="mt-3 space-y-1">
                      {appointmentList
                        .filter((_, idx) => idx % 7 === i % Math.max(1, appointmentList.length))
                        .slice(0, 2)
                        .map((a, aIdx) => (
                          <div
                            key={a.id + "-" + i + "-" + aIdx}
                            className="rounded-md border border-primary/30 bg-primary-soft px-1.5 py-1 text-[10px] text-primary"
                          >
                            <div className="truncate font-medium">{a.time}</div>
                            <div className="truncate">{a.title}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {appointmentList.map((a) => (
              <Card key={a.id} className="border-border/70 shadow-card">
                <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <CalIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalIcon className="h-3 w-3" />
                          {a.date}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {a.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {a.property}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={a.status} />
                    <Button variant="outline" size="sm" onClick={() => openRescheduleDialog(a)}>
                      Reschedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!reschedulingAppointment} onOpenChange={(open) => !open && setReschedulingAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Update the date and time for this maintenance appointment.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleRescheduleSubmit}>
            <div className="space-y-1.5">
              <Label>Appointment Title</Label>
              <Input value={reschedulingAppointment?.title || ""} disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>New Date</Label>
                <Input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>New Time</Label>
                <Input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReschedulingAppointment(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={rescheduleMutation.isPending}>
                {rescheduleMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}


