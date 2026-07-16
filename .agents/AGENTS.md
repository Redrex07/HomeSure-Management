# Properties Code Modification Rule

**CRITICAL RULE FOR ALL AI AGENTS:**

The files related to the Properties feature, specifically:
- `src/routes/app.properties.tsx`
- `src/routes/app.property.$id.tsx`

are highly restricted. **DO NOT modify these files.** 

If the user requests a change that requires modifying these files, you MUST:
1. STOP before making any edits.
2. Alert the user that they are requesting a change to restricted properties files.
3. Explicitly ask for their permission to modify these files.
4. Only proceed with the edit IF they explicitly grant you permission in their response.
