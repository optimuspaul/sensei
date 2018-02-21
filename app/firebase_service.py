import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from firebase_admin import firestore



class FirebaseService():
  
  def __init__(self, databaseURL, cert_path):
    cred = credentials.Certificate(cert_path)
    firebase_admin.initialize_app(cred, options={
        'databaseURL': databaseURL
    })
    self.db = firebase_admin.firestore.client();

