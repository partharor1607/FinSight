import fs from "fs";
import csv from "csv-parser";

class FileParser {
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error("CSV file not found"));
      }

      // First, try to detect if it's a text-to-CSV (fixed-width or space-delimited) format
      const fileContent = fs.readFileSync(filePath, "utf8");
      const lines = fileContent.split("\n").filter(l => l.trim().length > 0);
      
      if (lines.length === 0) {
        return reject(new Error("File is empty"));
      }

      // Check if it looks like fixed-width/space-delimited (text-to-CSV)
      const firstLine = lines[0];
      const hasMultipleSpaces = (firstLine.match(/\s{2,}/g) || []).length > 2;
      const hasFewCommas = (firstLine.match(/,/g) || []).length < 3;
      
      // If it has multiple spaces and few commas, it's likely text-to-CSV format
      if (hasMultipleSpaces && hasFewCommas) {
        console.log("Detected text-to-CSV format (fixed-width/space-delimited)");
        return this.parseTextToCSV(filePath, resolve, reject);
      }

      // Otherwise, use standard CSV parser
      const rawRows = [];

      fs.createReadStream(filePath, { encoding: "utf8" })
        .pipe(
          csv({
          skipEmptyLines: true,
            separator: ",", // Try comma first
            mapHeaders: ({ header }) =>
              header
                .replace(/\.+/g, "")  // Remove dots from headers only (e.g., "DepositAmt." -> "DepositAmt")
                .replace(/\s+/g, " ")
                .trim(),
            // Don't modify values - keep decimal points in numbers!
            mapValues: ({ value }) => value ? String(value).trim() : ""
          })
        )
        .on("data", row => {
          const cleanRow = {};
          Object.keys(row).forEach(key => {
            cleanRow[key.trim()] = String(row[key]).trim();
          });
          rawRows.push(cleanRow);
        })
        .on("end", () => {
          if (rawRows.length === 0) {
            // Try text-to-CSV as fallback
            console.log("Standard CSV parsing failed, trying text-to-CSV format...");
            return this.parseTextToCSV(filePath, resolve, reject);
          }

          // Debug: log first row to see what columns we have
          if (rawRows.length > 0) {
            console.log("First parsed row columns:", Object.keys(rawRows[0]));
            console.log("First parsed row sample:", rawRows[0]);
          }

          const transactions = this.normalizeCSV(rawRows);
          if (transactions.length === 0) {
            const sampleRow = rawRows[0] || {};
            return reject(
              new Error(
                "CSV parsed but no valid transactions detected.\n" +
                "This usually means the bank format is unusual.\n" +
                `Found columns: ${Object.keys(sampleRow).join(", ")}\n` +
                `Sample row: ${JSON.stringify(sampleRow, null, 2)}`
              )
            );
          }
          console.log(`Successfully parsed ${transactions.length} transactions`);
          resolve(transactions);
        })
        .on("error", err => {
          // Try text-to-CSV as fallback
          console.log("CSV parse error, trying text-to-CSV format:", err.message);
          return this.parseTextToCSV(filePath, resolve, reject);
        });
    });
  }

  // Parse TXT file (fixed-width or space-delimited format)
  async parseTXT(filePath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error("TXT file not found"));
      }
      this.parseTextToCSV(filePath, resolve, reject);
    });
  }

  // Parse text-to-CSV format (fixed-width or space-delimited)
  // Improved based on reference parser from bank statement parsing folder
  parseTextToCSV(filePath, resolve, reject) {
    try {
      // Handle different line endings
      const fileContent = fs.readFileSync(filePath, "utf8");
      const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        return reject(new Error("File appears to be empty or invalid format. Need at least header and one data row."));
      }

      // Skip header line
      const headerLine = lines[0].trim();
      const dataLines = lines.slice(1);
      
      // Parse CSV-like format (comma-separated with potential spaces)
      // Handle the format: Date, Narration (long), Value Date, Debit, Credit, Chq/Ref, Balance
      let headerParts = headerLine.split(',').map(p => p.trim());
      
      // Remove empty parts at the beginning (from leading spaces before first column)
      while (headerParts.length > 0 && headerParts[0] === '') {
        headerParts = headerParts.slice(1);
      }
      
      // Filter out empty header parts
      headerParts = headerParts.filter(p => p.length > 0);
      
      console.log("Header parts (comma-separated):", headerParts);
      console.log("Header parts count:", headerParts.length);
      
      if (headerParts.length < 3) {
        return reject(
          new Error(
            `Invalid header format. Expected at least 3 columns, found ${headerParts.length}.\n` +
            `Header line: ${headerLine}\n` +
            `Please ensure the file is comma-separated with columns like: Date, Narration, Value Date, Debit Amount, Credit Amount, etc.`
          )
        );
      }

      // Parse data rows with improved error handling
      const rawRows = [];
      
      for (let i = 0; i < dataLines.length; i++) {
        let line = dataLines[i];
        if (!line.trim()) continue;
        
        // Trim the entire line first to remove leading/trailing whitespace
        line = line.trim();
        
        try {
          // Parse CSV-like format (comma-separated with potential spaces)
          let parts = line.split(',').map(p => p.trim());
          
          // Remove empty parts at the beginning (from leading spaces before first column)
          while (parts.length > 0 && parts[0] === '') {
            parts = parts.slice(1);
          }
          
          // Basic validation - should have at least date and some data
          if (parts.length < headerParts.length - 2) {
            // Allow some flexibility - at least need date and narration
            if (parts.length < 2) {
              console.warn(`Line ${i + 2}: Too few columns (${parts.length}), skipping.`);
              continue;
            }
          }
          
          // Build row object from parts
          const row = {};
          headerParts.forEach((headerName, idx) => {
            if (parts[idx] !== undefined) {
              row[headerName] = parts[idx];
            }
          });
          
          // Validate that we have at least a date (basic validation - should be DD/MM/YY format)
          const dateValue = row[headerParts[0]] || parts[0] || '';
          if (!dateValue || dateValue.length < 5 || !dateValue.includes('/')) {
            console.warn(`Line ${i + 2}: Invalid or missing date: "${dateValue}". Skipping.`);
            continue;
          }
          
          // Only add row if it has some meaningful data
          if (Object.values(row).some(v => v && String(v).trim().length > 0)) {
            rawRows.push(row);
          }
        } catch (error) {
          console.warn(`Error parsing line ${i + 2}: ${error.message}`);
          continue;
        }
      }

      if (rawRows.length === 0) {
        return reject(
          new Error(
            "No valid transactions found in the file. Please check:\n" +
            "1. The file format matches: Date, Narration, Value Date, Debit Amount, Credit Amount, Chq/Ref Number, Closing Balance\n" +
            "2. The file is comma-separated\n" +
            "3. There is at least one data row after the header\n" +
            "4. Dates are in DD/MM/YY format"
          )
        );
      }

      console.log(`Successfully parsed ${rawRows.length} rows from text-to-CSV format`);
      const transactions = this.normalizeCSV(rawRows);
      
      if (transactions.length === 0) {
        return reject(
          new Error(
            "Text-to-CSV parsed but no valid transactions detected.\n" +
            "Please check the file format and ensure amounts are present."
          )
        );
      }

      console.log(`Successfully normalized ${transactions.length} transactions`);
      resolve(transactions);
    } catch (error) {
      reject(new Error(`Text-to-CSV parse error: ${error.message}`));
    }
  }

  // 🔥 Normalize dirty bank CSV into clean transactions
  normalizeCSV(rows) {
    const transactions = [];
    let skippedCount = 0;
    const skipReasons = {};
    
    for (const row of rows) {
      // ---------- DATE ----------
      const dateKey = Object.keys(row).find(k => k.toLowerCase().includes("date"));
      const dateStr = dateKey ? row[dateKey] : 
                     row.Date || 
                     row["Transaction Date"] || 
                     row["Value Dat"] || 
                     row["ValueDt"] ||
                     null;

      // ---------- DESCRIPTION ----------
      const descKey = Object.keys(row).find(k =>
        ["narration", "description", "particulars", "memo"].some(x =>
          k.toLowerCase().includes(x)
        )
      );
      const description = descKey ? row[descKey] :
                         row.Narration ||
                         row.Description ||
                         row.Particulars ||
                         row.Memo ||
                         null;

      // ---------- AMOUNT ----------
      // Find credit/deposit columns (mapHeaders removes dots, so "DepositAmt." becomes "DepositAmt")
      const creditKey = Object.keys(row).find(k => {
        const keyLower = k.toLowerCase().trim().replace(/\./g, "");
        return keyLower.includes("deposit") || 
               keyLower.includes("credit") ||
               keyLower === "depositamt";
      });
      let credit = creditKey ? row[creditKey] : null;
      
      // Fallback to direct matches (with and without dots)
      if (!credit) {
        credit = row["Credit Amount"] || 
                 row.Credit || 
                 row["DepositAmt."] || 
                 row.DepositAmt || 
                 row["Deposit Amt"] || 
                 row.Deposit || null;
      }

      // Find debit/withdrawal columns (mapHeaders removes dots, so "WithdrawalAmt." becomes "WithdrawalAmt")
      const debitKey = Object.keys(row).find(k => {
        const keyLower = k.toLowerCase().trim().replace(/\./g, "");
        return keyLower.includes("withdrawal") || 
               keyLower.includes("withdraw") ||
               keyLower.includes("debit") ||
               keyLower === "withdrawalamt";
      });
      let debit = debitKey ? row[debitKey] : null;
      
      // Fallback to direct matches (with and without dots)
      if (!debit) {
        debit = row["Debit Amount"] || 
                row.Debit || 
                row["WithdrawalAmt."] || 
                row.WithdrawalAmt || 
                row["Withdrawal Amt"] || 
                row.Withdrawal || null;
      }

      // Skip if missing required fields
      if (!dateStr || !description || (!credit && !debit)) {
        skippedCount++;
        const reason = !dateStr ? 'missing_date' : !description ? 'missing_description' : 'missing_amount';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
        continue;
      }

      const date = this.parseDate(dateStr);
      if (isNaN(date.getTime())) {
        skippedCount++;
        skipReasons['invalid_date'] = (skipReasons['invalid_date'] || 0) + 1;
        continue;
      }

      let amount = 0;
      let type = "expense";

      // Clean and parse amounts (handle empty strings, commas, and various formats)
      // Improved based on reference parser - remove commas and spaces more robustly
      const parseAmount = (val) => {
        if (!val || val === '' || val === null || val === undefined) return 0;
        // Remove commas, spaces, and parse - more robust cleaning
        const cleaned = String(val).trim().replace(/[,\s]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : Math.abs(parsed);
      };

      const creditValue = parseAmount(credit);
      const debitValue = parseAmount(debit);

      // 🧠 Indian bank logic: credit = income, debit = expense
      if (creditValue > 0) {
        amount = creditValue;
        type = "income";
      } else if (debitValue > 0) {
        amount = debitValue;
        type = "expense";
      } else {
        // Skip if both are zero or empty
        continue;
      }

      // Final validation
      if (!amount || amount === 0 || isNaN(amount)) {
        skippedCount++;
        skipReasons['invalid_amount'] = (skipReasons['invalid_amount'] || 0) + 1;
        continue;
      }
          
      transactions.push({
        date,
        description: description.trim(),
        amount: Math.abs(amount),
        type
      });
    }
    
    // Log summary if rows were skipped
    if (skippedCount > 0) {
      console.log(`Skipped ${skippedCount} rows:`, skipReasons);
    }
    
    return transactions;
  }

  // 🧠 Date parser (Indian format safe - DD/MM/YYYY or DD/MM/YY)
  // Improved validation based on reference parser
  parseDate(str) {
    if (!str || typeof str !== 'string') {
      return new Date("invalid");
    }

    const cleaned = str.trim();
    
    // Try DD/MM/YYYY or DD/MM/YY format first (Indian format)
    // More strict matching - must have at least DD/MM/YY
    const indianFormat = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (indianFormat) {
      let [, d, m, y] = indianFormat;
      d = parseInt(d, 10);
      m = parseInt(m, 10);
      // Convert 2-digit year to 4-digit (assuming 20xx)
      if (y.length === 2) {
        y = '20' + y;
      }
      y = parseInt(y, 10);
      
      // Validate date components (more strict validation)
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        const date = new Date(y, m - 1, d);
        // Verify the date is valid (handles invalid dates like 31/02/2025)
        if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
          return date;
        }
      }
    }

    // Try ISO format (YYYY-MM-DD)
    const isoFormat = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (isoFormat) {
      let [, y, m, d] = isoFormat;
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Fallback to native Date parsing
    const fallback = new Date(cleaned);
    return isNaN(fallback.getTime()) ? new Date("invalid") : fallback;
  }
}

export default new FileParser();
