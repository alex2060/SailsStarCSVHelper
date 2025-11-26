#!/usr/bin/env python3
import json
import requests
import sys
import re

def convert_question_to_binary_json(question, model="deepseek-r1:7b"):
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
    url = "http://localhost:11434/api/generate"
    
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
        in_think_tag = False
        thinking_content = ""
        answer_content = ""
        
        print("\n" + "="*80)
        print("RAW MODEL OUTPUT (STREAMING):")
        print("="*80 + "\n")
        
        # Process the streaming response
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line)
                token = chunk.get("response", "")
                print(token)
                full_response += token
                
                # Print each token as it comes
                print(token, end="", flush=True)
                
                if chunk.get("done", False):
                    break
        
        print("\n\n" + "="*80)
        print("EXTRACTED THINKING PROCESS:")
        print("="*80 + "\n")
        
        # Extract thinking from <think> tags
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
        
        # Parse the JSON
        binary_json = json.loads(answer_text)
        
        return binary_json
        
    except requests.exceptions.RequestException as e:
        print(f"\nError connecting to Ollama: {e}", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"\nError parsing JSON response: {e}", file=sys.stderr)
        print(f"Raw response: {full_response}", file=sys.stderr)
        return None

def main():

    question="did they talk about electronics"
    result = convert_question_to_binary_json(question)
    
    if result:
        # Pretty print the JSON result
        print("\n" + "="*80)
        print("PARSED JSON OUTPUT:")
        print("="*80 + "\n")
        print(json.dumps(result, indent=2))
        print()
        print()
        print()
        print(result['binary_topic'])
        print()
        print(result['positive_case'])
        print()
        print(result['negative_case'])

    else:
        print("\nFailed to convert question", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
