// 💡 這裡直接改成你的 Cloudflare 網址加上 /fetchData 路由
const MY_WORKER_URL = 'https://eqweb.alanfox2000software.workers.dev/fetchData';

async function fetchEarthquakeData() {
    try {
        const response = await fetch(MY_WORKER_URL, {
            method: 'POST'
        });
        const data = await response.json();
        if (data && data.status === 'success' && data.result) {
            renderData(data.result);
        }
    } catch (error) {
        console.error('請求失敗:', error);
    }
}