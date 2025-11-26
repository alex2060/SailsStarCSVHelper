#!/usr/bin/env python3
"""
async_processor.py - Asynchronously process data from PHP and write to file
Prints ALL output and ERRORS to Docker container stdout
"""

import sys
import json
import os
from datetime import datetime
import requests
import traceback
import re
import uuid
import csv

# Force unbuffered output for immediate Docker visibility
sys.stdout = open(sys.stdout.fileno(), mode='w', buffering=1)
sys.stderr = open(sys.stderr.fileno(), mode='w', buffering=1)

def debug_print(msg):
    """Print debug messages to stdout (visible in Docker)"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    output = f"[{timestamp}] {msg}"
    print(output, flush=True)
    sys.stdout.flush()

def debug_error(msg):
    """Print error messages to stderr (visible in Docker logs)"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    output = f"[ERROR {timestamp}] {msg}"
    print(output, file=sys.stderr, flush=True)
    sys.stderr.flush()

def write_data_to_file(data, filename_prefix="processed_data"):
    """
    Write the received data to a file with timestamp
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{filename_prefix}_{timestamp}.json"  # FIXED: Removed extra space
    
    try:
        debug_print(f"Writing data to file: {filename}")
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        # Also create a log entry
        log_filename = "/var/www/html/uploads/processing_log.txt"
        with open(log_filename, 'a') as log:
            log.write(f"{timestamp} - Processed data written to {filename}\n")
        
        debug_print(f"Successfully wrote file: {filename}")
        return filename
    except Exception as e:
        debug_error(f"Failed to write file: {str(e)}")
        debug_error(f"Traceback: {traceback.format_exc()}")
        error_log = "/var/www/html/uploads/error_log.txt"
        try:
            with open(error_log, 'a') as log:
                log.write(f"{timestamp} - Error: {str(e)}\n{traceback.format_exc()}\n")
        except Exception as write_err:
            debug_error(f"Failed to write error log: {str(write_err)}")
        return None

def load_data(sheet_id, sheet_name, text, row, column):
    try:
        sheet_id_config = sheet_id
        web_app_url = "https://script.google.com/macros/s/AKfycbyPWPxmGCoxjYp3fULvxk-ruXNRga6KDRNNQbTl_jvTCOacvy15nPPE-qWzN4iz3g4Q4g/exec"
        
        body = {
            "sheet_id": sheet_id_config,
            "sheet_name": sheet_name,
            "row": row,
            "column": column,
            "value": text
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        debug_print(f"Google Apps Script URL: {web_app_url}")
    except Exception as e:
        debug_error(f"Failed to setup Google Sheets config: {str(e)}")
        debug_error(f"Traceback: {traceback.format_exc()}")
        return
    
    web = ""
    try:
        debug_print("Sending request to Google Apps Script...")
        response = requests.post(web_app_url, data=json.dumps(body), headers=headers, timeout=10)
        debug_print(f"Google Apps Script response status: {response.status_code}")
        debug_print(f"Response text: {response.text}")
        web = response.text
    except Exception as e:
        debug_error(f"Failed to reach Google Apps Script: {str(e)}")
        debug_error(f"Traceback: {traceback.format_exc()}")
        web = "fail"
    
    return web

def convert_question_to_binary_json(question, model, sheet_id, sheet_name):
    """
    Convert a question into binary decision format using Ollama API
    Args:
        question: The question to convert
        model: The Ollama model to use (default: deepseek-r1:7b)
    Returns:
        dict: JSON formatted binary decision
    """
    # Construct the prompt
    prompt = f"""Convert this question into a binary decision format with details. Output as JSON only.
but be sure to think about it this question will be used to rate a text
in the case case where someone asked if a dog was important you might have
binary_topic about dog
positive_case yes a dog was talked about in the text.
negative_case

Original question: "{question}"

Format as valid JSON:
{{
    "binary_topic": "[extracted core concept]",
    "positive_case": "[details supporting this]",
    "negative_case": "[details opposing this]",
    "unknown": "[details about what could determine this]"
}}

