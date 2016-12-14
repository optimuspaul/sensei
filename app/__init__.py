from flask import Flask, session, g, redirect, url_for, abort, render_template, flash
from flask import render_template
from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
Bootstrap(app)

# Define the database object to be imported by models and controllers
db = SQLAlchemy(app)
