import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from firebase_admin import firestore
from firebase_admin import auth



class FirebaseService():
  
  def __init__(self, databaseURL, creds):
    if creds.get('private_key'):
        cred = credentials.Certificate(creds)
        firebase_admin.initialize_app(cred, options={
            'databaseURL': databaseURL
        })
        self.db = firebase_admin.firestore.client();
        self.auth = firebase_admin.auth;
    


