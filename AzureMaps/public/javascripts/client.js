const subscriptionKey = "pBcsYtzwmyZ1P3M1eDfEfpk5MrmKQjMdcqr0Jb_Vvdc";
//IDs for the example from Microsoft


//IDs fot the planB Map
// const tilesetId = "7162816f-a51e-a08c-fe82-6faee731bfd3";
// const statesetId = "1cd7d51c-f95e-8892-be6e-1f3a003bfd6d";

const tilesetId = "26ce2e38-9db5-ec3f-54be-c9f4d0b0f55d";
const statesetID = "bdd22a80-b40e-e024-ce8c-8715f80d3051";
const statesetIDOcc = "9bf3e401-8039-a840-81fe-8db40467f3f3";

var indoorManager;
var twinID;
 
const toggleModal = (modalID) => {
  document.getElementById(modalID).classList.toggle('is-active');
}



const CreateIndoorMap  = (statesetId) => {
  const map = new atlas.Map("map-id", {
    //use your facility's location
    center: [10.094780, 48.884381],
    //or, you can use bounds: [# west, # south, # east, # north] and replace # with your Map bounds
    //style: "satellite_road_labels",
    view: 'Auto',
    authOptions: { 
        authType: 'subscriptionKey',
        subscriptionKey: subscriptionKey
    },
    zoom: 19,
  });
  
  const levelControl = new atlas.control.LevelControl({
    position: "top-right",
  });
  
  
  const indoorManager = new atlas.indoor.IndoorManager(map, {
    levelControl, //level picker
    tilesetId,
    statesetId, //optional
  });
  
  
  if (statesetId.length > 0) {
    indoorManager.setDynamicStyling(true);
  }
  
  
//console.log(indoorManager.getOptions());

//console.log(indoorManager.getCurrentFacility());
  // map.events.add("levelchanged", indoorManager, (eventData) => {
  //   //put code that runs after a level has been changed
  //   console.log("The level has changed:", eventData);
  // });
  
  // map.events.add("facilitychanged", indoorManager, (eventData) => {
  //   //put code that runs after a facility has been changed
  //   console.log("The facility has changed:", eventData);
  // });
  
  map.events.add("click", function(e){
  
      var features = map.layers.getRenderedShapes(e.position, "indoor");
      
      //change the values on clicking on room
      var result = features.reduce(async function (ids, feature) {
          if (feature.layer.id != "footprint_boundary_fill") {
            console.log(feature);
            document.getElementById('data-room-name').innerHTML = feature.properties.name;
            document.getElementById('data-unit-id').innerHTML = feature.properties.featureId;
            document.getElementById('data-room-category').innerHTML = feature.properties.featureType;
  
            var rawResponse = await fetch(`/twindata/${feature.properties.featureId}`, {
              method: "GET"
            });
            var content = await rawResponse.json();
            if (content.room.length != 0) {
              document.getElementById('no-twin-data').style = "display:none";
              document.getElementById('twin-data').style = "";
  
              document.getElementById('twin-data-id').innerHTML = content.room[0].$dtId;
              document.getElementById('twin-data-name').innerHTML = content.room[0].roomName;
              document.getElementById('twin-data-temperature').innerHTML = content.room[0].temperature;
              document.getElementById('twin-data-humidity').innerHTML = content.room[0].humidity;
              document.getElementById('twin-data-occupancy').innerHTML = content.room[0].occupancy;
              document.getElementById('twin-data-threshold').innerHTML = content.room[0].co2Threshold;
              twinID = content.room[0].$dtId;

              //update modal value input
              document.getElementById('input-threshold-red-carbon-dioxide').value = content.room[0].co2ThresholdRed;
              document.getElementById('input-threshold-yellow-carbon-dioxide').value = content.room[0].co2ThresholdYellow;
            } else {
              document.getElementById('no-twin-data').style = "";
              document.getElementById('twin-data').style = "display:none";
            };
          }
          
      }, []);
  });
  map.controls.add([
    new atlas.control.ZoomControl(),
    new atlas.control.CompassControl(),
    new atlas.control.PitchControl(),
    new atlas.control.StyleControl()
  ], {
    position: "bottom-right"
  });
}

CreateIndoorMap(statesetID);


const sendNotification = (message) => {
  var myToast = Toastify({
      text: message,
      duration: 5000
    });
 myToast.showToast();
}

//send C2D message to the backend
const sendC2DMessage = async () => {
  var endpoint = `/message?id=${twinID}&thresholdred=${document.getElementById('input-threshold-red-carbon-dioxide').value}&thresholdyellow=${document.getElementById('input-threshold-yellow-carbon-dioxide').value}`;

  var rawResponse = await fetch(endpoint, {
    method: "POST"
  });
  var content = await rawResponse.json();
  console.log(content.message);
  document.getElementById('c2d-modal').classList.toggle('is-active');
  sendNotification(content.message);

}