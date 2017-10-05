const WS = require('ws');

class WSPromise {
  constructor(ws) {
    this.ws = ws;
  }

  open() {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WS.OPEN)
        resolve();

      this.ws.on("open", () => {
        resolve();
      });
    });
  }

  request(payload) {
    return new Promise((resolve, reject) => {
      this.ws.on("message", (data) => {
        resolve(JSON.parse(data));
      });

      // TODO: error handling

      this.ws.send(JSON.stringify(payload));
    });
  }

  receive() {
    return new Promise((resolve, reject) => {
      this.ws.on("message", (data) => {
        resolve(JSON.parse(data));
      });

      // TODO: timeout
    });
  }

  send(payload) {
    this.ws.send(JSON.stringify(payload));
  }

  close() {
    return this.ws.close();
  }
}

module.exports = WSPromise;
