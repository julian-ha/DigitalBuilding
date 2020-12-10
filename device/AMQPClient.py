
import json
import logging
import threading

import pika
import pika.exceptions

logger = logging.getLogger(__name__)


class AMQPClient(object):


    SOCKET_TIMEOUT = 5
    CONNECTION_ATTEMPTS = 3



    def __init__(self,
                 amqp_user,
                 amqp_pass,
                 amqp_host,
                 amqp_vhost,
                 amqp_queue):
        self.connection = None
        self.channel = None
        self._is_closed = False
        
        credentials = pika.credentials.PlainCredentials(
            username=amqp_user,
            password=amqp_pass)
        
        self.queue = amqp_queue

        self._connection_parameters = pika.ConnectionParameters(
            host=amqp_host,
            virtual_host=amqp_vhost,
            socket_timeout=self.SOCKET_TIMEOUT,
            connection_attempts=self.CONNECTION_ATTEMPTS,
            credentials=credentials)
        self._connect()

	
    #connect to the service 
    def _connect(self):
        try:
            self.connection = pika.BlockingConnection(self._connection_parameters)
            self.channel = self.connection.channel()
            self.channel.queue_declare(queue = self.queue)
            self.channel.confirm_delivery()
            self._is_closed = False
        except pika.exceptions.AMQPConnectionError:
            self._is_closed = True
            logger.warn('Couldnt connect to the Master Device...')
    #consume messages from queue
    def consume_messages(self, func):
        if self._is_closed == True:
            logger.warn('trying to connect to master')
            self._connect()
        
        try:
            self.channel.basic_consume(queue = self.queue, auto_ack = True, on_message_callback = func)
            self.channel.start_consuming()
        except:
            logger.warn('Connection lost to Master')
            self._is_closed = True
            self._connect()
            self.channel.basic_consume(queue = self.queue, auto_ack = True, on_message_callback = func)
            self.channel.start_consuming()


    #publish messages to a specific queue
    #if message couldnt be sent, it tries to reconnect and tries to send the message again
    #if both publishes fail, it should return false
    def publish_message(self, message, routing_key):
        if self._is_closed == True:
            logger.warn('trying to connect to the master')
            self._connect()

        try:
            self.channel.basic_publish(exchange='',
                                       routing_key=routing_key,
                                       body= json.dumps(message))

            print('message successfully sent')
            return True
        except pika.exceptions.ConnectionClosed as e:
            self._is_closed = True
            logger.warn('Stream lost to Master device...')
            # obviously, there is no need to close the current
            # channel/connection.
            self._connect()
            if not self._is_closed:
                try:
                    self.channel.basic_publish(exchange='',
                                routing_key=routing_key,
                                body=json.dumps(message))
                    print('message successfully sent')
                    return True
                except:
                    self._is_closed = True
                    return False
     
        except pika.exceptions.StreamLostError:
            self._is_closed = True
            logger.warn('Stream lost to Maser device...')
            self._connect()
            if not self._is_closed:
                try:
                    self.channel.basic_publish(exchange='',
                                routing_key=routing_key,
                                body=json.dumps(message))
                    print('message successfully sent')
                    return True
                except:
                    self._is_closed = True
                    return False
        except:
            self._is_closed = True
            return False
            #save in file

    #close the connection
    def close(self):
        if self._is_closed:
            return
        self._is_closed = True
        thread = threading.current_thread()
        if self.channel:
            logger.debug('Closing amqp channel of thread {0}'.format(thread))
            try:
                self.channel.close()
            except Exception as e:
                # channel might be already closed, log and continue
                logger.debug('Failed to close amqp channel of thread {0}, '
                             'reported error: {1}'.format(thread, repr(e)))

        if self.connection:
            logger.debug('Closing amqp connection of thread {0}'
                         .format(thread))
            try:
                self.connection.close()
            except Exception as e:
                # connection might be already closed, log and continue
                logger.debug('Failed to close amqp connection of thread {0}, '
                             'reported error: {1}'.format(thread, repr(e)))
