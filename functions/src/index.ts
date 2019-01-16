import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase)

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const updateLikesCount = functions.https.onRequest((request, response) => {
  console.log(request.body)

  const postId = request.body.postId  
  const userId = request.body.userId  
  const action = request.body.action

  admin.firestore().collection("posts").doc(postId).get()
  .then((data) => {
      let likesCount = data.data().likesCount || 0
      let likes = data.data().likes || []

      let updateData = {}

      if (action == "like") {
          updateData["likesCount"] = ++likesCount
          updateData[`likes.${userId}`] = true
      }
      else {
        updateData["likesCount"] = --likesCount
        updateData[`likes.${userId}`] = false
      }

      admin.firestore().collection("posts").doc(postId).update(updateData)
      .then(() => {
          response.status(200).send("Done")
      })
      .catch((error) => {
          response.status(error.code).send(error.message)
      })
  })
  .catch((error) => {
    response.status(error.code).send(error.message)
  })
})

export const updateCommentsCount = functions.firestore.document('comments/{commentId}').onCreate(async (event) => {
    let data = event.data()
    let postId = data.post

    let doc = await admin.firestore().collection("posts").doc(postId).get()

    if (doc.exists) {
        let commentsCount = doc.data().commentsCount || 0
        commentsCount++

        await admin.firestore().collection("posts").doc(postId).update({
            "commentsCount": commentsCount
        })

        return true
    }
    else {
        return false
    }
})


