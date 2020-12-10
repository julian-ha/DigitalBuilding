#Version B
# Please refer to 114-13315 for connection diagram 

#I2C Pins 
#GPIO2 -> SDA
#GPIO3 -> SCL

#Import the Library required 
import smbus
import time

class ambimate_reading:
    def __init__(self):
        self.temperature = None
        self.humidity = None
        self.light = None
        self.audio = None
        self.co2 = None
        self.voc = None
        self.bat_volts = None
        self.pir_event = False
        self.audio_event = False
        self.motion_event = False




class ambimate:

    def __init__(self):

        self.bus = smbus.SMBus(1)
        self.address = 0x2a
        self.elements = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        self.data = bytearray(self.elements)

        # See application spec for more info regarding registers
        self.fw_ver = self.bus.read_byte_data(self.address, 0x80)
        self.fw_sub_ver = self.bus.read_byte_data(self.address, 0x81)
        self.opt_sensors = self.bus.read_byte_data(self.address, 0x82)
        self.reading = ambimate_reading()
        out_str = "Ambimate Sensor 4 Core "
        if (self.opt_sensors & 0x01):
            out_str += "+ CO2 "
        if (self.opt_sensors & 0x04):
            out_str += "+ Audio"
        print(out_str)
    
    def get_status_events(self, register):
        if(self.status & register):
            return True
        else:
            return False
        
    
    def read_all(self):
	#write to the sensor
        if (self.opt_sensors & 0x01):
            self.bus.write_byte_data(self.address, 0xC0, 0x7F)
        else:
            self.bus.write_byte_data(self.address, 0xC0, 0x3F)
        #wait until sensor readings are properly taken
        time.sleep(0.2)

        for i in range(0,15):
            self.data[i] = self.bus.read_byte_data(self.address, i)
	#assign values to reading object
        self.reading.temperature = (256* self.data[1] + self.data[2]) / 10.0
        self.reading.humidity = (256* self.data[3] + self.data[4]) / 10.0
        self.reading.light = (256 * (self.data[5] & 0x7F) + self.data[6])
        self.reading.audio = (256 * (self.data[7] & 0x7F) + (self.data[8] & 0x7F))
        self.reading.co2 = (256* self.data[11] + self.data[12])
        self.reading.voc = (256* self.data[13] + self.data[14])
        self.reading.bat_volts = ((256* (self.data[9] & 0x7F) + self.data[10]) / 1024.0) * (3.3 / 0.330)
        self.status = self.data[0]
        self.reading.pir_event = self.get_status_events(0x80)
        self.reading.audio_event = self.get_status_events(0x02)
        self.reading.motion_event = self.get_status_events(0x01)
        
        
        

        
        return self.reading
    


