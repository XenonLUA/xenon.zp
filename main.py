import requests
import time

def fetch_messages(token):
    url = "https://web2.temp-mail.org/messages"
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Authorization": f"Bearer {token}",
        "Origin": "https://temp-mail.org",
        "Referer": "https://temp-mail.org/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        print("Response Text:", response.text)  # Print response text
        
        data = response.json()
        if 'messages' in data:
            return data['messages']
        else:
            print("No 'messages' key in the response.")
            return []
    except requests.exceptions.RequestException as e:
        print("Failed to fetch messages:", e)
        return []
    except ValueError as e:
        print("Failed to parse JSON response:", e)
        return []

def print_messages(messages):
    if messages:
        print("Messages:")
        for message in messages:
            print("From:", message['from'])
            print("Subject:", message['subject'])
            print("Body Preview:", message['bodyPreview'])
            print("-----------------------")
    else:
        print("No messages available.")

def main(token):
    while True:
        messages = fetch_messages(token)
        print_messages(messages)
        time.sleep(60)  # Fetch messages every 60 seconds

if __name__ == "__main__":
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYmYyN2Q5NGMyY2VlNDM0Zjk1NzJmOTM4ZTNlNzU2ZGEiLCJtYWlsYm94IjoiZG9yb2tlaDE1NUBhYm5vdmVsLmNvbSIsImlhdCI6MTcxMzUyMTE2NX0.VXCB7qivqRShYNHxDvZuYKsHNoE9i-t105If_TJNxXA"
    main(token)
