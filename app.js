$(document).ready(function() {

    // 1. 初始化 Leaflet 地圖
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 💡 關鍵修正：完全不要寫死網址，直接用相對路徑！
    // 當網頁在線上運行時，會自動變成 https://your-domain.com/fetchData
    const MY_WORKER_URL = '/fetchData';

    async function fetchEarthquakeData() {
        try {
            // 向同網域下的 functions/fetchData.js 發送 POST 請求
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
            $('#list-container').html(`
                <p style="color:red; font-weight:bold;">❌ 無法載入地震數據</p>
                <p style="font-size:12px; color:#666;">請確認您的程式碼已推送到 GitHub 並由 Cloudflare Pages 編譯完成。</p>
            `);
        }
    }

    // 3. 數據渲染函數保持不變
    function renderData(eqList) {
        const $listContainer = $('#list-container').empty(); 

        $.each(eqList, function(index, eq) {
            const marker = L.marker([eq.lat, eq.lon]).addTo(map);
            marker.bindPopup(`<b>${eq.region || eq.regionEn || '未知'}</b><br>震級：M ${eq.mg}<br>深度：${eq.depth} km`);

            const $item = $('<div></div>')
                .addClass('eq-item')
                .html(`<p><span class="mg-badge">M ${eq.mg}</span> <b>${eq.region || eq.regionEn || '未知'}</b></p>`);
            
            $item.on('click', function() {
                map.setView([eq.lat, eq.lon], 5);
                marker.openPopup();
            });

            $listContainer.append($item);
        });
    }

    fetchEarthquakeData();
});