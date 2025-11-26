/**
 * Google Sheets API Functions - Refactored and Fixed
 * Handles CSV generation, server uploads, and API communication
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a random alphanumeric string for filenames
 */
function generateRandomString(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Convert CSV data to properly formatted string
 */
function convertToCSV(data) {
  return data.map(function(row) {
    return row.map(function(cell) {
      if (cell == null) return '';
      var cellStr = cell.toString();
      // Escape quotes and wrap in quotes if contains comma or newline
      if (cellStr.indexOf(',') > -1 || cellStr.indexOf('"') > -1 || cellStr.indexOf('\n') > -1) {
        return '"' + cellStr.replace(/"/g, '""') + '"';
      }
      return cellStr;
    }).join(',');
  }).join('\n');
}

/**
 * Convert column letter to number (e.g., 'A' -> 1)
 */
function columnLetterToNumber(letter) {
  var column = 0;
  var length = letter.length;
  for (var i = 0; i < length; i++) {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
}

/**
 * Get all sheet names in a spreadsheet
 */
function getSheetNames(spreadsheet) {
  var sheets = spreadsheet.getSheets();
  var names = [];
  for (var i = 0; i < sheets.length; i++) {
    names.push(sheets[i].getName());
  }
  return names;
}

// ============================================================================
// RESULT COLUMN CREATION FUNCTIONS
// ============================================================================

/**
 * Create result column for Transcribe processing
 */
function createResultColumnSimple() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = sheet.getActiveRange();
  var ui = SpreadsheetApp.getUi();
  
  var data = selection.getValues();
  var headers = data[0];
  
  // Prompt for table name
  var tableNameResponse = ui.prompt(
    'Table Name',
    'Enter the table name:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (tableNameResponse.getSelectedButton() != ui.Button.OK) {
    ui.alert('Operation cancelled.');
    return;
  }
  
  var tableName = tableNameResponse.getResponseText().trim();
  if (!tableName) {
    ui.alert('Error', 'Table name cannot be empty.', ui.ButtonSet.OK);
    return;
  }
  
  var variableName = 'MulitTranscibe_simple';
  
  // Find column indices
  var tableColIndex = headers.indexOf('Table');
  var idColIndex = headers.indexOf('ID');
  
  if (tableColIndex === -1 || idColIndex === -1) {
    ui.alert('Error', 'Could not find required columns: Table and ID', ui.ButtonSet.OK);
    return;
  }
  
  // Create result column
  var resultData = [['Result']];
  for (var i = 1; i < data.length; i++) {
    var value = data[i][tableColIndex] || '';
    var id = data[i][idColIndex] || '';
    var result = tableName + ';' + variableName + ';' + value + ';' + id;
    resultData.push([result]);
  }
  
  // Write result column next to selection
  var startRow = selection.getRow();
  var startCol = selection.getColumn() + headers.length;
  var resultRange = sheet.getRange(startRow, startCol, resultData.length, 1);
  resultRange.setValues(resultData);
  
  // Convert to CSV and upload
  uploadCSVToServer(data, tableName, 'RunTranscibe');
}

/**
 * Create result column for Text Code processing
 */
function createResultColumnSimpleMulitTextCode() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = sheet.getActiveRange();
  var ui = SpreadsheetApp.getUi();
  
  var data = selection.getValues();
  var headers = data[0];
  
  var tableNameResponse = ui.prompt(
    'Table Name',
    'Enter the table name:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (tableNameResponse.getSelectedButton() != ui.Button.OK) {
    ui.alert('Operation cancelled.');
    return;
  }
  
  var tableName = tableNameResponse.getResponseText().trim();
  if (!tableName) {
    ui.alert('Error', 'Table name cannot be empty.', ui.ButtonSet.OK);
    return;
  }
  
  var variableName = 'MulitTextCode';
  
  var tableColIndex = headers.indexOf('Table');
  var idColIndex = headers.indexOf('ID');
  
  if (tableColIndex === -1 || idColIndex === -1) {
    ui.alert('Error', 'Could not find required columns: Table and ID', ui.ButtonSet.OK);
    return;
  }
  
  var resultData = [['Result']];
  for (var i = 1; i < data.length; i++) {
    var value = data[i][tableColIndex] || '';
    var id = data[i][idColIndex] || '';
    var result = tableName + ';' + variableName + ';' + value + ';' + id;
    resultData.push([result]);
  }
  
  var startRow = selection.getRow();
  var startCol = selection.getColumn() + headers.length;
  var resultRange = sheet.getRange(startRow, startCol, resultData.length, 1);
  resultRange.setValues(resultData);
  
  uploadCSVToServer(data, tableName, 'RunText');
}

// ============================================================================
// SERVER COMMUNICATION
// ============================================================================

/**
 * Upload CSV data to server
 */
function uploadCSVToServer(data, tableName, processType) {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var csvContent = convertToCSV(data);
    const randomString = generateRandomString();
    const filename = randomString + '_' + processType + '.csv';
    const blob = Utilities.newBlob(csvContent, 'text/csv', filename);
    
    var url = 'https://11.aimachengine.com/upload.php?type=' + processType + '&table=' + encodeURIComponent(tableName);
    
    var options = {
      'method': 'post',
      'payload': {
        'fileUpload': blob
      },
      'muteHttpExceptions': true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (responseCode == 200) {
      ui.alert('Success!', 'CSV file uploaded successfully.\nFilename: ' + filename + '\nResponse: ' + responseBody, ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'Upload failed.\nServer returned: ' + responseCode + '\nMessage: ' + responseBody, ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('Error', 'Upload failed: ' + e.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Send POST request and get results
 */
function get() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = sheet.getActiveRange();
  var ui = SpreadsheetApp.getUi();
  
  var data = selection.getValues();
  var headers = data[0];
  
  if (headers[0] !== 'Result') {
    ui.alert('Error', 'Please select the Result column', ui.ButtonSet.OK);
    return;
  }
  
  var allResults = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      allResults.push(data[i][0]);
    }
  }
  
  if (allResults.length === 0) {
    ui.alert('Error', 'No results found in column', ui.ButtonSet.OK);
    return;
  }
  
  try {
    var inputString = allResults.join('>');
    var url = 'https://11.aimachengine.com/fix.php';
    
    var payload = {
      'input': inputString
    };
    
    var options = {
      'method': 'post',
      'payload': payload,
      'muteHttpExceptions': true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (responseCode == 200) {
      var jsonData = JSON.parse(responseBody);
      var dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
      
      var startRow = selection.getRow() + 1;
      var startCol = selection.getColumn() + 1;
      
      for (var i = 0; i < dataArray.length; i++) {
        var obj = dataArray[i];
        var rowData = [];
        
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            rowData.push(key);
            var value = obj[key];
            var cleanValue = '';
            
            if (value !== null && value !== undefined) {
              cleanValue = value.toString().replace(/[\r\n]+/g, ' ');
            }
            
            rowData.push(cleanValue);
          }
        }
        
        var currentRow = startRow + i;
        if (rowData.length > 0) {
          var outputRange = sheet.getRange(currentRow, startCol, 1, rowData.length);
          outputRange.setValues([rowData]);
        }
      }
      
      ui.alert('Success!', 'Output received and added to sheet', ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'Server returned: ' + responseCode + '\nMessage: ' + responseBody, ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('Error', 'Request failed: ' + e.toString(), ui.ButtonSet.OK);
  }
}

// ============================================================================
// QUESTION/AI RESPONSE FUNCTIONS
// ============================================================================

/**
 * Ask a question about selected rows
 */
function askQuestion() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = sheet.getActiveRange();
  var ui = SpreadsheetApp.getUi();
  
  var startRow = selection.getRow();
  var numRows = selection.getNumRows();
  
  // NEW: Capture selected columns
  var startCol = selection.getColumn();
  var numCols = selection.getNumColumns();
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // NEW: Get the selected column names
  var selectedColumns = [];
  for (var c = 0; c < numCols; c++) {
    var colIndex = startCol + c - 1;
    if (colIndex < headers.length) {
      selectedColumns.push(headers[colIndex]);
    }
  }
  
  var allRowsData = [];
  var selectedRows = [];
  
  for (var r = 0; r < numRows; r++) {
    var currentRow = startRow + r;
    
    if (currentRow === 1) continue; // Skip header
    
    var rowData = sheet.getRange(currentRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowObject = { 'row_number': currentRow };
    
    for (var i = 0; i < headers.length; i++) {
      if (rowData[i] !== null && rowData[i] !== '') {
        rowObject[headers[i]] = rowData[i];
      }
    }
    
    allRowsData.push(rowObject);
    selectedRows.push(currentRow);
  }
  
  if (allRowsData.length === 0) {
    ui.alert('Error', 'No valid data rows selected.', ui.ButtonSet.OK);
    return;
  }
  
  var selectionInfo = allRowsData.length === 1 
    ? 'You selected 1 row (row ' + selectedRows[0] + ')' 
    : 'You selected ' + allRowsData.length + ' rows (rows ' + selectedRows.join(', ') + ')';
  
  // NEW: Add column info to the message
  selectionInfo += '\nColumns: ' + selectedColumns.join(', ');
  
  var questionResponse = ui.prompt(
    'Ask Question',
    selectionInfo + '\n\nEnter your question about this data:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (questionResponse.getSelectedButton() != ui.Button.OK) {
    ui.alert('Operation cancelled.');
    return;
  }
  
  var question = questionResponse.getResponseText().trim();
  if (!question) {
    ui.alert('Error', 'Question cannot be empty.', ui.ButtonSet.OK);
    return;
  }
  
  // NEW: Pass selected columns to the server function
  sendQuestionToServer(question, allRowsData, selectedRows, sheet, selectedColumns, startCol, numCols);
}


/**
 * Send question to server for processing
 */
function sendQuestionToServer(question, rowsData, selectedRows, sheet, selectedColumns, startCol, numCols) {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var webAppUrl = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL');
    if (!webAppUrl) {
      webAppUrl = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
    }
    
    var payload = {
      'question': question,
      'data': JSON.stringify(rowsData),
      'rows': JSON.stringify(selectedRows),
      'sheet_id': SpreadsheetApp.getActiveSpreadsheet().getId(),
      'sheet_name': sheet.getName(),
      'callback_url': webAppUrl,
      'column_name': 'AI Response',
      // NEW: Add selected column information
      'selected_columns': JSON.stringify(selectedColumns),
      'start_column': startCol,
      'num_columns': numCols
    };
    
    var url = 'https://11.aimachengine.com/question.php';
    var options = {
      'method': 'post',
      'payload': payload,
      'muteHttpExceptions': true
    };
    
    ui.alert('Processing', 'Sending question for ' + rowsData.length + ' row(s)...', ui.ButtonSet.OK);
    
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (responseCode == 200) {
      try {
        var jsonResponse = JSON.parse(responseBody);
        ui.alert('Success!', 'Question submitted. Response received.', ui.ButtonSet.OK);
        // Write response to column if available
        writeAnswerToColumn(sheet, selectedRows, jsonResponse.result || jsonResponse.response, 'AI Response ' + responseBody);
      } catch (parseError) {
        // Response wasn't JSON, treat as plain text
        ui.alert('Success!', 'Question submitted. Server response: ' + responseBody.substring(0, 200), ui.ButtonSet.OK);
      }
    } else {
      ui.alert('Error', 'Server returned: ' + responseCode + '\nMessage: ' + responseBody, ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('Error', 'Request failed: ' + e.toString(), ui.ButtonSet.OK);
  }
}


/**
 * Write AI response to column (one answer per row)
 */
function writeAnswerToColumn(sheet, rows, answers, columnName) {
  try {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var targetCol = -1;
    
    // Find existing column
    for (var i = 0; i < headers.length; i++) {
      if (headers[i] === columnName) {
        targetCol = i + 1;
        break;
      }
    }
    
    // Create column if it doesn't exist
    if (targetCol === -1) {
      targetCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, targetCol).setValue(columnName);
    }
    

    

  } catch (e) {
    SpreadsheetApp.getUi().alert('Error writing answer: ' + e.toString());
  }
}

// ============================================================================
// WEB APP CALLBACKS (Deploy as Web App)
// ============================================================================

/**
 * Handle POST requests from external services
 * Deploy as: Deploy > New deployment > Web app
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    var sheetId = data.sheet_id;
    var sheetName = data.sheet_name || 'Sheet1';
    var row = parseInt(data.row);
    var value = data.value;
    
    // Column can be provided as number or name
    var targetCol;
    
    if (data.column) {
      targetCol = parseInt(data.column);
    } else if (data.column_name) {
      var spreadsheet = SpreadsheetApp.openById(sheetId);
      var sheet = spreadsheet.getSheetByName(sheetName);
      
      if (!sheet) {
        return errorResponse('Sheet "' + sheetName + '" not found');
      }
      
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      targetCol = -1;
      
      for (var i = 0; i < headers.length; i++) {
        if (headers[i] === data.column_name) {
          targetCol = i + 1;
          break;
        }
      }
      
      if (targetCol === -1) {
        targetCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, targetCol).setValue(data.column_name);
      }
    } else {
      return errorResponse('Must provide either column (number) or column_name');
    }
    
    var spreadsheet = SpreadsheetApp.openById(sheetId);
    var sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return errorResponse('Sheet not found');
    }
    
    sheet.getRange(row, targetCol).setValue(value);
    
    return successResponse({
      'sheet': sheetName,
      'row': row,
      'column': targetCol,
      'value': value
    });
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return errorResponse(error.toString());
  }
}

/**
 * Success response helper
 */
function successResponse(data) {
  var response = {
    'status': 'success',
    'message': 'Sheet updated successfully',
    'data': data
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Error response helper
 */
function errorResponse(message) {
  var response = {
    'status': 'error',
    'message': message
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}



// ============================================================================
// UI MENU
// ============================================================================

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Tools')
      .addItem('Run Transcribe', 'createResultColumnSimple')
      .addItem('Run Text', 'createResultColumnSimpleMulitTextCode')
      .addItem('Get Results', 'get')
      .addItem('Ask Question', 'askQuestion')
      .addToUi();
}
