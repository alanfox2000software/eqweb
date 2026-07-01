$(document).ready(function() {

    // 1. 初始化 Leaflet 地圖
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const MY_WORKER_URL = 'https://eqweb.alanfox2000software.workers.dev/fetchData';

    // 2. 💡 核心修正：從網址列 (URL Bar) 動態讀取自訂參數
    const urlParams = new URLSearchParams(window.location.search);

    // 如果網址列有傳參數就用網址列的，沒有就用預設值（例如預設 month, All, USGS, World）
    const queryConfig = {
        time: urlParams.get('time') || 'month',         // 可選：hour, day, week, month, all
        mg: urlParams.get('mg') || 'All',             // 可選：All, 2, 3, 4, 5, 6, 7, 8
        type: urlParams.get('type') || 'USGS',          // 可選：USGS, EMSC, CWB, CEIC, All ...
        region: urlParams.get('region') || 'World'      // 可選：Antarctica, Oceania, SouthAmerica, NorthAmerica, Africa, Europe, Asia, World
    };

    // 3. 根據網址列的 region 文字，自動對應你挖掘出來的經緯度範圍參數
    let regionParams = '';
    switch (queryConfig.region.toLowerCase()) {
        case 'antarctica':
            regionParams = '&filter_GEN_lat=-90.0&filter_GEN_lon=-180.0&filter_LEN_lat=-62.0&filter_LEN_lon=180.0';
            break;
        case 'oceania':
            regionParams = '&filter_GEN_lat=-47.0&filter_GEN_lon=110.0&filter_LEN_lat=30.0&filter_LEN_lon=180.0';
            break;
        case 'southamerica':
            regionParams = '&filter_GEN_lat=-54.0&filter_GEN_lon=-82.0&filter_LEN_lat=12.0&filter_LEN_lon=-34.0';
            break;
        case 'northamerica':
            regionParams = '&filter_GEN_lat=7.0&filter_GEN_lon=-170.0&filter_LEN_lat=80.0&filter_LEN_lon=-20.0';
            break;
        case 'africa':
            regionParams = '&filter_GEN_lat=-35.0&filter_GEN_lon=-17.0&filter_LEN_lat=37.0&filter_LEN_lon=51.0';
            break;
        case 'europe':
            regionParams = '&filter_GEN_lat=34.0&filter_GEN_lon=-10.0&filter_LEN_lat=71.0&filter_LEN_lon=66.0';
            break;
        case 'asia':
            regionParams = '&filter_GEN_lat=-10.0&filter_GEN_lon=26.0&filter_LEN_lat=80.0&filter_LEN_lon=180.0';
            break;
        default:
            regionParams = ''; // World 世界總覽，不帶任何 filter_xxxx 參數
    }

    // 4. 將解析完畢的參數組合，準備發送給 Worker
    const payload = {
        time: queryConfig.time,
        mg: queryConfig.mg,
        type: queryConfig.type,
        regionParams: regionParams
    };

    // 在控制台印出當前網址列啟用的篩選條件，方便除錯
    console.log("當前網址列啟動參數：", queryConfig);

    async function fetchEarthquakeData() {
        try {
            const response = await fetch(MY_WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload) // 丟給 Worker 動態組裝成 cURL
            });

            if (!response.ok) throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);

            const data = await response.json();
            
            if (data && data.status === 'error') {
                $('#list-container').html(`<p style="color:orange;">⚠️ ${data.message}</p>`);
                return;
            }

            if (data && data.status === 'success' && data.result) {
                renderData(data.result);
            } else {
                $('#list-container').text('目前該篩選條件下查無地震資料。');
            }

        } catch (error) {
            console.error('請求失敗:', error);
            $('#list-container').html(`<p style="color:red; font-weight:bold;">❌ 無法載入數據：${error.message}</p>`);
        }
    }

    // 5. 數據渲染函數（保持不變）
    function renderData(eqList) {
        const $listContainer = $('#list-container').empty(); 

        $.each(eqList, function(index, eq) {
            const marker = L.marker([eq.lat, eq.lon]).addTo(map);
            marker.bindPopup(`
                <b>${eq.region || eq.regionEn || '未知區域'}</b><br>
                震級：M ${eq.mg}<br>
                深度：${eq.depth} km<br>
                來源：${eq.type || '未知'}<br>
                時間：${eq.dateTime || ''}
            `);

            const $item = $('<div></div>')
                .addClass('eq-item')
                .html(`
                    <p><span class="mg-badge">M ${eq.mg}</span> <b>${eq.region || eq.regionEn || '未知區域'}</b></p>
                    <small>來源: ${eq.type || ''} | ${eq.dateTime || ''}</small>
                `);
            
            $item.on('click', function() {
                map.setView([eq.lat, eq.lon], 5);
                marker.openPopup();
            });

            $listContainer.append($item);
        });
    }

    // 啟動
    fetchEarthquakeData();
});