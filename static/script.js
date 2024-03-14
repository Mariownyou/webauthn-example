const randomStringFromServer = "random";
const publicKeyCredentialCreationOptions = {
  challenge: Uint8Array.from(
      randomStringFromServer, c => c.charCodeAt(0)),
  rp: {
      name: "Duo Security",
      id: "localhost"
  },
  user: {
      id: Uint8Array.from(
          "UZSL85T9AFC", c => c.charCodeAt(0)),
      name: "lee@webauthn.guide",
      displayName: "Lee",
  },
  pubKeyCredParams: [{alg: -7, type: "public-key"}],
  timeout: 60000,
  attestation: "direct"
};

console.log(publicKeyCredentialCreationOptions);

const register = document.querySelector("[type='submit']");

register.addEventListener("click", async () => {
  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions
  });
  console.log(credential);

  const rawId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
  const attestationBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject)));
  console.log(attestationBase64);
  const clientDataBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON)));

  const body = {
    id: credential.id,
    rawId,
    response: {
      clientDataJSON: clientDataBase64,
      attestationObject: attestationBase64,
      transports: credential.response.getTransports(),
    },
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
    authenticatorAttachment: credential.authenticatorAttachment,
  }

  const response = await fetch("http://localhost:8000/webauthn/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  console.log(response.status);
});

const login = document.querySelector("[type='button']");
login.addEventListener("click", async () => {

  const resp = await fetch("http://localhost:8000/webauthn/login", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  const {id, transports } = await resp.json();
  console.log(id);


  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: Uint8Array.from(
          randomStringFromServer, c => c.charCodeAt(0)),
      allowCredentials: [
        {
          type: "public-key",
          id: Uint8Array.from(id, c => c.charCodeAt(0)),
          // id: id,
          transports: transports
        }
      ],
      "authenticatorAttachment": "platform",
      timeout: 60000,
    }
  })

  console.log(credential);
});
