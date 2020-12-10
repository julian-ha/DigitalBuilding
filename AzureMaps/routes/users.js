//import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

const msRestNodeAuth = require('@azure/ms-rest-nodeauth');
const coreHttp = require('@azure/core-http').coreHttp;
const coreArm = require('@azure/core-arm').coreArm;
const AzureDigitalTwinsAPI = require('@azure/digital-twins').AzureDigitalTwinsAPI;
const subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"];
msRestNodeAuth
  .interactiveLogin()
  .then((creds) => {
    const client = new AzureDigitalTwinsAPI(creds, subscriptionId);
    const dependenciesFor = ["testdependenciesFor"];
    const includeModelDefinition = true;
    const maxItemCount = 1;
    client.digitalTwinModels
      .list(dependenciesFor, includeModelDefinition, maxItemCount)
      .then((result) => {
        console.log("The result is:");
        console.log(result);
      });
  })
  .catch((err) => { 
    console.error(err); 
  })

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
