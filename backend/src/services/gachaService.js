// Questions will come from Elastic later.
// For now we just return placeholder IDs.

function openPack(playerId){

   if(!playerId){

      throw new Error(
         "playerId required"
      );

   }

   // temporary placeholder pack
   // Elastic team will replace this

   const pack = [];

   for(let i=0;i<8;i++){

      pack.push({

         questionId:
         "q_"+Math.random()
         .toString(36)
         .substring(2,10),

         difficulty:
         ["easy","medium","hard"]
         [
            Math.floor(
               Math.random()*3
            )
         ]

      });

   }

   return {

      playerId,

      pack,

      openedAt:
      new Date().toISOString()

   };

}

module.exports = {

   openPack

};