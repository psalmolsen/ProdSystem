/**
 * ProdSystem - Google Apps Script Backend (Per-Department Tabs Architecture)
 * 
 * Tabs:
 * 1. JobOrders
 * 2. CTC1
 * 3. CTC2
 * 4. Hotworks
 * 5. Painting
 * 6. Cosmetics
 * 
 * Run setupSpreadsheet() once inside Apps Script to auto-create all tabs & headers!
 */

var STATION_CONFIGS = {
  CTC1: ["Sorting/Cleaning Valve", "Devalving", "Valve Test", "Shotblasting"],
  CTC2: ["Hydro Test", "Soap Suds Test", "Revalve", "Leak Test"],
  Hotworks: ["Plasma Cutting", "Nameplate Cutting", "Grinding", "Cleaning", "Nameplate Welding", "Tack Weld CF", "Full Weld"],
  Painting: ["Primer", "Putty", "Sanding", "Top Coat"],
  Cosmetics: ["Tacking/Weighing", "Brand Label", "TW/Warning/RQ", "Final QC", "Good"]
};

function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : "";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "getJobOrders") {
      var sheet = getOrCreateSheet(ss, "JobOrders", ["id", "work_order_number", "brand_name", "status", "created_at"]);
      return responseSuccess(getRowsAsObjects(sheet));
    }

    if (action === "getEntries") {
      var targetJobOrderId = e && e.parameter ? e.parameter.jobOrderId : null;
      var jobOrderMap = getJobOrderLookupMap(ss);
      var allEntries = [];

      Object.keys(STATION_CONFIGS).forEach(function(stationId) {
        var subProcesses = STATION_CONFIGS[stationId];
        var headers = ["id", "entry_date", "time_slot", "work_order_number", "personnel_name"].concat(subProcesses).concat(["logged_at"]);
        var sheet = getOrCreateSheet(ss, stationId, headers);
        var rows = getRowsAsObjects(sheet);

        rows.forEach(function(row) {
          var woNum = String(row.work_order_number || row["Work Order #"] || "").trim();
          var joId = jobOrderMap[woNum] || row.job_order_id || woNum;
          if (targetJobOrderId && String(joId) !== String(targetJobOrderId)) return;

          subProcesses.forEach(function(sp) {
            var val = Number(row[sp] || 0);
            if (val > 0) {
              allEntries.push({
                id: String(row.id || "") + "_" + sp,
                jobOrderId: joId,
                station: stationId,
                subProcess: sp,
                personnelName: String(row.personnel_name || row["Personnel"] || ""),
                good: val,
                output: val,
                timeSlot: String(row.time_slot || row["Time Slot"] || "6am–8am"),
                entryDate: String(row.entry_date || row["Date"] || ""),
                loggedAt: String(row.logged_at || row["Logged At"] || new Date().toISOString())
              });
            }
          });
        });
      });

      return responseSuccess(allEntries);
    }

    return responseError("Invalid GET action parameter: " + action);
  } catch (err) {
    return responseError(err.toString());
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var payload = postData.payload;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "createJobOrder") {
      var sheet = getOrCreateSheet(ss, "JobOrders", ["id", "work_order_number", "brand_name", "status", "created_at"]);
      sheet.appendRow([
        payload.id || "",
        payload.workOrderNumber || payload.work_order_number || "",
        payload.brandName || payload.brand_name || "",
        "Active",
        payload.createdAt || payload.created_at || new Date().toISOString()
      ]);
      return responseSuccess(payload);
    }

    if (action === "createEntry") {
      var stationId = payload.station;
      var subProcesses = STATION_CONFIGS[stationId];
      if (!subProcesses) return responseError("Unknown station: " + stationId);

      var headers = ["id", "entry_date", "time_slot", "work_order_number", "personnel_name"].concat(subProcesses).concat(["logged_at"]);
      var sheet = getOrCreateSheet(ss, stationId, headers);

      // Find work order number from jobOrderId
      var woNum = getWorkOrderNumber(ss, payload.jobOrderId);

      var rowValues = [
        payload.id || "",
        payload.entryDate || payload.entry_date || "",
        payload.timeSlot || payload.time_slot || "",
        woNum,
        payload.personnelName || payload.personnel_name || ""
      ];

      // Add output values per subProcess column
      subProcesses.forEach(function(sp) {
        if (sp === payload.subProcess) {
          rowValues.push(Number(payload.output || payload.good || 0));
        } else {
          rowValues.push("");
        }
      });

      rowValues.push(payload.loggedAt || payload.logged_at || new Date().toISOString());
      sheet.appendRow(rowValues);
      return responseSuccess(payload);
    }

    return responseError("Invalid POST action parameter: " + action);
  } catch (err) {
    return responseError(err.toString());
  }
}

function getWorkOrderNumber(ss, jobOrderId) {
  var sheet = ss.getSheetByName("JobOrders");
  if (!sheet) return jobOrderId;
  var rows = getRowsAsObjects(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(jobOrderId)) {
      return rows[i].work_order_number || rows[i].workOrderNumber || jobOrderId;
    }
  }
  return jobOrderId;
}

function getJobOrderLookupMap(ss) {
  var sheet = ss.getSheetByName("JobOrders");
  var map = {};
  if (!sheet) return map;
  var rows = getRowsAsObjects(sheet);
  rows.forEach(function(r) {
    var woNum = String(r.work_order_number || r.workOrderNumber || "").trim();
    if (woNum) map[woNum] = String(r.id);
  });
  return map;
}

function getRowsAsObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.join("").trim() === "") continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    rows.push(obj);
  }
  return rows;
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    formatHeaderRow(sheet);
  }
  return sheet;
}

function formatHeaderRow(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1E293B");
  headerRange.setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);
}

/**
 * Run this function once inside Apps Script editor to auto-generate all 6 tabs!
 */
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. JobOrders
  var jobSheet = getOrCreateSheet(ss, "JobOrders", ["id", "work_order_number", "brand_name", "status", "created_at"]);
  if (jobSheet.getLastRow() === 1) {
    jobSheet.appendRow(["jo-2408", "WO-2408", "FireMaster", "Active", new Date().toISOString()]);
    jobSheet.appendRow(["jo-2409", "WO-2409", "Oxigeno", "Active", new Date().toISOString()]);
    jobSheet.appendRow(["jo-2410", "WO-2410", "SafeAir", "Active", new Date().toISOString()]);
  }

  // 2. Department Tabs
  Object.keys(STATION_CONFIGS).forEach(function(stationId) {
    var subProcesses = STATION_CONFIGS[stationId];
    var headers = ["id", "entry_date", "time_slot", "work_order_number", "personnel_name"].concat(subProcesses).concat(["logged_at"]);
    getOrCreateSheet(ss, stationId, headers);
  });

  SpreadsheetApp.getUi().alert("ProdSystem Multi-Tab Database setup successfully!");
}

function responseSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function responseError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
