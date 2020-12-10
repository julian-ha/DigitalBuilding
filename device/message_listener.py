from azure.iot.device import IoTHubDeviceClient
import threading
import time
import json

  

#get connection string from config file
files_class = files.files(path = 'config.json')
config_data = files_class.read_file()

CONNECTION_STRING = config_data(['CONNECTION_STRING'])

config_data = get_file_data('config.json')
client = IoTHubDeviceClient.create_from_connection_string(config_data['CONNECTION_STRING'])

def message_listener(client):
    while True:
        message = client.receive_message()
        decoded_message = message.data.decode('utf-8')
        json_message = json.loads(decoded_message)
        print(json_message)
        
        #open file
        config_data = files_class.read_file()
        
        config_data['co2ThresholdYellow'] = json_message['co2ThresholdYellow']
        config_data['co2ThresholdRed'] = json_message['co2ThresholdRed']
        files_class.write_to_file(config_data)
        
message_listener_thread = threading.Thread(target = message_listener, args=(client,))
message_listener_thread.daemon = True
message_listener_thread.start()
print('message listener created and waiting for messages')
while True:
    time.sleep(10)

