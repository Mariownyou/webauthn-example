from flask import Flask, render_template, request, jsonify
from webauthn import verify_registration_response
import uuid


app = Flask(__name__)


@app.route('/')
def home():
	return render_template('index.html')


@app.route('/challenge')
def challenge():
    random = str(uuid.uuid4())
    return jsonify(challenge=random)


@app.route('/script.js')
def script():
    return app.send_static_file('script.js')


from base64 import urlsafe_b64decode, urlsafe_b64encode


def base64url_to_bytes(val):
    return urlsafe_b64decode(f"{val}===")


key = None
id = None
transports = None

@app.route('/webauthn/login', methods=['GET'])
def login():
    key_str = urlsafe_b64encode(key).decode()
    id_str = urlsafe_b64encode(id).decode()
    resp = jsonify(key=key_str, id=id_str, transports=transports)
    print(key_str, id_str)
    return resp


@app.route('/webauthn/register', methods=['POST'])
def register():
    data = request.get_json()
    print(data)

    registration_verification = verify_registration_response(
        credential=data,
        expected_challenge=b'random',
        expected_origin='http://localhost:8000',
        expected_rp_id="localhost",
    )

    assert registration_verification.credential_id == base64url_to_bytes(data['id'])
    print(registration_verification.credential_public_key)

    global key
    global id
    global transports
    key = registration_verification.credential_public_key
    id = registration_verification.credential_id
    transports = data['response']['transports']

    return jsonify(success=True)
