
import pika
from ast import literal_eval
import json
import time
import AMQPClient
import files

from azure.iot.device import IoTHubDeviceClient, Message

#get connection string from config file
files_class = files.files(path = 'config.json')
config_data = files_class.read_file()

CONNECTION_STRING = config_data(['CONNECTION_STRING'])

#init the amqpclient / Master can connect to localhost as the server is running on this machine
amqp_client = AMQPClient.AMQPClient(amqp_host = "localhost", amqp_user = "julian", amqp_pass = "julian", amqp_vhost = "/", amqp_queue = "iotlab")
#init the iothub client
client = IoTHubDeviceClient.create_from_connection_string(CONNECTION_STRING)
time.sleep(2)



def process_message(channel, method, properties, body):
    print(body)
    data = body
    global client
    #data = literal_eval(body)
    
    try:
        message = Message(data)
        client.send_message(message)
        #print('message successfully sent')
    except:
        print('message couldnt be sent')
        #send message back to queue
        amqp_client.publish_message(message = data, routing_key = 'iotlab')
	#reconnect
        client = IoTHubDeviceClient.create_from_connection_string(CONNECTION_STRING)
        time.sleep(2)
        
amqp_client.consume_messages(process_message)