Output only valid JSON, no explanation."""

    # API endpoint for Ollama
    url = "http://host.docker.internal:11434/api/generate"
    
    # Request payload
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": True,
        "options": {
            "temperature": 0.1,
            "num_predict": 2048
        }
    }
    
    try:
        # Make the API request with streaming
        response = requests.post(url, json=payload, stream=True)
        response.raise_for_status()
        
        full_response = ""
        
        print("\n" + "="*80)
        print("RAW MODEL OUTPUT (STREAMING):")
        print("="*80 + "\n")
        
        # Process the streaming response
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line)
                token = chunk.get("response", "")
                full_response += token
                # Print each token as it comes
                print(token, end="", flush=True)
                
                if chunk.get("done", False):
                    break
        
        print("\n\n" + "="*80)
        print("EXTRACTED THINKING PROCESS:")
        print("="*80 + "\n")
        
        # Extract thinking from tags
        think_matches = re.findall(r'<think>(.*?)</think>', full_response, re.DOTALL)
        if think_matches:
            for i, think in enumerate(think_matches, 1):
                print(f"--- Thinking Block {i} ---\n")
                print(think.strip())
                print()
        else:
            print("No explicit thinking tags found in response.")
        
        print("\n" + "="*80)
        print("FINAL ANSWER (JSON):")
        print("="*80 + "\n")
        
        # Remove thinking tags to get clean JSON
        answer_text = re.sub(r'<think>.*?</think>', '', full_response, flags=re.DOTALL).strip()
        print(answer_text)
        
        return [full_response, answer_text]
    
    except requests.exceptions.RequestException as e:
        print(f"\nError connecting to Ollama: {e}", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"\nError parsing JSON response: {e}", file=sys.stderr)
        print(f"Raw response: {full_response}", file=sys.stderr)
        return None

def upload_file(task_filename):
    """
    Upload a file to the specified URL and return response details.
    
    Args:
        task_filename: Path to the file to upload
        
    Returns:
        dict: Response details including success status, HTTP code, and JSON response
        
    Raises:
        FileNotFoundError: If the file doesn't exist
    """
    url = "https://scheduler.slqmyadmin.com/upload"
    file_path = task_filename
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File does not exist: {file_path}")
    
    # Generate a random UUID
    random_id = str(uuid.uuid4())
    
    # Open and upload the file
    with open(file_path, 'rb') as file:
        files = {'file': file}
        response = requests.post(url, files=files)
    
    # Get response details
    http_code = response.status_code
    
    try:
        json_response = response.json()
    except requests.exceptions.JSONDecodeError:
        json_response = None
    
    return {
        'success': True,
        'http_code': http_code,
        'response': json_response,
        'task_file': task_filename,
        'random_id': random_id
    }

def main():
    """
    Main function to receive data from stdin and process it
    """
    # FIXED: Initialize variables at the start to avoid scope issues
    question = ''
    sheet_id = ''
    sheet_name = ''
    output_data = None
    task_filename = None
    
    try:
        debug_print("=== STARTING PYTHON PROCESSOR ===")
        debug_print("Waiting for data from PHP...")
        
        # Read data from stdin (sent from PHP)
        try:
            input_data = sys.stdin.read()
            debug_print(f"Received input data (length: {len(input_data)} bytes)")
            debug_print(f"Received input data {input_data}")
        except Exception as e:
            debug_error(f"Failed to read from stdin: {str(e)}")
            debug_error(f"Traceback: {traceback.format_exc()}")
            return
        
        if not input_data:
            debug_error("No input data received from PHP")
            print(json.dumps({'status': 'error', 'message': 'No input data'}))
            return
        
        # Parse JSON data
        try:
            debug_print("Parsing JSON data...")
            data = json.loads(input_data)
            debug_print("JSON parsed successfully")
        except json.JSONDecodeError as e:
            debug_error(f"JSON parsing error: {str(e)}")
            debug_error(f"Input was: {input_data[:200]}...")
            debug_error(f"Traceback: {traceback.format_exc()}")
            return
        
        # Extract components
        try:
            question = data.get('question', '')
            sheet_id = data.get('sheet_id', '')
            sheet_name = data.get('sheet_name', '')
            rows = data.get('rows', [])
            all_rows_data = data.get('allRowsData', [])
            selected_columns = data.get('selected_columns', [])
            start_column = data.get('start_column', 1)
            num_columns = data.get('num_columns', 0)
            
            debug_print(f"Extracted data:")
            debug_print(f" - Question: {question[:50] if question else 'None'}")
            debug_print(f" - Sheet: {sheet_name}")
            debug_print(f" - Rows data: {len(all_rows_data)} entries")
            debug_print(f" - Selected columns: {selected_columns}")
        except Exception as e:
            debug_error(f"Failed to extract data: {str(e)}")
            debug_error(f"Traceback: {traceback.format_exc()}")
            return
        
        # Google Sheets configuration
        print()
        print()
        print()
        print()
        first_field = list(data['allRowsData'][0]['_columns'].keys())[0]
        theCollum= data['allRowsData'][0]['_columns'][first_field]['number'] 
        web = load_data(sheet_id, sheet_name, "loaded python", max(data['rows'])+1, theCollum )
        
        # Create a structured output
        try:
            output_data = {
                'timestamp': datetime.now().isoformat(),
                'question': question,
                'sheet_id': sheet_id,
                'sheet_name': sheet_name,
                'rows': rows,
                'row_count': len(all_rows_data),
                'data': all_rows_data,
                'selected_columns': selected_columns,
                'start_column': start_column,
                'num_columns': num_columns,
                'response': web,
                'column_selection_info': {
                    'column_names': selected_columns,
                    'start_column_index': start_column,
                    'number_of_columns': num_columns
                }
            }
            debug_print("Output data prepared successfully")
        except Exception as e:
            debug_error(f"Failed to prepare output data: {str(e)}")
            debug_error(f"Traceback: {traceback.format_exc()}")
            return
        
        # Write to file
        try:
            debug_print("Writing processed data to file...")
            filename = write_data_to_file(output_data)
            if filename:
                debug_print(f"Processing completed successfully!")
                debug_print(f"Output file: {filename}")
                print(json.dumps({'status': 'success', 'file': filename}))
            else:
                debug_error("Failed to write output file - filename is None")
                print(json.dumps({'status': 'error', 'message': 'Failed to write file'}))
        except Exception as e:
            debug_error(f"Failed during file writing: {str(e)}")
            debug_error(f"Traceback: {traceback.format_exc()}")
        
        # FIXED: Moved processing logic from finally to try block
        result = convert_question_to_binary_json(question, "deepseek-r1:7b", sheet_id, sheet_name)
        
        if result is None:
            debug_error("Failed to convert question to binary JSON")
            return
        
        print()
        print("json new 1")
        print()
        print(result)
        print("json")
        
        s = result[1]
        start = s.find('{')
        end = s.rfind('}')
        resultjson = s[start:end+1] if start != -1 and end != -1 else s
        
        load_data(sheet_id, sheet_name, str(result), max(data['rows']) +1, theCollum+3)

        
        print()
        print("json out")
        print(resultjson)
        print("json out")
        
        binary_json = json.loads(resultjson)
        print(binary_json)
        print("loaded data")
        
        load_data(sheet_id, sheet_name, str(binary_json['binary_topic']), max(data['rows'])+1 , theCollum+1)
        load_data(sheet_id, sheet_name, str("Not_About_"+binary_json['binary_topic']), min(data['rows']), theCollum+1 )
        load_data(sheet_id, sheet_name, str("About_"+binary_json['binary_topic']), min(data['rows']), theCollum+2  )
        load_data(sheet_id, sheet_name, str("Unknown"), min(data['rows']), theCollum+3 )
        
        binary_json['binary_topic'] = binary_json['binary_topic'].strip(" ")
        
        try:
            if (binary_json['unknown'] == None):
                binary_json['unknown'] = "Cant Tell"
        except:
            binary_json['unknown'] = "Cant Tell"
        
        question = "Rate these calls by About_"+binary_json['binary_topic']+"_float is ( "+binary_json['positive_case']+" ) Not_About_"+binary_json['binary_topic']+" ( "+binary_json['negative_case']+" ) Unknown_float ("+binary_json['unknown']+") This is the call be sure to rate with a float make sure not all of them are 0 please make sure to rate right"
        
        load_data(sheet_id, sheet_name, question, max(data['rows']) +1 , theCollum+2)
        
        # FIXED: Save the CSV filename to task_filename variable
        task_filename = '/var/www/html/uploads/2output'+str(uuid.uuid4())+'.task'
        
        # Create CSV file
        with open(task_filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            for x in range(1,output_data['row_count']):
                server = "https://script.google.com/macros/s/AKfycbyPWPxmGCoxjYp3fULvxk-ruXNRga6KDRNNQbTl_jvTCOacvy15nPPE-qWzN4iz3g4Q4g/exec"
                first_field = list(data['allRowsData'][x]['_columns'].keys())[0]
                text = data['allRowsData'][x][first_field]
                row = min(data['rows'])+x
                column = theCollum+1
                topic = binary_json['binary_topic']
                
                json_str = '{ "server":"'+str(server)+'", "Text": "'+str( text )+'", "question": "'+str(question)+'","sheet_id": "'+str(sheet_id)+'","sheet_name": "'+str(sheet_name)+'","row": '+str(row)+',"column": '+str(column)+' ,"topic":"'+str(topic)+'"}'
                print(json_str)
                writer.writerow([json_str, "CallBackTest", "testing"])
        
        # FIXED: Now task_filename is defined before use
        upload_result = upload_file(task_filename)
        debug_print(f"Upload result: {upload_result}")
    
    except Exception as e:
        debug_error(f"Unexpected error in main: {str(e)}")
        debug_error(f"Traceback: {traceback.format_exc()}")
        print(json.dumps({'status': 'error', 'message': str(e)}))
    
    finally:
        debug_print("=== PYTHON PROCESSOR FINISHED ===\n")

if __name__ == '__main__':
    main()
