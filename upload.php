<?php

function processAndUploadCSV($input_filename, $tablename) {
    // Function to read and batch CSV
    function loop_csv_reader($filename) {
        $outputs = [];
        $file = fopen($filename, 'r');

        if ($file === false) {
            throw new Exception("Error opening file: $filename");
        }

        // Read header (silently)
        $header = fgetcsv($file);

        $count = 0;
        $text = [];
        $Prompt = [];
        $tableName = [];
        $IDs = [];
        $prompt_sheama = [];

        while (($row = fgetcsv($file)) !== false) {
            // Handle missing columns gracefully
            $text[] = $row[0] ?? '';
            $Prompt[] = $row[1] ?? '';
            $tableName[] = $row[2] ?? '';
            $IDs[] = $row[3] ?? '';
            
            // Check if column 4 exists and has a value before exploding
            if (isset($row[4]) && !empty($row[4])) {
                $prompt_sheama[] = explode(";", $row[4]);
            } else {
                $prompt_sheama[] = []; // Empty array if column doesn't exist
            }

            $count++;

            if ($count == 5) {
                $count = 0;
                $arraySubArray = [
                    'text' => $text,
                    'Prompt' => $Prompt,
                    'tableName' => $tableName,
                    'IDs' => $IDs,
                    'prompt_sheama' => $prompt_sheama
                ];
                $outputs[] = $arraySubArray;

                // Reset arrays
                $text = [];
                $Prompt = [];
                $tableName = [];
                $IDs = [];
                $prompt_sheama = [];
            }
        }

        // Handle remaining rows (less than 5)
        if (!empty($text)) {
            $arraySubArray = [
                'text' => $text,
                'Prompt' => $Prompt,
                'tableName' => $tableName,
                'IDs' => $IDs,
                'prompt_sheama' => $prompt_sheama
            ];
            $outputs[] = $arraySubArray;
        }

        fclose($file);
        return $outputs;
    }

    // Process CSV
    $values = loop_csv_reader($input_filename);

    // Generate random UUID (PHP 7.0+)
    if (function_exists('random_bytes')) {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        $random_id = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    } else {
        // Fallback for older PHP versions
        $random_id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    // Write to task file
    $task_filename = 'uploads/'.$random_id . '_'.$_GET['type'].'.task';
    $file = fopen($task_filename, 'w');

    if ($file === false) {
        throw new Exception("Error creating task file: $task_filename");
    }

    foreach ($values as $value) {
        fputcsv($file, [
            json_encode($value),
            'MulitTextCode',
            $tablename
        ]);
    }

    fclose($file);

    // Verify file was created
    if (!file_exists($task_filename)) {
        throw new Exception("Task file was not created: $task_filename");
    }




    // Upload file
    echo "inhere\n";
    $url = "https://scheduler.slqmyadmin.com/upload";
    $file_path = $task_filename;
    echo $file_path;
    if (file_exists($file_path)) {
        $curl = curl_init();
        $cfile = new CURLFile($file_path);

        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => ['file' => $cfile],
            CURLOPT_RETURNTRANSFER => true,
        ]);
        echo "\ninhere2\n";
        $response = curl_exec($curl);
        echo "\n".$response."\n";
        $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        $json_response = json_decode($response, true);
        return [
            'success' => true,
            'http_code' => $http_code,
            'response' => $json_response,
            'task_file' => $task_filename,
            'random_id' => $random_id
        ];
    } else {
        throw new Exception("File does not exist: $file_path");
    }

}





