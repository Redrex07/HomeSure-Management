import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/core/db/supabase";
import { useQuery } from "@tanstack/react-query";

import { getContractorProfile } from "@/core/db/supabase-queries";

import { PageHeader } from "@/shared/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

export function ContractorProfile() {
  const contractorId = 1;
  const [companyName, setCompanyName] = useState("");
const [contactPerson, setContactPerson] = useState("");
const [contractorType, setContractorType] = useState("");
const [serviceArea, setServiceArea] = useState("");
const [businessLicense, setBusinessLicense] = useState("");

const [experience, setExperience] = useState("");
const [specialization, setSpecialization] = useState("");
const [certification, setCertification] = useState("");
const [availableDays, setAvailableDays] = useState("");
const [availableTime, setAvailableTime] = useState("");
const [chargeType, setChargeType] = useState("");
const [hourlyRate, setHourlyRate] = useState("");
const [description, setDescription] = useState("");
const [emergencyService, setEmergencyService] = useState(false);

  const { data: contractor, isLoading } = useQuery({
    queryKey: ["contractor-profile"],
    queryFn: () => getContractorProfile(contractorId),
  });
  useEffect(() => {
  if (!contractor) return;

  setCompanyName(contractor.company_name || "");
  setContactPerson(contractor.contact_person || "");
  setContractorType(contractor.contractor_type || "");
  setServiceArea(contractor.service_area || "");
  setBusinessLicense(contractor.business_license || "");

  setExperience(String(contractor.years_of_experience || ""));
  setSpecialization(contractor.specialization || "");
  setCertification(contractor.certification || "");
  setAvailableDays(contractor.available_days || "");
  setAvailableTime(contractor.available_time || "");
  setChargeType(contractor.service_charge_type || "");
  setHourlyRate(String(contractor.hourly_rate || ""));
  setDescription(contractor.service_description || "");
  setEmergencyService(contractor.emergency_service || false);

}, [contractor]);
const handleSave = async () => {
  try {
    // Update Contractor table
    const { error: contractorError } = await supabase
      .from("Contractor")
      .update({
        company_name: companyName,
        contact_person: contactPerson,
        contractor_type: contractorType,
        service_area: serviceArea,
        business_license: businessLicense,
      })
      .eq("contractor_id", contractorId);

    if (contractorError) throw contractorError;

    // Update ContractorProfile table
    const { error: profileError } = await supabase
      .from("ContractorProfile")
      .update({
        years_of_experience: Number(experience),
        specialization: specialization,
        certification: certification,
        available_days: availableDays,
        available_time: availableTime,
        service_charge_type: chargeType,
        hourly_rate: Number(hourlyRate),
        service_description: description,
        emergency_service: emergencyService,
      })
      .eq("contractor_id", contractorId);

    if (profileError) throw profileError;

    toast.success("Profile updated successfully!");

  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Failed to update profile.");
  }
};
  return (
    <>
      <PageHeader
        title="My Profile"
        description="View your contractor profile."
      />

      <Card className="border-border/70 shadow-card">
        <CardHeader>
          <CardTitle>Contractor Details</CardTitle>
        </CardHeader>

        <CardContent>

          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <Label>Company</Label>
              <Input
  value={companyName}
  onChange={(e) => setCompanyName(e.target.value)}
/>
            </div>

            <div>
              <Label>Contact Person</Label>
              <Input
  value={contactPerson}
  onChange={(e) => setContactPerson(e.target.value)}
/>
            </div>

            <div>
              <Label>Email</Label>
           <Input
  value={contractor?.email || ""}
  readOnly
/>
            </div>

            <div>
              <Label>Phone</Label>
              <Input
  value={contractor?.mobile_number || ""}
  readOnly
/>
            </div>

            <div>
              <Label>Contractor Type</Label>
              <Input
  value={contractorType}
  onChange={(e) => setContractorType(e.target.value)}
/>
            </div>

            <div>
              <Label>Service Area</Label>
             <Input
  value={serviceArea}
  onChange={(e) => setServiceArea(e.target.value)}
/>
            </div>

            <div>
              <Label>Business License</Label>
             <Input
  value={businessLicense}
  onChange={(e) => setBusinessLicense(e.target.value)}
/>
            </div>

            <div>
              <Label>Years of Experience</Label>
             <Input
  value={experience}
  onChange={(e) => setExperience(e.target.value)}
/>
            </div>

            <div>
              <Label>Specialization</Label>
              <Input
  value={specialization}
  onChange={(e) => setSpecialization(e.target.value)}
/>
            </div>

            <div>
              <Label>Certification</Label>
              <Input
  value={certification}
  onChange={(e) => setCertification(e.target.value)}
/>
            </div>

            <div>
              <Label>Available Days</Label>
           <Input
  value={availableDays}
  onChange={(e) => setAvailableDays(e.target.value)}
/>
            </div>

            <div>
              <Label>Available Time</Label>
             <Input
  value={availableTime}
  onChange={(e) => setAvailableTime(e.target.value)}
/>
            </div>

            <div>
              <Label>Charge Type</Label>
          <Input
  value={chargeType}
  onChange={(e) => setChargeType(e.target.value)}
/>
            </div>

            <div>
              <Label>Hourly Rate</Label>
    <Input
  value={hourlyRate}
  onChange={(e) => setHourlyRate(e.target.value)}
/>
            
            </div>

            <div>
              <Label>Emergency Service</Label>
     <Input
  value={emergencyService ? "Yes" : "No"}
  onChange={(e) =>
    setEmergencyService(e.target.value.toLowerCase() === "yes")
  }
/>
            </div>

            <div>
              <Label>Status</Label>
              <Input value={contractor?.account_status || ""} readOnly />
            </div>

            <div className="sm:col-span-2">
              <Label>Description</Label>
             <Textarea
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
            </div>
            <div className="sm:col-span-2 mt-4">
  <button
    onClick={handleSave}
    className="rounded-md bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
  >
    Save Changes
  </button>
</div>

          </div>

        </CardContent>
      </Card>
    </>
  );
}