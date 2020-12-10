import json
from datetime import datetime
import threading
import ambimate_class
import AMQPClient
import time
import RPi.GPIO as GPIO
import files

#init the amqpclient
amqp_client =  AMQPClient.AMQPClient(amqp_host = "192.168.2.136", amqp_user = "julian", amqp_pass = "julian", amqp_vhost = "/", amqp_queue= "iotlab")
#init the ambimatesensor
ambimate = ambimate_class.ambimate()
#init the file classes
files_class = files.files(path = 'config.json')
data_file_class = files.files(path = 'data.json')



GPIO.setmode(GPIO.BOARD)
GPIO.setwarnings(False)

#initialise the pins for the lamp as an Output
number_pin_red = 40
number_pin_yellow = 37
number_pin_green =  36
channel_list = [number_pin_red, number_pin_yellow, number_pin_green]
GPIO.setup(channel_list, GPIO.OUT)


def blink(high_pins):
    for channel in channel_list:
        if channel in high_pins:
            GPIO.output(channel, GPIO.HIGH)
        else:
            GPIO.output(channel, GPIO.LOW)
    

i = 0
while True: 
    #receive threshold values from config file
    config_data = files_class.read_file()
    i = i+1
   
    
    #receive reading from ambimate sensor
    try:
        readings = ambimate.read_all()
        print(i)
	
    

    except IOError:
        print('there was an IOError')
        blink([number_pin_red, number_pin_green, number_pin_yellow])
        #status mit LEDs
    except:
        print('another error with the reading of the data')
        blink([number_pin_red, number_pin_green, number_pin_yellow])
        #status mit LEDs
     #set the lights for the co2 reading
    if readings.co2 >= int(config_data['co2ThresholdRed']):
        #print('red')
        blink([number_pin_red])    
    elif readings.co2 >= int(config_data['co2ThresholdYellow']):
        #print('yellow')
        blink([number_pin_yellow])
    else:
        #print('green')
        blink([number_pin_green])

    #check if data is in stored file
    stored_data = data_file_class.read_file()
    for data in stored_data['missing_data']:
        send_message = amqp_client.publish_message(message= data, routing_key= 'iotlab')
        if send_message == True:
            print('data from file sent to cloud')
            stored_data['missing_data'].remove(data)
    
    #create data object 
    now = datetime.now()
    data = {
        "deviceID": "Hue-1-IoTLab",
        "temperature": readings.temperature,
        "humidity": readings.humidity,
        "co2ThresholdRed": int(config_data['co2ThresholdRed']),
        "co2ThresholdYellow": int(config_data['co2ThresholdYellow']),
        "co2": readings.co2,
        "voc": readings.voc,
        "light": readings.light,
        "loudness": readings.audio,
        "occupancy": readings.pir_event,
        "timestamp": now.strftime("%Y-%m-%dT%H:%M:%S")
    }

    send_message =  amqp_client.publish_message(message= data, routing_key= 'iotlab')
    #if message couldnt be sent, store data in file
    if send_message == False:
        print('store is file')
        stored_data['missing_data'].append(data)
    #save data in file
    data_file_class.write_to_file(data = stored_data)
    
    time.sleep(10)


    
