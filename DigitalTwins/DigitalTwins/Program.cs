using System;
using Azure.DigitalTwins.Core;
using Azure.Identity;
//using System.Text.Json;
//using System.Text.Json.Serialization;
using Azure.DigitalTwins.Core.Serialization;
using Newtonsoft.Json;


using System.Threading.Tasks;
using System.IO;
using System.Collections.Generic;
using Azure;

namespace DigitalTwins
{
    class Program
    {
        static async Task Main(string[] args)
        {

            //Constant Declaration 
            string clientId = "ccdae75c-5020-47aa-a6cc-070ae6ae89b9";
            string tenantId = "be46afd0-8a22-40d5-8e63-b9f3282bcb2e";
            string adtInstanceUrl = "https://TwinPB.api.weu.digitaltwins.azure.net";

            //Login 
            var credentials = new InteractiveBrowserCredential(tenantId, clientId);
            DigitalTwinsClient client = new DigitalTwinsClient(new Uri(adtInstanceUrl), credentials);
            Console.WriteLine(client);
            Console.WriteLine($"Service client created – ready to go");


            //await createModels(client, "models");




            //create twin instances
            string JsonTwins = File.ReadAllText("data/twin.json");
            models.twinData twins = JsonConvert.DeserializeObject<models.twinData>(JsonTwins);
          
            foreach (var twin in twins.data)
            {
                await CreateTwin(client, twin);
            }


            
            //create Relationships
            string JsonRelationships = File.ReadAllText("data/relationship.json");
            models.relationshipData relationships = JsonConvert.DeserializeObject<models.relationshipData>(JsonRelationships);
   
            foreach (var relationship in relationships.data)
            {
              
                await CreateRelationship(client, relationship);
            }


            //await queryTwin(client, "SELECT * FROM DigitalTwins");
            //await queryTwin(client, "SELECT CT  FROM digitaltwins T JOIN CT RELATED T.hasRooms WHERE T.$dtId = 'FirstFloor'");



        }

        public async static Task createModels(DigitalTwinsClient client, string folderName)
        {
            Console.WriteLine("Accessing Models");
            List<string> modelList = new List<string>();
            foreach (string file in Directory.GetFiles(folderName))
            {
                modelList.Add(File.ReadAllText(file));
                try
                {
                    await client.CreateModelsAsync(modelList);
                }
                catch (RequestFailedException rex)
                {
                    Console.WriteLine($"Load model: {rex.Status}:{rex.Message}");
                }
            }

 

            Console.WriteLine("Model list...");
            AsyncPageable<ModelData> modelDataList = client.GetModelsAsync();
            await foreach (ModelData md in modelDataList)
            {
                Console.WriteLine($"Type name: {md.DisplayName}: {md.Id}");
            }
        }
        public async static Task CreateTwin(DigitalTwinsClient client, models.twins twin)
        {
            BasicDigitalTwin digitalTwin = new BasicDigitalTwin();

            digitalTwin.Metadata.ModelId = twin.modelID;
            digitalTwin.Id = twin.ID;

            foreach (var property in twin.properties)
            {
          
                digitalTwin.CustomProperties.Add(Convert.ToString(property.name), property.value);
                
            }
            try
            {
               
                await client.CreateDigitalTwinAsync(twin.ID, System.Text.Json.JsonSerializer.Serialize(digitalTwin));
                Console.WriteLine($"created: {digitalTwin.Id}");
            }
            catch (RequestFailedException rex)
            {
                Console.WriteLine($"Create relationship error: {rex.Status}:{rex.Message}");
            }
        }

        public async static Task CreateRelationship(DigitalTwinsClient client, models.relationship rel)
        {
            var relationship = new BasicRelationship
            {
                TargetId = rel.targetID,
                Name = rel.relName
            };

            try
            {
                string relId = $"{rel.sourceID}-{rel.relName}->{rel.targetID}";
                await client.CreateRelationshipAsync(rel.sourceID, relId, System.Text.Json.JsonSerializer.Serialize(relationship));
                Console.WriteLine($"Created relationship {rel.sourceID} -> {rel.targetID} successfully");
            }
            catch (RequestFailedException rex)
            {
                Console.WriteLine($"Create relationship error: {rex.Status}:{rex.Message}");
            }
        }


 


        public async static Task ListRelationships(DigitalTwinsClient client, string srcId)
        {
            try
            {
                AsyncPageable<string> results = client.GetRelationshipsAsync(srcId);
                Console.WriteLine($"Twin {srcId} is connected to:");
                await foreach (string rel in results)
                {
                    //var brel = JsonSerializer.Deserialize<BasicRelationship>(rel);
                    //Console.WriteLine($" -{brel.Name}->{brel.TargetId}");
                }
            }
            catch (RequestFailedException rex)
            {
                Console.WriteLine($"Relationship retrieval error: {rex.Status}:{rex.Message}");
            }
        }


        //Testing SQL Queries for Digital Twin Instance

        public async static Task queryTwin(DigitalTwinsClient client, string sql)
        {
            AsyncPageable<string> result = client.QueryAsync(sql);
            await foreach (string twin in result)
            {
                object jsonObj = JsonConvert.DeserializeObject<object>(twin);
                //string prettyTwin = JsonSerializer.Serialize(jsonObj, new JsonSerializerOptions { WriteIndented = true });
                Console.WriteLine(jsonObj);
                Console.WriteLine("---------------");
            }
        }
    }
}
