import flask
import pymongo

client = pymongo.MongoClient('mongodb://192.168.99.100:27017/')
db = client.ranker

app = flask.Flask(__name__)
app.config["DEBUG"] = True

@app.route('/', methods=['GET'])
def home():
    return "<h1>Distant Reading Archive</h1><p>This site is a prototype API for distant reading of science fiction novels.</p>"

@app.route('/api/game', methods=['POST'])
def game():
    body = flask.request.json
    if not body:
        abort(400)
    map(lambda item: item )
    db.items.insert_many([
        body[items]
    ])
    print(flask.request)
    print(flask.request.json)
    return "aa", 201

app.run(debug = True)
