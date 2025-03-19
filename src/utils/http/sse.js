import {EventStreamContentType, fetchEventSource} from '@microsoft/fetch-event-source';

const SSE_CONFIG = {
    MAX_RETRIES: 5,          // 最大重试次数
    BASE_RETRY_DELAY: 5000,  // 基础重试间隔（毫秒）
    HEARTBEAT_TIMEOUT: 60000 // 心跳超时时间（毫秒）
};

const sse = (url, onMessage, onError) => {
    let retryCount = 0;
    let heartbeatTimer;
    let controller = null;

    const token = sessionStorage.getItem('Gmv-Token');
    if (!token) {
        const error = new Error('Missing authentication token');
        console.error('❌ SSE 启动失败:', error.message);
        onError?.(error);
        return null;
    }

    const resetHeartbeat = () => {
        clearTimeout(heartbeatTimer);
        heartbeatTimer = setTimeout(() => {
            console.warn('⌛ 心跳超时，主动断开连接');
            controller?.abort();
            reconnect(new Error('Heartbeat timeout'));
        }, SSE_CONFIG.HEARTBEAT_TIMEOUT);
    };

    const cleanup = () => {
        clearTimeout(heartbeatTimer);
        controller?.abort();
        console.log('🧹 清理 SSE 资源');
    };

    const startSSE = () => {
        controller = new AbortController();

        fetchEventSource(`/api${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Gmv-Token': token
            },
            signal: controller.signal,
            openWhenHidden: true,

            async onopen(response) {
                if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
                    console.log('✅ SSE 连接成功');
                    resetHeartbeat();
                    retryCount = 0;  // 重置重试计数器
                } else {
                    const error = new Error(`SSE 连接失败: ${response.status} ${response.statusText}`);
                    console.error('❌', error.message);
                    throw error;
                }
            },

            onmessage(event) {
                try {
                    console.info('🎯 收到 SSE 消息:', event.data);
                    const data = JSON.parse(event.data);
                    if (data.type === 'heartbeat') {
                        console.log('💓 收到心跳，重置检测');
                        resetHeartbeat();
                        return;
                    }
                    if (data.type === 'connect') {
                        console.log('💓 SSE 连接成功');
                        return;
                    }
                    onMessage?.(data);
                } catch (e) {
                    console.error('❌ 消息解析失败:', e);
                    onError?.(e);
                }
            },

            onerror(err) {
                console.error('❌ SSE 连接错误:', err);
                cleanup();
                onError?.(err);
                reconnect(err);
            },

            onclose() {
                console.log('🚪 SSE 连接正常关闭');
                cleanup();
                fetch('/api/sse/close', {method: 'POST'}).catch(console.error);
            }
        });
    };

    const reconnect = (err) => {
        if (retryCount >= SSE_CONFIG.MAX_RETRIES) {
            console.error(`⛔ 达到最大重试次数 (${SSE_CONFIG.MAX_RETRIES})，停止重连`);
            onError?.(new Error('Max retries reached'));
            return;
        }

        const delay = SSE_CONFIG.BASE_RETRY_DELAY * Math.pow(2, retryCount);
        retryCount++;

        console.log(`⏳ 将在 ${delay}ms 后尝试第 ${retryCount} 次重连...`);
        setTimeout(() => {
            startSSE(); // 正确递归调用
        }, delay);
    };

    startSSE();

    return {
        stop: cleanup
    };
};

export default sse;
