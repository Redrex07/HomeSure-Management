// Mock data for HomeSure Management prototype

export const properties = [
  { id: "P-1042", realtorId: "R-401", name: "Maplewood Apartments #3B", address: "412 Maple Ave, Austin TX", type: "Apartment", bedrooms: 2, bathrooms: 2, squareFootage: 1120, yearBuilt: 2016, units: 1, status: "Occupied", rent: 2150, tenant: "Sarah Chen", landlord: "Daniel Ortiz", image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600" },
  { id: "P-1043", realtorId: "R-401", name: "Oakridge Single Family", address: "88 Oak Ridge Rd, Denver CO", type: "House", bedrooms: 4, bathrooms: 3, squareFootage: 2140, yearBuilt: 2008, units: 1, status: "Occupied", rent: 3200, tenant: "Marcus Hill", landlord: "Daniel Ortiz", image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600" },
  { id: "P-1044", realtorId: "R-402", name: "Harbor View Loft 12", address: "12 Harbor St, Seattle WA", type: "Loft", bedrooms: 1, bathrooms: 1, squareFootage: 780, yearBuilt: 2020, units: 1, status: "Vacant", rent: 2800, tenant: null, landlord: "Priya Raman", image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600" },
  { id: "P-1045", realtorId: "R-402", name: "Sunset Villas #7", address: "7 Sunset Dr, San Diego CA", type: "Condo", bedrooms: 3, bathrooms: 2, squareFootage: 1480, yearBuilt: 2014, units: 1, status: "Maintenance", rent: 2450, tenant: "Elena Park", landlord: "Priya Raman", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600" },
  { id: "P-1046", realtorId: "R-403", name: "Birchwood Townhome", address: "204 Birch Ln, Portland OR", type: "Townhouse", bedrooms: 3, bathrooms: 2, squareFootage: 1680, yearBuilt: 2012, units: 1, status: "Occupied", rent: 2700, tenant: "Aaron Wu", landlord: "Linda Park", image: "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=600" },
  { id: "P-1047", realtorId: "R-403", name: "Cedar Heights #11", address: "11 Cedar Hts, Phoenix AZ", type: "Apartment", bedrooms: 2, bathrooms: 1, squareFootage: 960, yearBuilt: 2018, units: 1, status: "Listed", rent: 1950, tenant: null, landlord: "Linda Park", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600" },
];

export const tenants = [
  { id: "T-2201", name: "Sarah Chen", email: "sarah.chen@example.com", phone: "(512) 555-0142", property: "Maplewood Apartments #3B", leaseStart: "2024-03-01", leaseEnd: "2026-02-28", rent: 2150, status: "Active" },
  { id: "T-2202", name: "Marcus Hill", email: "marcus.h@example.com", phone: "(303) 555-0184", property: "Oakridge Single Family", leaseStart: "2023-09-15", leaseEnd: "2025-09-14", rent: 3200, status: "Active" },
  { id: "T-2203", name: "Elena Park", email: "elena.p@example.com", phone: "(619) 555-0173", property: "Sunset Villas #7", leaseStart: "2024-01-10", leaseEnd: "2025-12-31", rent: 2450, status: "Active" },
  { id: "T-2204", name: "Aaron Wu", email: "aaron.w@example.com", phone: "(503) 555-0119", property: "Birchwood Townhome", leaseStart: "2024-06-01", leaseEnd: "2026-05-31", rent: 2700, status: "Active" },
  { id: "T-2205", name: "Mia Thompson", email: "mia.t@example.com", phone: "(602) 555-0148", property: "Pending", leaseStart: "—", leaseEnd: "—", rent: 0, status: "Onboarding" },
];

export const contractors = [
  { id: "C-301", contractorId: "C-301", contractorName: "BlueLine Plumbing", companyName: "BlueLine Plumbing", trade: "Plumbing", specialization: "Plumbing", rating: 4.8, jobs: 142, available: true, availabilityStatus: "Available", email: "ops@blueline.co", phone: "(512) 555-2001" },
  { id: "C-302", contractorId: "C-302", contractorName: "Spark Electric Co.", companyName: "Spark Electric Co.", trade: "Electrical", specialization: "Electrical", rating: 4.9, jobs: 98, available: true, availabilityStatus: "Available", email: "hello@sparkelectric.co", phone: "(303) 555-2014" },
  { id: "C-303", contractorId: "C-303", contractorName: "Cool Air HVAC", companyName: "Cool Air HVAC", trade: "HVAC", specialization: "HVAC", rating: 4.6, jobs: 211, available: false, availabilityStatus: "Busy", email: "dispatch@coolairhvac.co", phone: "(619) 555-2089" },
  { id: "C-304", contractorId: "C-304", contractorName: "GreenLeaf Landscaping", companyName: "GreenLeaf Landscaping", trade: "Landscaping", specialization: "Landscaping", rating: 4.7, jobs: 76, available: true, availabilityStatus: "Available", email: "team@greenleaflandscaping.co", phone: "(503) 555-2155" },
  { id: "C-305", contractorId: "C-305", contractorName: "ProPaint Studios", companyName: "ProPaint Studios", trade: "Painting", specialization: "Painting", rating: 4.5, jobs: 54, available: true, availabilityStatus: "Available", email: "info@propaintstudios.co", phone: "(602) 555-2210" },
  { id: "C-306", contractorId: "C-306", contractorName: "Lock & Key Pros", companyName: "Lock & Key Pros", trade: "Locksmith", specialization: "Locksmith", rating: 4.9, jobs: 33, available: true, availabilityStatus: "Available", email: "service@lockandkeypros.co", phone: "(206) 555-2300" },
];

export const realtors = [
  { id: "R-401", realtorId: "R-401", realtorName: "Linda Park", email: "linda.p@homesure.app", phone: "(415) 555-3101", agencyName: "Park & Co." },
  { id: "R-402", realtorId: "R-402", realtorName: "Ariana Cole", email: "ariana.c@homesure.app", phone: "(206) 555-3102", agencyName: "Harbor Street Realty" },
  { id: "R-403", realtorId: "R-403", realtorName: "Noah Bennett", email: "noah.b@homesure.app", phone: "(503) 555-3103", agencyName: "Summit Listing Group" },
];

export const serviceRequests = [
  { id: "SR-9001", serviceRequestId: "SR-9001", propertyId: "P-1042", tenantId: "T-2201", contractorId: "C-301", title: "Leaking kitchen faucet", property: "Maplewood Apartments #3B", tenant: "Sarah Chen", category: "Plumbing", priority: "Medium", status: "Assigned", contractor: "BlueLine Plumbing", created: "2026-05-28", eta: "2026-06-02" },
  { id: "SR-9002", serviceRequestId: "SR-9002", propertyId: "P-1045", tenantId: "T-2203", contractorId: "C-303", title: "AC not cooling", property: "Sunset Villas #7", tenant: "Elena Park", category: "HVAC", priority: "High", status: "In Progress", contractor: "Cool Air HVAC", created: "2026-05-30", eta: "2026-06-01" },
  { id: "SR-9003", serviceRequestId: "SR-9003", propertyId: "P-1043", tenantId: "T-2202", contractorId: "C-302", title: "Bedroom outlet sparks", property: "Oakridge Single Family", tenant: "Marcus Hill", category: "Electrical", priority: "Urgent", status: "Pending", contractor: null, created: "2026-05-31", eta: "—" },
  { id: "SR-9004", serviceRequestId: "SR-9004", propertyId: "P-1046", tenantId: "T-2204", contractorId: "C-304", title: "Front lawn overgrown", property: "Birchwood Townhome", tenant: "Aaron Wu", category: "Landscaping", priority: "Low", status: "Completed", contractor: "GreenLeaf Landscaping", created: "2026-05-22", eta: "2026-05-26" },
  { id: "SR-9005", serviceRequestId: "SR-9005", propertyId: "P-1044", tenantId: null, contractorId: "C-305", title: "Repaint hallway", property: "Harbor View Loft 12", tenant: "—", category: "Painting", priority: "Low", status: "Pending", contractor: null, created: "2026-05-29", eta: "—" },
  { id: "SR-9006", serviceRequestId: "SR-9006", propertyId: "P-1047", tenantId: null, contractorId: "C-306", title: "Replace front door lock", property: "Cedar Heights #11", tenant: "—", category: "Locksmith", priority: "Medium", status: "Assigned", contractor: "Lock & Key Pros", created: "2026-05-30", eta: "2026-06-03" },
  { id: "SR-9007", serviceRequestId: "SR-9007", propertyId: "P-1042", tenantId: "T-2201", contractorId: "C-301", title: "Dishwasher not draining", property: "Maplewood Apartments #3B", tenant: "Sarah Chen", category: "Appliance", priority: "Medium", status: "Completed", contractor: "BlueLine Plumbing", created: "2026-05-18", eta: "2026-05-21" },
];

export const appointments = [
  { id: "A-501", appointmentId: "A-501", serviceRequestId: "SR-9002", propertyId: "P-1045", contractorId: "C-303", title: "AC repair visit", date: "2026-06-01", time: "10:00 AM", property: "Sunset Villas #7", contractor: "Cool Air HVAC", status: "Scheduled" },
  { id: "A-502", appointmentId: "A-502", serviceRequestId: "SR-9001", propertyId: "P-1042", contractorId: "C-301", title: "Plumbing inspection", date: "2026-06-02", time: "2:00 PM", property: "Maplewood Apartments #3B", contractor: "BlueLine Plumbing", status: "Scheduled" },
  { id: "A-503", appointmentId: "A-503", serviceRequestId: "SR-9006", propertyId: "P-1047", contractorId: "C-306", title: "Lock replacement", date: "2026-06-03", time: "11:30 AM", property: "Cedar Heights #11", contractor: "Lock & Key Pros", status: "Scheduled" },
  { id: "A-504", appointmentId: "A-504", serviceRequestId: null, propertyId: "P-1044", contractorId: null, title: "Property walkthrough", date: "2026-06-04", time: "9:00 AM", property: "Harbor View Loft 12", contractor: "—", status: "Pending" },
];

export const estimates = [
  { id: "E-7001", estimateId: "E-7001", serviceRequestId: "SR-9002", contractorId: "C-303", request: "SR-9002", contractor: "Cool Air HVAC", amount: 685, status: "Approved", submitted: "2026-05-30", estimatedCost: 685, description: "Replace compressor and recharge system" },
  { id: "E-7002", estimateId: "E-7002", serviceRequestId: "SR-9003", contractorId: "C-302", request: "SR-9003", contractor: "Spark Electric Co.", amount: 240, status: "Pending", submitted: "2026-05-31", estimatedCost: 240, description: "Replace outlet and inspect circuit" },
  { id: "E-7003", estimateId: "E-7003", serviceRequestId: "SR-9005", contractorId: "C-305", request: "SR-9005", contractor: "ProPaint Studios", amount: 1450, status: "Pending", submitted: "2026-05-31", estimatedCost: 1450, description: "Prime and repaint hallway" },
  { id: "E-7004", estimateId: "E-7004", serviceRequestId: "SR-9006", contractorId: "C-306", request: "SR-9006", contractor: "Lock & Key Pros", amount: 175, status: "Approved", submitted: "2026-05-30", estimatedCost: 175, description: "Replace deadbolt and rekey" },
];

export const invoices = [
  { id: "INV-4501", invoiceId: "INV-4501", serviceRequestId: "SR-9001", contractorId: "C-301", request: "SR-9001", amount: 320, status: "Paid", issued: "2026-05-29", due: "2026-06-12" },
  { id: "INV-4502", invoiceId: "INV-4502", serviceRequestId: "SR-9004", contractorId: "C-304", request: "SR-9004", amount: 180, status: "Paid", issued: "2026-05-27", due: "2026-06-10" },
  { id: "INV-4503", invoiceId: "INV-4503", serviceRequestId: "SR-9007", contractorId: "C-301", request: "SR-9007", amount: 415, status: "Overdue", issued: "2026-05-20", due: "2026-05-30" },
  { id: "INV-4504", invoiceId: "INV-4504", serviceRequestId: "SR-9002", contractorId: "C-303", request: "SR-9002", amount: 685, status: "Pending", issued: "2026-06-01", due: "2026-06-15" },
];

export const tickets = [
  { id: "TK-110", subject: "Cannot upload lease PDF", user: "Daniel Ortiz", role: "Landlord", priority: "Medium", status: "Open", created: "2026-05-30" },
  { id: "TK-111", subject: "Payment not reflecting", user: "Sarah Chen", role: "Tenant", priority: "High", status: "In Progress", created: "2026-05-31" },
  { id: "TK-112", subject: "Add tax ID to invoice", user: "BlueLine Plumbing", role: "Contractor", priority: "Low", status: "Resolved", created: "2026-05-26" },
  { id: "TK-113", subject: "Listing photos not saving", user: "Linda Park", role: "Realtor", priority: "Medium", status: "Open", created: "2026-05-31" },
];

export const users = [
  { id: "U-001", name: "Daniel Ortiz", email: "daniel.o@homesure.app", role: "Landlord", status: "Active", joined: "2024-01-15" },
  { id: "U-002", name: "Priya Raman", email: "priya.r@homesure.app", role: "Landlord", status: "Active", joined: "2024-02-04" },
  { id: "U-003", name: "Sarah Chen", email: "sarah.c@homesure.app", role: "Tenant", status: "Active", joined: "2024-03-01" },
  { id: "U-004", name: "BlueLine Plumbing", email: "ops@blueline.co", role: "Contractor", status: "Active", joined: "2023-11-12" },
  { id: "U-005", name: "Linda Park", email: "linda.p@homesure.app", role: "Realtor", status: "Active", joined: "2024-04-22" },
  { id: "U-006", name: "Jordan Reyes", email: "jordan.r@homesure.app", role: "Service Admin", status: "Active", joined: "2023-08-09" },
  { id: "U-007", name: "Mia Thompson", email: "mia.t@homesure.app", role: "Tenant", status: "Invited", joined: "2026-05-28" },
];

export const subscriptions = [
  { id: "SUB-9001", customer: "Daniel Ortiz", plan: "Pro", seats: 12, mrr: 149, status: "Active", renews: "2026-07-01" },
  { id: "SUB-9002", customer: "Priya Raman", plan: "Starter", seats: 4, mrr: 49, status: "Active", renews: "2026-06-18" },
  { id: "SUB-9003", customer: "Linda Park", plan: "Pro", seats: 8, mrr: 149, status: "Trial", renews: "2026-06-09" },
  { id: "SUB-9004", customer: "Westside Realty", plan: "Enterprise", seats: 45, mrr: 599, status: "Active", renews: "2026-08-12" },
  { id: "SUB-9005", customer: "Harbor Holdings", plan: "Pro", seats: 22, mrr: 149, status: "Past Due", renews: "2026-05-28" },
];

export const auditLogs = [
  { id: "L-001", time: "2026-06-01 09:22", actor: "jordan.r@homesure.app", action: "Assigned SR-9001 to BlueLine Plumbing", ip: "73.41.18.2" },
  { id: "L-002", time: "2026-06-01 08:51", actor: "daniel.o@homesure.app", action: "Updated rent on P-1042", ip: "98.221.4.10" },
  { id: "L-003", time: "2026-05-31 21:14", actor: "sarah.c@homesure.app", action: "Paid invoice INV-4501", ip: "184.22.8.55" },
  { id: "L-004", time: "2026-05-31 17:02", actor: "admin@homesure.app", action: "Suspended user U-099", ip: "10.0.4.7" },
  { id: "L-005", time: "2026-05-31 13:38", actor: "linda.p@homesure.app", action: "Published listing P-1047", ip: "67.88.91.4" },
];

export const notifications = [
  { id: "N-1", title: "New service request", body: "Marcus Hill opened SR-9003 — Bedroom outlet sparks", time: "12m ago", read: false, type: "service" },
  { id: "N-2", title: "Invoice paid", body: "INV-4501 was paid by Sarah Chen ($320)", time: "1h ago", read: false, type: "billing" },
  { id: "N-3", title: "Estimate approved", body: "Cool Air HVAC estimate approved for $685", time: "3h ago", read: true, type: "service" },
  { id: "N-4", title: "Lease renewal due", body: "Marcus Hill lease ends in 90 days", time: "Yesterday", read: true, type: "lease" },
  { id: "N-5", title: "New tenant onboarding", body: "Mia Thompson invited to Cedar Heights #11", time: "2d ago", read: true, type: "tenant" },
];

export const revenueSeries = [
  { month: "Jan", revenue: 48200, expenses: 18400 },
  { month: "Feb", revenue: 51100, expenses: 19200 },
  { month: "Mar", revenue: 55800, expenses: 20100 },
  { month: "Apr", revenue: 59400, expenses: 21500 },
  { month: "May", revenue: 64200, expenses: 22800 },
  { month: "Jun", revenue: 71900, expenses: 24100 },
];

export const requestsSeries = [
  { day: "Mon", created: 12, completed: 9 },
  { day: "Tue", created: 18, completed: 14 },
  { day: "Wed", created: 15, completed: 16 },
  { day: "Thu", created: 22, completed: 17 },
  { day: "Fri", created: 19, completed: 21 },
  { day: "Sat", created: 8, completed: 11 },
  { day: "Sun", created: 5, completed: 6 },
];

export const categoryBreakdown = [
  { name: "Plumbing", value: 32 },
  { name: "Electrical", value: 21 },
  { name: "HVAC", value: 26 },
  { name: "Landscaping", value: 12 },
  { name: "Painting", value: 9 },
];

export const listings = [
  { id: "L-1001", listingId: "L-1001", propertyId: "P-1044", realtorId: "R-402", name: "Harbor View Loft 12", price: 2800, status: "Active", views: 1248, leads: 27, days: 9, listingType: "Sale", listingStatus: "Active", listingDate: "2026-05-18" },
  { id: "L-1002", listingId: "L-1002", propertyId: "P-1047", realtorId: "R-403", name: "Cedar Heights #11", price: 1950, status: "Active", views: 642, leads: 11, days: 4, listingType: "Rent", listingStatus: "Active", listingDate: "2026-05-24" },
  { id: "L-1003", listingId: "L-1003", propertyId: "P-1051", realtorId: "R-403", name: "Ridgeline Studio", price: 1650, status: "Draft", views: 0, leads: 0, days: 0, listingType: "Sale", listingStatus: "Draft", listingDate: "2026-06-01" },
  { id: "L-1004", listingId: "L-1004", propertyId: "P-1052", realtorId: "R-402", name: "Riverside 2BR", price: 2450, status: "Pending", views: 318, leads: 6, days: 2, listingType: "Rent", listingStatus: "Pending", listingDate: "2026-06-03" },
];

export const propertyReadiness = [
  { readinessId: "PR-2001", propertyId: "P-1044", realtorId: "R-402", status: "Ready", notes: "Photos complete and pricing approved", completionDate: "2026-05-18" },
  { readinessId: "PR-2002", propertyId: "P-1047", realtorId: "R-403", status: "In Review", notes: "Staging and disclosure packet pending", completionDate: "2026-05-24" },
  { readinessId: "PR-2003", propertyId: "P-1051", realtorId: "R-403", status: "Draft", notes: "Awaiting contractor walkthrough", completionDate: "2026-06-01" },
  { readinessId: "PR-2004", propertyId: "P-1052", realtorId: "R-402", status: "Ready", notes: "Listing copy approved", completionDate: "2026-06-03" },
];

export const tenantOnboarding = [
  { onboardingId: "TO-3001", tenantId: "T-2205", realtorId: "R-403", propertyId: "P-1047", status: "In Progress", onboardingStatus: "In Progress", onboardingDate: "2026-05-28" },
  { onboardingId: "TO-3002", tenantId: "T-2201", realtorId: "R-401", propertyId: "P-1042", status: "Complete", onboardingStatus: "Complete", onboardingDate: "2024-03-01" },
  { onboardingId: "TO-3003", tenantId: "T-2203", realtorId: "R-402", propertyId: "P-1045", status: "Complete", onboardingStatus: "Complete", onboardingDate: "2024-01-10" },
];

export const completionReports = [
  { reportId: "CR-4001", serviceRequestId: "SR-9004", contractorId: "C-304", completionNotes: "Trimmed and reseeded lawn", completionDate: "2026-05-26" },
  { reportId: "CR-4002", serviceRequestId: "SR-9007", contractorId: "C-301", completionNotes: "Replaced hose and cleared drain", completionDate: "2026-05-21" },
];

export const leaseDocs = [
  { id: "DOC-1", name: "Lease Agreement 2024", size: "412 KB", updated: "2024-03-01" },
  { id: "DOC-2", name: "Move-in Inspection", size: "1.1 MB", updated: "2024-03-03" },
  { id: "DOC-3", name: "Pet Addendum", size: "98 KB", updated: "2024-03-05" },
  { id: "DOC-4", name: "Renter's Insurance", size: "220 KB", updated: "2024-04-12" },
];
