  const { Client } = require('@elastic/elasticsearch');

let client = null;

function getElasticClient() {

   if(client){

      return client;

   }

   const cloudId =
   process.env.ELASTIC_CLOUD_ID;

   if(!cloudId){

      throw new Error(
         "ELASTIC_CLOUD_ID missing. Check .env file"
      );

   }

   if(process.env.ELASTIC_API_KEY){

      client = new Client({

         cloud:{
            id:cloudId
         },

         auth:{
            apiKey:
            process.env.ELASTIC_API_KEY
         }

      });

      console.log(
         "Elastic connected (API key)"
      );

      return client;

   }

   if(

      process.env.ELASTIC_USERNAME &&
      process.env.ELASTIC_PASSWORD

   ){

      client = new Client({

         cloud:{
            id:cloudId
         },

         auth:{
            username:
            process.env.ELASTIC_USERNAME,

            password:
            process.env.ELASTIC_PASSWORD
         }

      });

      console.log(
         "Elastic connected (username/password)"
      );

      return client;

   }

   throw new Error(
      "Elastic credentials missing in .env"
   );

}

async function checkElasticConnection(){

   const elastic =
   getElasticClient();

   try{

      const info =
      await elastic.info();

      return{

         status:"connected",

         cluster:
         info.cluster_name

      };

   }
   catch(err){

      console.error(
         "Elastic connection failed:",
         err.message
      );

      return{

         status:"error",

         error:
         err.message

      };

   }

}

module.exports = {

   getElasticClient,

   checkElasticConnection

};