function processAndUploadCSVRunTranscibe($input_filename, $tablename) {
    // Function to read and batch CSV
    function loop_csv_reader($filename) {
        $outputs = [];
        $file = fopen($filename, 'r');

        if ($file === false) {
            throw new Exception("Error opening file: $filename");
        }

        // Read header (silently)
        $header = fgetcsv($file);

        $count = 0;
        $text = [];
        $tableName = [];
        $IDs = [];

        while (($row = fgetcsv($file)) !== false) {
            // Handle missing columns gracefully
            $text[] = $row[0] ?? '';
            $tableName[] = $row[1] ?? '';
            $IDs[] = $row[2] ?? '';
            

            $count++;

            if ($count == 2) {
                $count = 0;
                $arraySubArray = [
                    'AudioFile' => $text,
                    'Table' => $tableName,
                    'IDs' => $IDs
                ];
                $outputs[] = $arraySubArray;

                // Reset arrays
                $text = [];
                $tableName = [];
                $IDs = [];
            }
        }

        // Handle remaining rows (less than 5)
        if (!empty($text)) {
            $arraySubArray = [
                'AudioFile' => $text,
                'Table' => $tableName,
                'IDs' => $IDs
            ];
            $outputs[] = $arraySubArray;
        }

        fclose($file);
        return $outputs;
    }

    // Process CSV
    $values = loop_csv_reader($input_filename);

    // Generate random UUID (PHP 7.0+)
    if (function_exists('random_bytes')) {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        $random_id = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    } else {
        // Fallback for older PHP versions
        $random_id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    // Write to task file
    $task_filename = 'uploads/'.$random_id . '_'.$_GET['type'].'.task';
    $file = fopen($task_filename, 'w');

    if ($file === false) {
        throw new Exception("Error creating task file: $task_filename");
    }

    foreach ($values as $value) {
        fputcsv($file, [
            json_encode($value),
            'MulitTranscibe_simple',
            $tablename
        ]);
    }

    fclose($file);

    // Verify file was created
    if (!file_exists($task_filename)) {
        throw new Exception("Task file was not created: $task_filename");
    }


    // Upload file
    $url = "https://scheduler.slqmyadmin.com/upload";
    $file_path = $task_filename;

    if (file_exists($file_path)) {
        $curl = curl_init();
        $cfile = new CURLFile($file_path);

        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => ['file' => $cfile],
            CURLOPT_RETURNTRANSFER => true,
        ]);

        $response = curl_exec($curl);
        $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        $json_response = json_decode($response, true);
        return [
            'success' => true,
            'http_code' => $http_code,
            'response' => $json_response,
            'task_file' => $task_filename,
            'random_id' => $random_id
        ];
    } else {
        throw new Exception("File does not exist: $file_path");
    }

}


// Usage example:
$uploadDir = 'uploads/';
$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['fileUpload'])) {
    $file = $_FILES['fileUpload'];
    
    // Check for upload errors
    if ($file['error'] === UPLOAD_ERR_OK) {
        $fileName = basename($file['name']);
        $targetPath = $uploadDir . $fileName;
        
        // Move uploaded file to uploads directory
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $message = "✓ File uploaded: " . htmlspecialchars($fileName);
            $messageType = 'success';
            
            // Process the file
            try {
                if ($_GET['type']=="RunTranscibe"){
                    $result = processAndUploadCSVRunTranscibe($targetPath, $_GET['table'] ?? 'default_table');
                }
                else{
                    echo "type ".$_GET['type'];
                    $result = processAndUploadCSV($targetPath, $_GET['table'] ?? 'default_table');
                }
                
                // Success message
                
            } catch (Exception $e) {
                // Error message
                echo "<div style='padding:10px;background:#f8d7da;color:#721c24;border:1px solid #f5c6cb;border-radius:4px;margin:10px 0;'>";
                echo "✗ <strong>Error creating task file:</strong><br>";
                echo htmlspecialchars($e->getMessage());
                echo "</div>";
            }
        } else {
            echo "<div style='padding:10px;background:#f8d7da;color:#721c24;border:1px solid #f5c6cb;border-radius:4px;margin:10px 0;'>";
            echo "✗ Failed to move uploaded file.";
            echo "</div>";
        }
    } else {
        echo "<div style='padding:10px;background:#f8d7da;color:#721c24;border:1px solid #f5c6cb;border-radius:4px;margin:10px 0;'>";
        echo "✗ Upload error code: " . $file['error'];
        echo "</div>";
    }
}

// Get list of uploaded files
$uploadedFiles = [];
if (is_dir($uploadDir)) {
    $uploadedFiles = array_diff(scandir($uploadDir), array('.', '..'));
}

?>
