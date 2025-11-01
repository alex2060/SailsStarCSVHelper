<?php
$host = 'mysql-199933-0.cloudclusters.net';
$port = 10033;
$user = 'admin';
$password = 'RQApoaNQ';
$database = 'working_db';

// Create connection
$connection = new mysqli($host, $user, $password, $database, $port);

// Check connection
if ($connection->connect_error) {
    die("Connection failed: " . $connection->connect_error);
}

// Variables
#$input = "test;MulitTranscibe_simple;Transcribe_table;1>test;MulitTranscibe_simple;Transcribe_table;2";
$input = $_POST['input'];
$string = explode(">", $input);

// Array to hold all results
$json_output = [];

// Loop through each string segment
foreach ($string as $segment) {
    $array = explode(";", $segment);
    
    $table_name = $array[1] . "_" . $array[0] . "_" . $array[2];
    $id_key_value = $array[3];
    
    // Prepare query (prevents SQL injection)
    $query = "SELECT * FROM $table_name WHERE id_key = ?";
    $stmt = $connection->prepare($query);
    $stmt->bind_param("i", $id_key_value);
    
    // Execute query
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Fetch and add results to output array
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $json_output[] = $row;
        }
    } else {
        // Optionally add a message for no results
        $json_output[] = [
            'error' => 'No results found',
            'table' => $table_name,
            'id_key' => $id_key_value
        ];
    }
    
    $stmt->close();
}

// Close connection
$connection->close();

// Output as JSON
header('Content-Type: application/json');
echo json_encode($json_output, JSON_PRETTY_PRINT);
?>
