







function createResultColumnSimple() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = sheet.getActiveRange();
  var ui = SpreadsheetApp.getUi();
  
  // Get the selected data
  var data = selection.getValues();
  var headers = data[0];
  
  // Prompt for table name only
  var tableNameResponse = ui.prompt(
    'Table Name',
    'Enter the table name:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (tableNameResponse.getSelectedButton() != ui.Button.OK) {
    ui.alert('Operation cancelled.');
    return;
  }
  
  var tableName = tableNameResponse.getResponseText();
  var variableName = 'MulitTranscibe_simple'; // Fixed variable name
  
  // Find column indices
  var tableColIndex = headers.indexOf('Table');
  var idColIndex = headers.indexOf('ID');
  
  // Create result column
  var resultData = [['Result']]; // Header
  
  for (var i = 1; i < data.length; i++) {
    var value = data[i][tableColIndex];
    var id = data[i][idColIndex];
    var result = tableName + ';' + variableName + ';' + value + ';' + id;
    resultData.push([result]);
  }
  
  // Write the result next to the selection
  var startRow = selection.getRow();
  var startCol = selection.getColumn() + headers.length;
  var resultRange = sheet.getRange(startRow, startCol, resultData.length, 1);
  resultRange.setValues(resultData);
  
  // Convert the selected data to CSV format
  var csvContent = data.map(function(row) {
    return row.map(function(cell) {
      // Escape quotes and wrap in quotes if contains comma or newline
      if (cell == null) return '';
      var cellStr = cell.toString();
      if (cellStr.indexOf(',') > -1 || cellStr.indexOf('"') > -1 || cellStr.indexOf('\n') > -1) {
        return '"' + cellStr.replace(/"/g, '""') + '"';
      }
      return cellStr;
    }).join(',');
  }).join('\n');
  
  // Generate random filename
  function generateRandomString(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  const randomString = generateRandomString();
  const filename = randomString + '_RunTranscibe.csv';
  const blob = Utilities.newBlob(csvContent, 'text/csv', filename);
  
  // Upload to the server
  var url = 'https://11.aimachengine.com/upload.php?type=RunTranscibe&table=' + tableName;
  
  var options = {
    'method': 'post',
    'payload': {
      'fileUpload': blob
    },
    'muteHttpExceptions': true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (responseCode == 200) {
      ui.alert('Success!', 'Result column created and CSV file uploaded.\nResponse: ' + responseBody, ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'Result column created but upload failed.\nServer returned: ' + responseCode + ' - ' + responseBody, ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('Error', 'Result column created but upload failed: ' + e.toString(), ui.ButtonSet.OK);
  }
}












function createResultColumnSimpleMulitTextCode() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = sheet.getActiveRange();
  var ui = SpreadsheetApp.getUi();
  
  // Get the selected data
  var data = selection.getValues();
  var headers = data[0];
  
  // Prompt for table name only
  var tableNameResponse = ui.prompt(
    'Table Name',
    'Enter the table name:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (tableNameResponse.getSelectedButton() != ui.Button.OK) {
    ui.alert('Operation cancelled.');
    return;
  }
  
  var tableName = tableNameResponse.getResponseText();
  var variableName = 'MulitTextCode'; // Fixed variable name
  
  // Find column indices
  var tableColIndex = headers.indexOf('Table');
  var idColIndex = headers.indexOf('ID');
  
  // Create result column
  var resultData = [['Result']]; // Header
  
  for (var i = 1; i < data.length; i++) {
    var value = data[i][tableColIndex];
    var id = data[i][idColIndex];
    var result = tableName + ';' + variableName + ';' + value + ';' + id;
    resultData.push([result]);
  }
  
  // Write the result next to the selection
  var startRow = selection.getRow();
  var startCol = selection.getColumn() + headers.length;
  var resultRange = sheet.getRange(startRow, startCol, resultData.length, 1);
  resultRange.setValues(resultData);
  
  // Convert the selected data to CSV format
  var csvContent = data.map(function(row) {
    return row.map(function(cell) {
      // Escape quotes and wrap in quotes if contains comma or newline
      if (cell == null) return '';
      var cellStr = cell.toString();
      if (cellStr.indexOf(',') > -1 || cellStr.indexOf('"') > -1 || cellStr.indexOf('\n') > -1) {
        return '"' + cellStr.replace(/"/g, '""') + '"';
      }
      return cellStr;
    }).join(',');
  }).join('\n');
  
  // Create a blob from the CSV content
  function generateRandomString(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  const randomString = generateRandomString();
  const filename = randomString + '_RunText.csv';
  const blob = Utilities.newBlob(csvContent, 'text/csv', filename);
  
  // Upload to the server
  var url = 'https://11.aimachengine.com/upload.php?type=RunText&table=' + tableName;
  
  var options = {
    'method': 'post',
    'payload': {
      'fileUpload': blob
    },
    'muteHttpExceptions': true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (responseCode == 200) {
      ui.alert('Success!', 'Result column created and CSV file uploaded.\nResponse: ' + responseBody, ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'Result column created but upload failed.\nServer returned: ' + responseCode + ' - ' + responseBody, ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('Error', 'Result column created but upload failed: ' + e.toString(), ui.ButtonSet.OK);
  }
}














function sendPostRequest(inputData) {
  var url = 'https://11.aimachengine.com/fix.php';
  
  var payload = {
    'input': inputData
  };
  
  var options = {
    'method': 'post',
    'payload': payload,
    'muteHttpExceptions': true // This allows you to see error responses
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (responseCode == 200) {
      return responseBody;
    } else {
      return 'Error: ' + responseCode + ' - ' + responseBody;
    }
  } catch (e) {
    return 'Request failed: ' + e.toString();
  }
}

function get() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = sheet.getActiveRange();
  var ui = SpreadsheetApp.getUi();
  
  // Get the selected data (should be the Result column)
  var data = selection.getValues();
  var headers = data[0];
  
  // Check if this is a Result column
  if (headers[0] != 'Result') {
    ui.alert('Error', 'Please select the Result column', ui.ButtonSet.OK);
    return;
  }
  
  // Collect all result values (skip header)
  var allResults = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) { // Only add non-empty values
      allResults.push(data[i][0]);
    }
  }
  
  // Join with '>' and make POST request
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
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (responseCode == 200) {
      // Parse JSON response
      var jsonData = JSON.parse(responseBody);
      
      // Handle both array and single object responses
      var dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
      
      // Write each JSON object across columns starting after Result column
      var startRow = selection.getRow() + 1; // Start after header
      var startCol = selection.getColumn() + 1; // Start after Result column
      
      for (var i = 0; i < dataArray.length; i++) {
        var obj = dataArray[i];
        var rowData = [];
        
        // Convert object to alternating key-value pairs
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            rowData.push(key);
            var cleanValue = obj[key].toString().replace(/[\r\n]+/g, ' ');
            rowData.push(cleanValue);
          }
        }
        
        // Write this row across columns
        var currentRow = startRow + i;
        if (rowData.length > 0) {
          var outputRange = sheet.getRange(currentRow, startCol, 1, rowData.length);
          outputRange.setValues([rowData]);
        }
      }
      ui.alert('Success!', 'Output received and added to sheet', ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'Server returned: ' + responseCode + ' - ' + responseBody, ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('Error', 'Request failed: ' + e.toString(), ui.ButtonSet.OK);
  }
}


function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Tools')
      .addItem('Run Transcribe', 'createResultColumnSimple')
      .addItem('Run Text', 'createResultColumnSimpleMulitTextCode')
      .addItem('Get', 'get')
      .addToUi();
}
