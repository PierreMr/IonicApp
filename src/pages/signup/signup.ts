import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, AlertController } from 'ionic-angular';

import firebase from 'firebase';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
})
export class SignupPage {

  name: string = ""
  email: string = ""
  password: string = ""


  constructor(public navCtrl: NavController, public navParams: NavParams, public ToastCtrl: ToastController, public AlertCtrl: AlertController) {
  }

  signUp() {
    firebase.auth()
    .createUserWithEmailAndPassword(this.email, this.password)
    .then((data) => {
      let newUser: firebase.User = data.user
      newUser.updateProfile({
        displayName: this.name,
        photoURL: ""
      })
      .then(() => {
        this.AlertCtrl.create({
          title: "Account created",
          message: "Your account has been created successfully.",
          buttons: [
            {
              text: "OK",
              handler: () => {

              }
            }
          ]
        }).present()
      })
      .catch((error) => {})
    })
    .catch((error) => {
      this.toastCtrl.create({
        message: error.message,
        duration: 3000
      }).present()
    })
  }

  goBack() {
    this.navCtrl.pop()
  }

}
