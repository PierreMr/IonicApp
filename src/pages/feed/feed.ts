import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, ToastController, ActionSheetController, AlertController, ModalController } from 'ionic-angular';

import firebase from 'firebase';
import moment from 'moment';
import { LoginPage } from '../login/login';
import { CommentsPage } from '../comments/comments';

import { Camera, CameraOptions } from '@ionic-native/camera';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'page-feed',
  templateUrl: 'feed.html',
})
export class FeedPage {

  text: string = ""
  posts: any[] = []
  postsNumber: number = 10;
  cursor: any;
  infiniteEvent: any;
  image: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, private loadingCtrl: LoadingController, private toastCtrl: ToastController, private camera: Camera, private httpClient: HttpClient, private actionSheetCtrl: ActionSheetController, private alertCtrl: AlertController, private modalCtrl: ModalController) {

    this.getPosts()
  }

  getPosts() {  
    this.posts = []

    let loading = this.loadingCtrl.create({
      content: "Loading feed..."
    })
    loading.present()    

    let query = firebase.firestore().collection("posts")
    .orderBy("created", "desc")
    .limit(this.postsNumber)
    
    query.onSnapshot((snapshot) => {
      let changedDocs = snapshot.docChanges()

      changedDocs.forEach((change) => {
        if (change.type == "added") {

        }

        if (change.type == "modified") {
          for(let i = 0; i < this.posts.length; i++) {
            if(this.posts[i].id == change.doc.id) {
              this.posts[i] = change.doc
            }
          }
        }

        if (change.type == "removed") {
          
        }
      })
    })

    query.get()
    .then((docs) => {
      docs.forEach((doc) => {
        this.posts.push(doc)
      })

      loading.dismiss()

      this.cursor = this.posts[this.posts.length - 1]

      console.log(this.posts)
    })
    .catch((error) => {
      console.log(error)
    })
  }

  loadMorePosts(event) {
    firebase.firestore().collection("posts")
    .orderBy("created", "desc")
    .startAfter(this.cursor)
    .limit(this.postsNumber)
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        this.posts.push(doc)
      })

      console.log(this.posts)

      if (docs.size < this.postsNumber) {
        event.enable(false)
        this.infiniteEvent = event
      }
      else {
        event.complete()
        this.cursor = this.posts[this.posts.length - 1]
      }
    })
    .catch((error) => {
      console.log(error)
    })
  }

  refresh(event) {
    this.posts = []

    this.getPosts()

    if (this.infiniteEvent) {
      this.infiniteEvent.enable(true)
    }

    event.complete()
  }

  post() {
    firebase.firestore().collection("posts").add({
      text: this.text,
      created: firebase.firestore.FieldValue.serverTimestamp(),
      owner: firebase.auth().currentUser.uid,
      owner_name: firebase.auth().currentUser.displayName
    })
    .then((doc) => {
      if (this.image) {
        this.upload(doc.id)
      }

      this.text = ""
      this.image = undefined

      this.toastCtrl.create({
        message: "Your post has been created successfully.",
        duration: 3000
      }).present()

      this.getPosts()
    })
    .catch((error) => {
      console.log(error)
    })
  }

  ago(time) {
    let difference = moment(time).diff(moment())
    return moment.duration(difference).humanize()
  }

  logout() {
    firebase.auth().signOut()
    .then(() => {
      this.toastCtrl.create({
        message: "You have been logged out successfully.",
        duration: 3000
      }).present()
      this.navCtrl.setRoot(LoginPage)
    })
  }

  addPhoto() {
    this.launchCamera()
  }

  launchCamera() {
    let options: CameraOptions = {
      quality: 100,
      sourceType: this.camera.PictureSourceType.CAMERA,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.PNG,
      mediaType: this.camera.MediaType.PICTURE,
      correctOrientation: true,
      targetHeight: 512,
      targetWidth: 512,
      allowEdit: true
    }

    this.camera.getPicture(options)
    .then((base64Image) => {
      console.log(base64Image)
      this.image = "data:image/png;base64," + base64Image
    })
    .catch((error) => {
      console.log(error)
    })
  }

  upload(name: string) {

    return new Promise((resolve, reject) => {

      let loading = this.loadingCtrl.create({
        content: "Uploading image..."
      })
      let ref = firebase.storage().ref("postImages/" + name)

      let uploadTask = ref.putString(this.image.split(',')[1], "base64")
  
      uploadTask.on("state_changed", (taskSnapshot: any) => {
        console.log(taskSnapshot)

        let percentage = taskSnapshot.bytesTransferred / taskSnapshot.totalBytes * 100
        loading.setContent("Uploaded " + percentage + "% ...")
      },
      (error) => {
        console.log(error)
      },
      () => {
        console.log("Upload completed")
  
        uploadTask.snapshot.ref.getDownloadURL()
        .then((url) => {
          firebase.firestore().collection("posts").doc(name).update({
            image: url
          })
          .then(() => {
            loading.dismiss()
            resolve()
          })
          .catch((error) => {
            loading.dismiss()
            reject()
          })
        })
        .catch((error) => {
          loading.dismiss()
          reject()
        })
      })
    })
  }

  like(post) {
    let body = {
      postId: post.id,
      userId: firebase.auth().currentUser.uid,
      action: post.data().likes && post.data().likes[firebase.auth().currentUser.uid] == true ? "unlike" : "like"
    }

    let toast = this.toastCtrl.create({
      message: "Updating like... Please wait"
    })
    toast.present()

    this.httpClient.post("https://us-central1-udemyfeedly.cloudfunctions.net/updateLikesCount", JSON.stringify(body), {
      responseType: "text"
    }).subscribe((data) => {
      toast.setMessage("Like updated.")
      setTimeout(() => {
        toast.dismiss()
      }, 3000)

      console.log(data)
    },
    (error) => {
      toast.setMessage("An error has occured. Please try again later.")
      setTimeout(() => {
        toast.dismiss()
      }, 3000);

      console.log(error)      
    })
  }

  comment(post) {
    this.actionSheetCtrl.create({
      buttons: [
        {
          text: "View all comments",
          handler: () => {
            this.modalCtrl.create(CommentsPage, {
              "post": post
            }).present()
          }
        },
        {
          text: "New comment",
          handler: () => {
            this.alertCtrl.create({
              title: "New comment",
              message: "Type your comment",
              inputs: [
                {
                  name: "comment",
                  type: "text"
                }
              ],
              buttons: [
                {
                  text: "Cancel"
                },
                {
                  text: "Post",
                  handler: (data) => {
                    if (data.comment) {
                      firebase.firestore().collection("comments").add({
                        text: data.comment,
                        post: post.id,
                        owner: firebase.auth().currentUser.uid,
                        owner_name: firebase.auth().currentUser.displayName,
                        created: firebase.firestore.FieldValue.serverTimestamp()
                      })
                      .then((doc) => {
                        this.toastCtrl.create({
                          message: "Comment has been posted successfully",
                          duration: 3000
                        }).present()
                      })
                      .catch((error) => {
                        this.toastCtrl.create({
                          message: error.message,
                          duration: 3000
                        }).present()
                      })
                    }
                  }
                }
              ]
            }).present()
          }
        }
      ]
    }).present()
  }

}
