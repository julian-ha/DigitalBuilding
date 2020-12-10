using System;
using System.Collections.Generic;
using System.Text;

namespace DigitalTwins
{
    public class models
    {

        //for relationship.json
        public class relationshipData
        {
            public List<relationship> data { get; set; }
        }
      public class relationship
        {
            public string sourceID { get; set; }
            public string targetID { get; set; }
            public string relName { get; set; }
        }


        //for twin.json
        public class twinData
        {
            public List<twins> data { get; set; }
        }
        public class twins
        {
            public string modelID { get; set; }
            public string ID { get; set; }
            public List<properties> properties { get; set; }
        }
        public class properties
        {
            public string name { get; set; }
            public dynamic value { get; set; }
        }
    }
}
