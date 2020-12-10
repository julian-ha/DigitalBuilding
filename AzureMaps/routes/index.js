var express = require('express');
var router = express.Router();

const digitalTwins = require('@azure/digital-twins');
const AzureIdentity = require('@azure/identity');

//iothub
var iotHubClient = require('azure-iothub').Client;
var iotHubMessage = require('azure-iot-common').Message;
var iotHubServieClient = iotHubClient.fromConnectionString("HostName=iothubPB.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=2zTUXAv0pzjKxCxB10pSFWrWm4bkDplHlDWkVQmg7Ec=");



const adtInstanceURL = 'https://TwinPB.api.weu.digitaltwins.azure.net';
var credentials = new AzureIdentity.AzureCliCredential();
var client = new digitalTwins.DigitalTwinsClient(adtInstanceURL, credentials);

const query_twin = async (query) => {
  var result = [];
  for await (values of client.queryTwins(query)) {
    result.push(values);
  }
  return result
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//retrieve specific data for the digital twin
router.get('/twindata/:twinID', async (req, res, next) => {
  const query = `SELECT * FROM digitaltwins WHERE unitNameMaps = '${req.params.twinID}'`;
  var room = await query_twin(query);
 
  res.status(200).json({
    "room": room
  })
});


//send the C2D Message to the IoTHub
//Message contains the threshold values for the lights
router.post('/message', async (req, res, next) => {
  console.log(req.query.id);
  console.log(req.query.threshold);
  var data = {
    co2ThresholdRed: req.query.thresholdred,
    co2ThresholdYellow: req.query.thresholdyellow
  }

  iotHubServieClient.open(function (err) {
    if (err) {
      console.error('Could not connect: ' + err.message);
      return res.status(500).send('Connection Error')
    } else {
        var message = new iotHubMessage(JSON.stringify(data));
        message.ack = 'full';
        console.log('Sending message: ' + message.getData());
        iotHubServieClient.send(req.query.id, message, (err, resp) => {
          if (err) return res.status(500).json({"message": `Device ${req.query.id}: ${err.toString()}`})  
          if (res)  return res.status(201).json({"message": `Device ${req.query.id}: ${resp.constructor.name} `})  
        });

    }
  });
  
});

module.exports = router; 
 