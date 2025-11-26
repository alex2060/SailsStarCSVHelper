<?php
// question.php - Server-side handler for multiple rows with async Python processing
// Modified to print Python output to Docker container

header('Content-Type: application/json');

// Get POST data
$question = $_POST['question'] ?? '';
$data = $_POST['data'] ?? '{}';
$rows = $_POST['rows'] ?? '[]';
$sheet_id = $_POST['sheet_id'] ?? '';
$sheet_name = $_POST['sheet_name'] ?? '';

// NEW: Get selected column information
$selected_columns = $_POST['selected_columns'] ?? '[]';
$start_column = $_POST['start_column'] ?? 1;
$num_columns = $_POST['num_columns'] ?? 0;

// Decode the data
$allRowsData = json_decode($data, true);
$rowNumbers = json_decode($rows, true);
$selectedColumnNames = json_decode($selected_columns, true);

// Log the request
error_log("Question received: $question for rows: " . json_encode($rowNumbers));
error_log("Selected columns: " . json_encode($selectedColumnNames));

// Asynchronously call Python script to write data to file
callPythonAsync([
    'status' => 'success',
    'question' => $question,
    'sheet_id' => $sheet_id,
    'sheet_name' => $sheet_name,
    'rows' => $rowNumbers,
    'allRowsData' => $allRowsData,
    // NEW: Add selected column information
    'selected_columns' => $selectedColumnNames,
    'start_column' => (int)$start_column,
    'num_columns' => (int)$num_columns
]);

// Process the question for each row
$answers = [];

if (is_array($allRowsData)) {
    foreach ($allRowsData as $rowData) {
        $response = processQuestion($question, $rowData);
        $answers[] = $response;
    }
}

// Return the responses
echo json_encode([
    'status' => 'success',
    'answers' => $answers,
    'question' => $question,
    'sheet_id' => $sheet_id,
    'allRowsData' => $allRowsData,
    'rows' => $rowNumbers,
    // NEW: Include in response
    'selected_columns' => $selectedColumnNames,
    'start_column' => (int)$start_column,
    'num_columns' => (int)$num_columns
]);

/**
 * Asynchronously call Python script to process and write data
 * This function returns immediately without waiting for Python to finish
 * Modified to print Python output to Docker container for debugging
 */
function callPythonAsync($data) {
    // Path to Python script
    $pythonScript = __DIR__ . '/async_processor.py';
    
    // Check if Python script exists
    if (!file_exists($pythonScript)) {
        error_log("Python script not found: $pythonScript");
        return false;
    }
    
    // Convert data to JSON
    $jsonData = json_encode($data);
    
    // Escape the JSON for shell
    $escapedData = escapeshellarg($jsonData);
    
    // Build the command
    // Redirect Python output to Apache error log (which Docker captures)
    $command = sprintf(
        'echo %s | python3 %s 2>&1 | while IFS= read -r line; do echo "[PYTHON] $line" >&2; done &',
        $escapedData,
        escapeshellarg($pythonScript)
    );
    
    // Execute the command asynchronously
    exec($command);
    
    return true;
}


function processQuestion($question, $data) {
    // Replace this with your actual AI/processing logic
    
    $dataString = json_encode($data);
    
    // Example: Make a curl request to your AI service
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://your-ai-service.com/process");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'question' => $question,
        'context' => $dataString
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200 && $result) {
        return $result;
    }

    // Fallback response
    return "Processing: $question";
}

?>