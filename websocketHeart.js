class WebsocketHeart {
    constructor({
        url,
        protocols,
        pingTimeout = 15000,
        pongTimeout = 10000,
        pingMsg = { cmd: 13, hbbyte: 1 },
        repeatLimit = 5,
        reconnectTimeout = 2000
    }) {
        this.options = {
            url: url,
            protocols,
            pingTimeout: pingTimeout,
            pongTimeout: pongTimeout,
            reconnectTimeout: reconnectTimeout,
            pingMsg: pingMsg,
            repeatLimit: repeatLimit
        };

        // websocket 实例
        this.ws = null;
        this.repeatCount = 0;
        this.createWebSocket();
    }

    createWebSocket() {
        if (this.options.protocols) {
            this.ws = new WebSocket(this.options.url, this.options.protocols);
        } else {
            this.ws = new WebSocket(this.options.url);
        }

        this.initEvent();
    }

    /**
     * 初始化websocket 事件
     */

    initEvent() {
        this.ws.onopen = () => {
            this.repeatCount = 0;
            this.heartReset();
            this.heartCheck();
        };

        this.ws.onmessage = () => {
            this.heartReset();
            this.heartCheck();
        };

        this.ws.onclose = () => {
            this.reconnect();
        };

        this.ws.onerror = () => {
            this.reconnect();
        };
    }

    send(msg) {
        this.ws.send(msg);
    }

    heartCheck() {
        this.pingTimer = setTimeout(() => {
            this.ws.send(this.pingMsg);
            this.pongTimer = setTimeout(
                () => this.ws.close(),
                this.options.pongTimeout
            );
        }, this.options.pingTimeout);
    }

    heartReset() {
        clearTimeout(this.pingTimer);
        clearTimeout(this.pongTimer);
    }

    // 客户端主动断开连接
    close() {
        this.forbidReconnect = true;
        this.heartReset();
        this.ws.close();
    }

    // 超时重连
    reconnect() {
        if (this.options.repeatLimit && this.repeatCount >= this.repeatLimit) {
            return;
        }

        if (this.lock || this.forbidReconnect) return;

        this.lock = true;
        this.repeatCount++;

        setTimeout(() => {
            this.createWebSocket();
            this.lock = false;
        }, this.options.reconnectTimeout);
    }
}

export default WebsocketHeart;
