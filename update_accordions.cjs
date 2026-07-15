const fs = require('fs');

const path = 'src/routes/app.property.$id.tsx';
let content = fs.readFileSync(path, 'utf8');

const steps = [
  { value: 'basic', label: 'Basic Information', step: 1 },
  { value: 'location', label: 'Location Details', step: 2 },
  { value: 'media', label: 'Images & Media', step: 3 },
  { value: 'specifications', label: 'Property Specifications', step: 4 },
  { value: 'rent', label: 'Rent Details', step: 5 },
  { value: 'amenities', label: 'Amenities', step: 6 },
  { value: 'tenant_preferences', label: 'Tenant Preferences', step: 7 },
  { value: 'utility_info', label: 'Utility Information', step: 8 },
  { value: 'nearby_facilities', label: 'Nearby Facilities', step: 9 },
  { value: 'property_documents', label: 'Property Documents', step: 10 },
  { value: 'contact_details', label: 'Contact Details', step: 11 },
  { value: 'availability', label: 'Availability', step: 12 },
  { value: 'additional_information', label: 'Additional Information', step: 13 },
  { value: 'parking', label: 'Parking Details', step: 14 },
  { value: 'verification', label: 'Verification Status (Admin)', step: 15 },
];

for (const { value, label, step } of steps) {
  const regex = new RegExp(`(<AccordionItem value="${value}"[^>]*>[\\s\\S]*?<AccordionTrigger[^>]*>)([\\s\\S]*?)(</AccordionTrigger>)`, 'g');
  
  content = content.replace(regex, (match, p1, p2, p3) => {
    if (p2.includes('setEditStep')) return match;
    
    const newInner = `
                <div className="flex flex-1 items-center justify-between mr-4">
                  <div className="flex items-center w-full">${p2.trim()}</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); setEditStep(${step}); openEditDialog(); }}
                    className="h-8 text-xs border-violet-200 text-violet-700 hover:bg-violet-100 shrink-0 z-10"
                  >
                    <Pencil className="mr-1.5 h-3 w-3" /> Edit Details
                  </Button>
                </div>
              `;
    
    let newP1 = p1;
    if (!newP1.includes('group"')) {
      newP1 = newP1.replace('className="', 'className="group ');
    }

    return `${newP1}${newInner}${p3}`;
  });
}

fs.writeFileSync(path, content);
console.log('Done!');
