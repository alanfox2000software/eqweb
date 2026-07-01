$(document).ready(function() {

    // 1. 初始化 Leaflet 地圖
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 2. 指向你的專屬 Cloudflare Worker API 路由
    const MY_WORKER_URL = 'https://eqweb.alanfox2000software.workers.dev/fetchData';

    async function fetchEarthquakeData() {
        try {
            // 前端只需要發送一個簡單的 POST 請求給 Worker 即可
            const response = await fetch(MY_WORKER_URL, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
            }

            const data = await response.json();
            
            // 驗證回傳格式，並將 result 陣列丟給渲染函數
            if (data && data.status === 'success' && data.result) {
                renderData(data.result);
            } else {
                $('#list-container').text('資料格式不符，請確認 Worker 後端狀況。');
            }

        } catch (error) {
            console.error('請求失敗:', error);
            $('#list-container').html(`<p style="color:red; font-weight:bold;">❌ 無法載入地震數據：${error.message}</p>`);
        }
    }

    // 3. 數據渲染函數
    function renderData(eqList) {
        const $listContainer = $('#list-container');
        $listContainer.empty(); // 清空「載入中」提示

        $.each(eqList, function(index, eq) {
            // 在 Leaflet 地圖上標註經緯度紅點
            const marker = L.marker([eq.lat, eq.lon]).addTo(map);
            marker.bindPopup(`
                <b>${eq.region || eq.regionEn || '未知區域'}</b><br>
                震級：M ${eq.mg}<br>
                深度：${eq.depth} km<br>
                時間：${eq.dateTime || ''}
            `);

            // 動態建立側邊欄列表項目
            const $item = $('<div></div>')
                .addClass('eq-item')
                .html(`
                    <p><span class="mg-badge">M ${eq.mg}</span> <b>${eq.region || eq.regionEn || '未知區域'}</b></p>
                    <small>深度: ${eq.depth}km | 時間: ${eq.dateTime || ''}</small>
                `);
            
            // 點擊列表項目時，地圖自動平移並開啟彈出視窗
            $item.on('click', function() {
                map.setView([eq.lat, eq.lon], 5);
                marker.openPopup();
            });

            $listContainer.append($item);
        });
    }

    // 啟動獲取數據
    fetchEarthquakeData();
});