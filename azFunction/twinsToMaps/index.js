
//function to update the properties in Azure Indoor maps
const AzureIdentity = require('@azure/identity');
const AzureDigitalTwins = require('@azure/digital-twins');
const axios = require('axios');

const ADTInstanceURL = 'https://TwinPB.api.weu.digitaltwins.azure.net';
const subscriptionKeyMaps = "pBcsYtzwmyZ1P3M1eDfEfpk5MrmKQjMdcqr0Jb_Vvdc";

//StateSet IDs for the states temperature and Occupancy
const tempStatesetID = "3cb7f750-6517-8dff-b832-c9b2e93eaa6d";
const occStatesetID = "6d6f3504-ee1e-5b8d-052c-30d485c3c4f7";

var statesetID = "";
var keyName = "";

const queryTwin = async(client, query) => {
    var result = [];
    for await (values of client.queryTwins(query)) {
        result.push(values);
    }
    return result
}


module.exports = async function (context, eventGridEvent) {

    const creds = new AzureIdentity.ManagedIdentityCredential('https://digitaltwins.azure.net');
    const client = new AzureDigitalTwins.DigitalTwinsClient(ADTInstanceURL, creds);

    //get the Unit Name from the Digital twin properties
    const query = `SELECT * FROM digitaltwins WHERE $dtId = '${eventGridEvent.subject}'`;
    var twin = await queryTwin(client, query);

    context.log(`UnitName for Azure Maps: ${twin[0].unitNameMaps}`);

    for (element of eventGridEvent.data.data.patch) {
        var isUpdatable = false;
        switch(element.path) {
            case '/temperature':
                statesetID = tempStatesetID;
                keyName = 'temperature';
                break;
            case '/occupancy':
                statesetID = occStatesetID;
                keyName = 'occupied';
                break;
            default:
                isUpdatable = true;

        }

        if(!isUpdatable) {
            context.log(`Updating for feature ${keyName}`);
            var data = {
                "states": [
                    {
                        "keyName":keyName,
                        "value": element.value,
                        "eventTimestamp": eventGridEvent.eventTime
                    }
                ]
            }
            context.log(JSON.stringify(data));
    
            var endpoint = `https://us.atlas.microsoft.com/featureState/state?api-version=1.0&statesetID=${statesetID}&featureID=${twin[0].unitNameMaps}&subscription-key=${subscriptionKeyMaps}`;
            var config = {
                method: 'post',
                url: endpoint,
                data: JSON.stringify(data)
            }
            await axios(config)
            .then(response => {
                context.log('Maps Feature successfully updated');
            })
            .catch(err => {
                context.log(`An Error occured: ${err}`);
            })
        }
    }




    context.done();
}