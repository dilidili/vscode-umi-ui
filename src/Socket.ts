import * as SockJS from 'sockjs-client';
import { EventEmitter } from 'vscode';

enum SocketState {
  Offline,
  Online,
}

export class Socket {
  private _sock: any;
  private _sockTimeout: NodeJS.Timeout | undefined;
  private _batchSend: string[];
  private _state: SocketState;
  private _event = new EventEmitter<string>();

  constructor(private _serverUrl: string) {
    this.init();

    this._batchSend = [];
    this._state = SocketState.Offline;
  }

  send(message: Object | string) {
    this._batchSend.push(typeof message === 'string' ? message : JSON.stringify(message));

    if (this._state === SocketState.Online) {
      this.flush();
    }
  }

  fetch(message: Object | string, responseType: string): Promise<string> {
    this.send(message);

    return new Promise((c) => {
      const disposable = this._event.event((res) => {
        if (typeof res === 'string' && res.indexOf(responseType) >= 0) {
          disposable.dispose();
          c(res);
        }
      });
    });
  }

  flush() {
    this._batchSend.forEach(v => this._sock.send(v));
    this._batchSend = [];
  }

  reconnect() {
    this._sockTimeout = undefined;
    this.init();
  }

  init() {
    if (!this._sockTimeout) {
      console.log('initSocket');

      if (!this._sock) {
        try {
          this._sock = new SockJS(this._serverUrl);
          this._sock.onopen = () => {
            this._state = SocketState.Online;
            this.flush();
            console.log('connect');
          };

          this._sock.onclose = () => {
            this._sock = null;
            this._state = SocketState.Offline;
            this._sockTimeout = setTimeout(() => this.reconnect(), 3000);
            console.log('close');
          };

          this._sock.onmessage = (e: any) => {
            this._event.fire(e.data);
            console.log('message', e.data);
          };
        } catch (err) {
          this._state = SocketState.Offline;
          this._sock = null;
          this._sockTimeout = setTimeout(this.reconnect, 3000);
          console.log(err);
        }
      }
    }
  }
}