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
        // 組合中英文區域名稱
        const fullRegionText = (eq.region && eq.regionEn) 
            ? `${eq.region} (${eq.regionEn})` 
            : (eq.region || eq.regionEn || '未知區域');

        // 💡 修正 1：明確將主點的 Unix Timestamp 轉換為在地時間格式字串
        const formattedMainTime = eq.dateTime 
            ? new Date(eq.dateTime).toLocaleString() 
            : '未知';

        // --- 1. 繪製主數據源標記 ---
        const mainMarker = L.marker([eq.lat, eq.lon]).addTo(map);

        mainMarker.bindPopup(`
            <b style="color:red;">[主報告] ${eq.center.toUpperCase()} 測報</b><br>
            <b>區域：</b>${fullRegionText}<br>
            <b>震級：</b>M ${eq.mg}<br>
            <b>深度：</b>${eq.depth} km<br>
            <b>時間：</b>${formattedMainTime}
        `);

        // --- 2. 檢查是否有其他機構的觀測數據 (eqs 陣列) ---
        if (eq.eqs && eq.eqs.length > 0) {
            $.each(eq.eqs, function(i, subEq) {
                
                // 💡 修正 2：副觀測點的時間如果內層結構有獨立時間就用內層的，沒有就沿用主點時間
                const subTime = subEq.dateTime || eq.dateTime;
                const formattedSubTime = subTime 
                    ? new Date(subTime).toLocaleString() 
                    : '未知';

                const subMarker = L.circleMarker([subEq.lat, subEq.lon], {
                    radius: 6,
                    color: '#ff7800',      
                    fillColor: '#ffa500',  
                    fillOpacity: 0.8
                }).addTo(map);

                subMarker.bindPopup(`
                    <b style="color:orange;">[聯合觀測] ${subEq.type.toUpperCase()} 測報</b><br>
                    <b>位置對照：</b>${fullRegionText}<br>
                    <b>震級：</b>M ${subEq.mg}<br>
                    <b>深度：</b>${subEq.depth} km<br>
                    <b>時間：</b>${formattedSubTime}<br>
                    <a href="${subEq.url}" target="_blank">查看該機構原始報告</a>
                `);

                // 在主測量點與副測量點之間畫一條虛線
                L.polyline([[eq.lat, eq.lon], [subEq.lat, subEq.lon]], {
                    color: 'gray',
                    weight: 1,
                    dashArray: '5, 5',
                    opacity: 0.7
                }).addTo(map);
            });
        }

        // --- 3. 動態建立側邊欄列表項目 ---
        const sourceCount = eq.eqs ? eq.eqs.length + 1 : 1;

        const $item = $('<div></div>')
            .addClass('eq-item')
            .html(`
                <p>
                    <span class="mg-badge">M ${eq.mg}</span> 
                    <b>${eq.region || '未知'}</b>
                </p>
                <p style="margin: 2px 0 5px 0; font-size: 0.85em; color: #666; font-style: italic;">
                    ${eq.regionEn || ''}
                </p>
                <small>
                    主要來源: ${eq.center.toUpperCase()} | 
                    時間: ${formattedMainTime} | 
                    <span style="color: #ff7800; font-weight:bold;">聯合觀測: ${sourceCount} 家</span>
                </small>
            `);
        
        $item.on('click', function() {
            map.setView([eq.lat, eq.lon], 6);
            mainMarker.openPopup();
        });

        $listContainer.append($item);
    });
}
    // 啟動
    fetchEarthquakeData();
});