export default `

var HordesWalletResponses = {}
var SatsConnectNamespace = 'sats-connect:';

function registerWallet(wallet) {
  var callback = function callbackFunction({ register }) {
    return register(wallet);
  }
  window.dispatchEvent(new RegisterWalletEvent(callback));
  window.addEventListener('wallet-standard:app-ready', function(event) {
    var api = event.detail;
    callback(api);
  });

}

document.addEventListener('message', function(event) {
  var json;
  try {
    json = JSON.parse(event.detail);
  } catch (error) {
    window.ReactNativeWebView.postMessage(error.message);
  }
  if( json && json.response ) {
    window.ReactNativeWebView.postMessage("Inside webview, received post message: " + event.detail);
    HordesWalletResponses[json.id] = json.response;
  } else {
    window.ReactNativeWebView.postMessage("JSON error");
  }
}, false);

class RegisterWalletEvent extends Event {

  #detail;

  get detail() {
    return this.#detail;
  }

  get type() {
    return 'wallet-standard:register-wallet';
  }

  constructor(callback) {
    super('wallet-standard:register-wallet', {
      bubbles: false,
      cancelable: false,
      composed: false,
    });
    this.#detail = callback;
  }

  preventDefault() {
    throw new Error('preventDefault cannot be called');
  }

  stopImmediatePropagation() {
    throw new Error('stopImmediatePropagation cannot be called');
  }

  stopPropagation() {
    throw new Error('stopPropagation cannot be called');
  }
}

class HordesProvider {

  executeResponse(id) {
    return new Promise(function(resolve, reject) {
      var interval = setInterval(function () {
        if( HordesWalletResponses[id] ) {
          clearInterval(interval);
          resolve(HordesWalletResponses[id]);
        }
      }, 500);
    });
  }

  connect(params) {
    var id = Math.random();
    window.ReactNativeWebView.postMessage(JSON.stringify({ id: id, 'request': 'connect', params: params }));
    return this.executeResponse(id)
  }

  signMessage(params) {
    var id = Math.random();
    window.ReactNativeWebView.postMessage(JSON.stringify({ id: id, 'request': 'signMessage', params: params }));
    return this.executeResponse(id)
  }

  signTransaction(params) {
    var id = Math.random();
    window.ReactNativeWebView.postMessage(JSON.stringify({ id: id, 'request': 'signTransaction', params: params }));
    return this.executeResponse(id)
  }

  call(request) {
    throw new Error('Method not implemented.');
  }

}

class SatsConnectWallet {

    #version = '1.0.2';
    #name = 'Hordes Wallet';
    #icon = 'data:image/png;base64,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Fi1aJOPGjTODDg9efJ5XEgEn0Gm9ooDglW94ETuyi/r2S/VmELMee/fuNedEFyPzcCLQGXTxDXAUy1cK5xilHcU+hkBnUdR2QYoter7lJfGc8m2Lq/8j0K6UZbleFCDQXmRnpa4UINCulGW5XhQg0F5kZ6WuFCDQrpRluV4UINBeZGelrhQg0K6UZbleFCDQXmRnpa4UINCulGW5XhQg0F5kZ6WuFCDQrpRluV4UINBeZGelrhQg0K6UZbleFCDQXmRnpa4UINCulGW5XhQg0F5kZ6WuFCDQrpRluV4UINBeZGelrhQg0K6UZbleFCDQXmRnpa4UINCulGW5XhQg0F5kZ6WuFCDQrpRluV4UINBeZGelrhQg0K6UZbleFCDQXmRnpa4UINCulGW5XhQg0F5kZ6WuFCDQrpRluV4UINBeZGelrhQg0K6UZbleFCDQXmRnpa4UINCulGW5XhQg0F5kZ6WuFCDQrpRluV4UINBeZGelrhQg0K6UZbleFCDQXmRnpa4UINCulGW5XhQg0F5kZ6WuFCDQrpRluV4UINBeZGelrhQg0K6UZbleFCDQXmRnpa4UINCulGW5XhQg0F5kZ6WuFCDQrpRluV4UINBeZGelrhQg0K6UZbleFPgPu+1YxqSD5NcAAAAASUVORK5CYII=';
    #provider;

    get version() {
      return this.#version;
    }

    get name() {
      return this.#name;
    }

    get icon() {
      return this.#icon;
    }

    get chains() {
      return ['bitcoin:mainnet'];
    }

    get features() {
      return {
        [SatsConnectNamespace]: {
          provider: this.#provider,
        }
      };
    }

    get accounts() {
      return [];
    }

    constructor(provider) {
      if( new.target === SatsConnectWallet) {
        Object.freeze(this);
      }
      this.#provider = provider;
    }
}

registerWallet(new SatsConnectWallet(new HordesProvider()));
`
