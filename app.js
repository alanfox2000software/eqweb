$(document).ready(function() {

    // 1. 初始化 Leaflet 地圖
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const MY_WORKER_URL = 'https://eqweb.alanfox2000software.workers.dev/fetchData';

    // 2. 💡 你可以在這裡自由更換想查詢的自訂參數！
    const queryConfig = {
        time: 'month',              // hour, day, week, month, all
        mg: 'All',                  // All, 2, 3, 4, 5, 6, 7, 8
        type: 'USGS',               // USGS, EMSC, CWB, CEIC, All ... 
        
        // 區域範圍參數（若為世界 World 則填空字串 "" 即可）
        // 例如亞洲：'&filter_GEN_lat=-10.0&filter_GEN_lon=26.0&filter_LEN_lat=80.0&filter_LEN_lon=180.0'
        regionParams: '' 
    };

    async function fetchEarthquakeData() {
        try {
            // 將自訂參數打包發送給 Worker 後端
            const response = await fetch(MY_WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(queryConfig) 
            });

            if (!response.ok) {
                throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
            }

            const data = await response.json();
            
            if (data && data.status === 'error') {
                $('#list-container').html(`<p style="color:orange;">⚠️ ${data.message}</p>`);
                return;
            }

            if (data && data.status === 'success' && data.result) {
                renderData(data.result);
            } else {
                $('#list-container').text('目前查無資料或格式不符。');
            }

        } catch (error) {
            console.error('請求失敗:', error);
            $('#list-container').html(`<p style="color:red; font-weight:bold;">❌ 無法載入數據：${error.message}</p>`);
        }
    }

    // 3. 數據渲染函數
    function renderData(eqList) {
        const $listContainer = $('#list-container').empty(); 

        $.each(eqList, function(index, eq) {
            const marker = L.marker([eq.lat, eq.lon]).addTo(map);
            marker.bindPopup(`
                <b>${eq.region || eq.regionEn || '未知區域'}</b><br>
                震級：M ${eq.mg}<br>
                深度：${eq.depth} km<br>
                數據源：${eq.type || '未知'}<br>
                時間：${eq.dateTime || ''}
            `);

            const $item = $('<div></div>')
                .addClass('eq-item')
                .html(`
                    <p><span class="mg-badge">M ${eq.mg}</span> <b>${eq.region || eq.regionEn || '未知區域'}</b></p>
                    <small>數據源: ${eq.type || ''} | 深度: ${eq.depth}km</small>
                `);
            
            $item.on('click', function() {
                map.setView([eq.lat, eq.lon], 5);
                marker.openPopup();
            });

            $listContainer.append($item);
        });
    }

    // 執行
    fetchEarthquakeData();
});