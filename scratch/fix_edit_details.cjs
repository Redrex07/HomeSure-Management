const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../src/routes/app.property.$id.tsx");
let code = fs.readFileSync(filePath, "utf8");

// 1. Role flags
code = code.replace(
  '  const isTenant = session?.role === "tenant";',
  `  const roleStr = String(session?.role || "").toLowerCase();
  const isTenant = roleStr.includes("tenant");
  const isLandlord = roleStr.includes("landlord");
  const canManageProperties = isLandlord;`
);

// 2. Wrap all Edit Details button occurrences
const lines = code.split("\n");
const newLines = [];
let replaced = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<Pencil className="mr-1.5 h-3 w-3" /> Edit Details')) {
    // Find the opening <Button for this block (go back a few lines)
    let openIdx = newLines.length - 1;
    while (openIdx >= 0 && !newLines[openIdx].includes("<Button")) {
      openIdx--;
    }
    if (openIdx >= 0) {
      newLines.splice(openIdx, 0, "                  {canManageProperties && (");
      newLines.push(line);
      // Wait for closing </Button>
      i++;
      while (i < lines.length && !lines[i].includes("</Button>")) {
        newLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        newLines.push(lines[i]);
        newLines.push("                  )}");
        replaced++;
      }
      continue;
    }
  }
  newLines.push(line);
}

code = newLines.join("\n");
console.log(`Replaced ${replaced} Edit Details buttons.`);

// 3. Wrap Edit Property Dialog
code = code.replace(
  "{/* Edit Property Dialog */}\n        <Dialog open={isEditing}",
  "{/* Edit Property Dialog */}\n        {canManageProperties && (\n        <Dialog open={isEditing}"
);

code = code.replace(
  "</Dialog>\n\n        {/* Details Accordions */}",
  "</Dialog>\n        )}\n\n        {/* Details Accordions */}"
);

fs.writeFileSync(filePath, code);
console.log("Updated app.property.$id.tsx successfully!");
