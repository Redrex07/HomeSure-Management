const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:/Users/suman/.gemini/antigravity/brain/23649e92-4357-42a2-be2d-0a89539633ec/.system_generated/logs/transcript.jsonl';

async function search() {
  console.log("Searching conversation logs...");
  
  if (!fs.existsSync(logPath)) {
    console.log("❌ Log file does not exist at:", logPath);
    return;
  }
  
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  let matchCount = 0;
  
  for await (const line of rl) {
    lineCount++;
    if (line.includes('service_request_management')) {
      matchCount++;
      console.log(`\nMatch #${matchCount} on line ${lineCount}:`);
      
      // Parse the JSON line to extract context
      try {
        const obj = JSON.parse(line);
        console.log(`Source: ${obj.source}, Type: ${obj.type}`);
        
        // Print snippet of content or tool calls
        if (obj.tool_calls) {
          console.log(`Tool Calls:`, JSON.stringify(obj.tool_calls, null, 2).slice(0, 1000));
        }
        
        if (obj.content) {
          const contentStr = String(obj.content);
          // Find occurrences of service_request_management and print surrounding text
          const index = contentStr.indexOf('service_request_management');
          console.log(`Content Snippet: ... ${contentStr.slice(Math.max(0, index - 200), index + 1000)} ...`);
        }
      } catch (e) {
        console.log(`Failed to parse JSON, raw text slice:`, line.slice(0, 500));
      }
    }
  }
  
  console.log(`\nDone. Checked ${lineCount} lines, found ${matchCount} matches.`);
}

search();
