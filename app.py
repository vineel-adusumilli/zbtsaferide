from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
  return render_template('index.html', script='script.js')

@app.route('/campus')
def campus():
  return render_template('index.html', script='campus.js')

