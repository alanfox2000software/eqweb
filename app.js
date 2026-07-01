// 💡 修改第 9 行左右的網址，精準指向你的 Workers 接口路徑
const MY_WORKER_URL = 'https://eqweb.alanfox2000software.workers.dev/fetchData';

async function fetchEarthquakeData() {
    try {
        const response = await fetch(MY_WORKER_URL, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.status === 'success' && data.result) {
            renderData(data.result);
        } else {
            $('#list-container').text('資料格式不符，請確認數據。');
        }

    } catch (error) {
        console.error('請求失敗:', error);
        $('#list-container').html(`<p style="color:red; font-weight:bold;">❌ 無法載入地震數據：${error.message}</p>`);
    }
}