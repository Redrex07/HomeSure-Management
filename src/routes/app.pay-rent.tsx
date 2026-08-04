import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/features/auth/store/auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInvoice } from "@/core/db/supabase-queries";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { CreditCard, Smartphone, Building, Wallet, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/shared/utils/utils";

export const Route = createFileRoute("/app/pay-rent")({
  head: () => ({ meta: [{ title: "Pay Rent — HomeSure" }] }),
  component: PayRentPage,
});

function PayRentPage() {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedMethod, setSelectedMethod] = useState<string>("upi");
  const [amount, setAmount] = useState<string>("15000");
  const [notes, setNotes] = useState<string>("");

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment completed successfully.");
      navigate({ to: "/app/invoices" });
    },
    onError: (err: any) => {
      toast.error("Payment failed: " + (err.message || String(err)));
    }
  });

  const handlePayNow = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    createMutation.mutate({
      amount: numAmount,
      status: "Paid",
      payment_method: selectedMethod,
      payment_reference: `DEMO-TXN-${Math.floor(Math.random() * 1000000)}`,
      reason: notes || "Rent Payment",
    });
  };

  const paymentMethods = [
    { id: "upi", name: "UPI", icon: Smartphone },
    { id: "card", name: "Credit / Debit Card", icon: CreditCard },
    { id: "netbanking", name: "Net Banking", icon: Building },
    { id: "wallet", name: "Wallet", icon: Wallet },
  ];

  return (
    <>
      <PageHeader
        title="Pay Rent"
        description="Complete your rent payment securely."
      />
      
      <div className="grid gap-6 md:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rent Summary</CardTitle>
              <CardDescription>Review your outstanding rent details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Property</p>
                  <p className="font-medium">Sunset Apartments</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unit</p>
                  <p className="font-medium">Apt 4B</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Landlord</p>
                  <p className="font-medium">John Doe</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium text-destructive">5th of every month</p>
                </div>
                <div className="pt-2 border-t mt-2">
                  <p className="text-muted-foreground">Monthly Rent</p>
                  <p className="font-medium">{formatINR(15000)}</p>
                </div>
                <div className="pt-2 border-t mt-2">
                  <p className="text-muted-foreground">Security Deposit</p>
                  <p className="font-medium">{formatINR(0)}</p>
                </div>
                <div className="col-span-2 pt-2 border-t mt-2 flex justify-between items-center">
                  <p className="text-lg font-semibold">Total Amount Payable</p>
                  <p className="text-lg font-bold text-primary">{formatINR(15000)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select your preferred way to pay.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`relative flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-xs font-medium text-center">{method.name}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (INR)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes for this payment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rent</span>
                <span className="font-medium">{formatINR(parseFloat(amount) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Charges</span>
                <span className="font-medium">{formatINR(0)}</span>
              </div>
              <div className="pt-4 border-t flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">{formatINR(parseFloat(amount) || 0)}</span>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handlePayNow}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Processing..." : "Pay Now"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate({ to: "/app/invoices" })}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
