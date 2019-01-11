import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';

import { SignupPage } from '../signup/signup';

import firebase from 'firebase';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  email: string =""
  password: string =""

  constructor(public navCtrl: NavController, public toastCtrl: ToastController) {

  }

  login() {
    firebase.auth()
    .signInWithEmailAndPassword(this.email, this.password)
    .then((data) => {
      this.toastCtrl.create({
        message: "Welcome " + data.user.displayName,
        duration: 3000
      }).present()
    }).catch((error) => {
      this.toastCtrl.create({
        message: error.message,
        duration: 3000
      }).present()
    })
  }

  goToSignUp() {
    this.navCtrl.push(SignupPage)
  }

}
