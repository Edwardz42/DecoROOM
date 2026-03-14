function validateQuestionSet(
   questionIds
){

   if(
      !Array.isArray(
         questionIds
      )
   ){

      throw new Error(
         "Deck must be array"
      );

   }

   if(
      questionIds.length
      !== 8
   ){

      throw new Error(
         "Deck must contain 8 cards"
      );

   }

   return questionIds;

}

module.exports = {

   validateQuestionSet

};