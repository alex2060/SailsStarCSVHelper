<?php
// question.php - Server-side handler for multiple rows with async Python processing

header('Content-Type: application/json');

// Get POST data
$question = $_POST['question'] ?? '';
$data = $_POST['data'] ?? '{}';
$rows = $_POST['rows'] ?? '[]';
$sheet_id = $_POST['sheet_id'] ?? '';
$sheet_name = $_POST['sheet_name'] ?? '';

// Decode the data
$allRowsData = json_decode($data, true);
$rowNumbers = json_decode($rows, true);

// Log the request
error_log("Question received: $question for rows: " . json_encode($rowNumbers));

// Asynchronously call Python script to write data to file
callPythonAsync([
    'question' => $question,
    'sheet_id' => $sheet_id,
    'sheet_name' => $sheet_name,
    'rows' => $rowNumbers,
    'allRowsData' => $allRowsData
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
    'rows' => $rowNumbers
]);

/**
 * Asynchronously call Python script to process and write data
 * This function returns immediately without waiting for Python to finish
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
    // Using nohup and & to run in background
    // Redirect stdin from echo, stdout and stderr to /dev/null
    $command = sprintf(
        'echo %s | python3 %s > /dev/null 2>&1 &',
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