<?php
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
            $message = "File uploaded successfully: " . htmlspecialchars($fileName);
            $messageType = 'success';
        } else {
            $message = "Failed to move uploaded file.";
            $messageType = 'error';
        }
    } else {
        $message = "Upload error: " . $file['error'];
        $messageType = 'error';
    }
}

// Get list of uploaded files
$uploadedFiles = [];
if (is_dir($uploadDir)) {
    $uploadedFiles = array_diff(scandir($uploadDir), array('.', '..'));
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP File Upload</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .upload-form {
            margin-bottom: 30px;
        }
        
        .file-input-wrapper {
            position: relative;
            overflow: hidden;
            display: inline-block;
            width: 100%;
            margin-bottom: 20px;
        }
        
        .file-input-wrapper input[type=file] {
            position: absolute;
            left: -9999px;
        }
        
        .file-input-label {
            display: block;
            padding: 15px 20px;
            background: #f0f0f0;
            border: 2px dashed #ccc;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .file-input-label:hover {
            background: #e0e0e0;
            border-color: #667eea;
        }
        
        .upload-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .upload-btn:hover {
            transform: translateY(-2px);
        }
        
        .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .files-list {
            margin-top: 30px;
        }
        
        .files-list h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 20px;
        }
        
        .file-item {
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }
        
        .file-item::before {
            content: "📄";
            margin-right: 10px;
            font-size: 20px;
        }
        
        .no-files {
            color: #666;
            font-style: italic;
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 File Upload</h1>
        
        <?php if ($message): ?>
            <div class="message <?php echo $messageType; ?>">
                <?php echo $message; ?>
            </div>
        <?php endif; ?>
        
        <form class="upload-form" method="POST" enctype="multipart/form-data">
            <div class="file-input-wrapper">
                <input type="file" name="fileUpload" id="fileUpload" required>
                <label for="fileUpload" class="file-input-label">
                    <span id="file-chosen">Click to choose a file or drag here</span>
                </label>
            </div>
            <button type="submit" class="upload-btn">Upload File</button>
        </form>
        
        <div class="files-list">
            <h2>Uploaded Files</h2>
            <?php if (count($uploadedFiles) > 0): ?>
                <?php foreach ($uploadedFiles as $file): ?>
                    <div class="file-item">
                        <?php echo htmlspecialchars($file); ?>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <div class="no-files">No files uploaded yet</div>
            <?php endif; ?>
        </div>
    </div>
    
    <script>
        const fileInput = document.getElementById('fileUpload');
        const fileChosen = document.getElementById('file-chosen');
        
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                fileChosen.textContent = this.files[0].name;
            }
        });
    </script>
</body>
</html>
