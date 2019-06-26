class Socket {
  constructor(url, userId, getMessage) {
    this.wsUrl = url
    this.ws = null
    this.getMessage = getMessage
    this.connectMessage = { // 连接包
    }
    this.heartBeatMessage = { // 心跳包
    }
    this.lockReconnect = false // 避免重复连接
    this.tt = ''
    this.heartCheck = {
      timeout: 15 * 1000,
      timeoutObj: null,
      serverTimeoutObj: null,
      start: () => {
        this.heartCheck.timeoutObj && clearTimeout(this.heartCheck.timeoutObj)
        this.heartCheck.serverTimeoutObj && clearTimeout(this.heartCheck.serverTimeoutObj)
        this.heartCheck.timeoutObj = setTimeout(() => {
          /*************这里发送一个心跳，后端收到后，返回一个心跳消息*******/
          this.ws.send(JSON.stringify(this.heartBeatMessage))
          this.heartCheck.serverTimeoutObj = setTimeout(() => {
            this.heartCheck.start()
          }, this.heartCheck.timeout * 2)
        }, this.heartCheck.timeout)
      }
    }
  }
  createWebSocket() {
    try {
      this.ws = new WebSocket(this.wsUrl)
      this.init()
    } catch (e) {
      console.log('catch')
      this.reconnect()
    }
  }
  init() {
    this.ws.onclose = () => {
      console.log('链接关闭')
      this.reconnect()
    }
    this.ws.onerror = () => {
      console.log('发生异常了')
      this.reconnect()
    }
    this.ws.onopen = () => {
      // 心跳检测重置
      this.ws.send(JSON.stringify(this.connectMessage))
      this.heartCheck.start()
    }
    this.ws.onmessage = (data) => {
      // 拿到任何消息都说明当前连接是正常的
      this.getMessage(JSON.parse(data.data))
    }
  }
  reconnect(url) { // 重连
    if (this.lockReconnect) {
      return
    }
    this.lockReconnect = true
    // 没连接上会一直重连，设置延迟避免请求过多
    this.tt && clearTimeout(this.tt)
    this.tt = setTimeout(() => {
      this.createWebSocket(url)
      this.lockReconnect = false
    }, 4000)
  }
}
