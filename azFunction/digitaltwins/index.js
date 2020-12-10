
//function to update the properties of the digital twin

const AzureIdentity = require('@azure/identity');
const AzureDigitalTwins = require('@azure/digital-twins');

const ADTInstanceURL = 'https://TwinPB.api.weu.digitaltwins.azure.net';


const createPatchObject = (path, value) => {
    return {
        "op": "replace",
        "path": path,
        "value": value
    }
}


module.exports = async function (context, IoTHubMessages) {
    //Authorization
    const creds = new AzureIdentity.ManagedIdentityCredential("https://digitaltwins.azure.net");
    const client = new AzureDigitalTwins.DigitalTwinsClient(ADTInstanceURL, creds);

    for ( var message of IoTHubMessages) {
        context.log(JSON.stringify(message.deviceID));

        //create the patchobject
        var jsonPatch = [];
        jsonPatch.push(createPatchObject('/temperature', message.temperature));
        jsonPatch.push(createPatchObject('/humidity', message.humidity));
        jsonPatch.push(createPatchObject('/co2ThresholdRed', message.co2ThresholdRed)); 
        context.log(message.co2ThresholdRed);

        jsonPatch.push(createPatchObject('/co2ThresholdYellow', message.co2ThresholdYellow));
        jsonPatch.push(createPatchObject('/co2', message.co2));
        jsonPatch.push(createPatchObject('/voc', message.voc));
        jsonPatch.push(createPatchObject('/light', message.light));
        jsonPatch.push(createPatchObject('/loudness', message.loudness));


            
            await client.updateDigitalTwin(message.deviceID, jsonPatch)
            .then(res => {
                context.log(`updated data for ${message.deviceID}`);
            }).catch(err => {
                context.log(err);
            });
    }

    context.done();
};