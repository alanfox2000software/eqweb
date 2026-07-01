$(document).ready(function() {

    // 1. 初始化 Leaflet 地圖
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 用來管理地圖上所有圖層的群組（每次刷新前可用它一次清空所有 Marker）
    let markerLayerGroup = L.layerGroup().addTo(map);

    const MY_WORKER_URL = 'https://eqweb.alanfox2000software.workers.dev/fetchData';

    // 2. 初始化：網頁一打開，先讀取網址列參數（URL Bar），並同步設定給 UI 下拉選單
    function initFiltersFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('time')) $('#select-time').val(urlParams.get('time'));
        if (urlParams.get('mg')) $('#select-mg').val(urlParams.get('mg'));
        if (urlParams.get('type')) $('#select-type').val(urlParams.get('type'));
        if (urlParams.get('region')) $('#select-region').val(urlParams.get('region'));
    }

    // 3. 核心函數：讀取目前 UI 上的設定，修改網址列，並向後端請求資料
    async function fetchEarthquakeData() {
        // 顯示載入中提示
        $('#list-container').html('<p style="color:#666; padding:10px;">🔄 正在載入地震數據，請稍候...</p>');
        
        // 每次重新請求前，清空舊的地圖標記與連線
        markerLayerGroup.clearLayers();

        // 讀取當前下拉選單選中的值
        const selectedTime = $('#select-time').val();
        const selectedMg = $('#select-mg').val();
        const selectedType = $('#select-type').val();
        const selectedRegion = $('#select-region').val();

        // 💡 核心功能：動態修改瀏覽器的網址列 (URL Bar)，讓用戶可以直接複製網址分享
        const newUrlParams = new URLSearchParams();
        newUrlParams.set('time', selectedTime);
        newUrlParams.set('mg', selectedMg);
        newUrlParams.set('type', selectedType);
        newUrlParams.set('region', selectedRegion);
        
        // 更新網址列而不重新整理網頁
        const newRelativePathQuery = window.location.pathname + '?' + newUrlParams.toString();
        history.pushState(null, '', newRelativePathQuery);

        // 根據選擇區域轉換經緯度 filter 參數
        let regionParams = '';
        switch (selectedRegion.toLowerCase()) {
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
                regionParams = ''; // World 全球總覽
        }

        const payload = {
            time: selectedTime,
            mg: selectedMg,
            type: selectedType,
            regionParams: regionParams
        };

        try {
            const response = await fetch(MY_WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
            const data = await response.json();
            
            if (data && data.status === 'error') {
                $('#list-container').html(`<p style="color:orange; padding:10px;">⚠️ 伺服器提示：${data.message}</p>`);
                return;
            }

            if (data && data.status === 'success' && data.result) {
                renderData(data.result);
            } else {
                $('#list-container').html('<p style="padding:10px;">目前該篩選條件下查無任何地震資料。</p>');
            }

        } catch (error) {
            console.error('請求失敗:', error);
            $('#list-container').html(`<p style="color:red; font-weight:bold; padding:10px;">❌ 無法連線或解析：${error.message}</p>`);
        }
    }

    // 4. 數據渲染函數
    function renderData(eqList) {
        const $listContainer = $('#list-container').empty(); 

        $.each(eqList, function(index, eq) {
            const fullRegionText = (eq.region && eq.regionEn) ? `${eq.region} (${eq.regionEn})` : (eq.region || eq.regionEn || '未知區域');
            const formattedMainTime = eq.dateTime ? new Date(eq.dateTime).toLocaleString() : '未知';

            // --- 繪製主數據源標記 ---
            const mainMarker = L.marker([eq.lat, eq.lon], { zIndexOffset: 1000 }).addTo(markerLayerGroup);
            const mainUrlHtml = eq.detailUrl ? `<br><a href="${eq.detailUrl}" target="_blank" style="font-weight:bold;">查看原始報告</a>` : '';

            mainMarker.bindPopup(`
                <b style="color:red;">[主報告] ${eq.center.toUpperCase()}</b><br>
                <b>區域：</b>${fullRegionText}<br>
                <b>座標：</b>緯度 ${eq.lat}, 經度 ${eq.lon}<br>
                <b>震級：</b>M ${eq.mg} | <b>深度：</b>${eq.depth} km<br>
                <b>時間：</b>${formattedMainTime}${mainUrlHtml}
            `);

            // --- 繪製聯合觀測副標記 ---
            if (eq.eqs && eq.eqs.length > 0) {
                const totalSubPoints = eq.eqs.length;
                $.each(eq.eqs, function(i, subEq) {
                    const subTime = subEq.dateTime || eq.dateTime;
                    const formattedSubTime = subTime ? new Date(subTime).toLocaleString() : '未知';

                    const angle = (i * 2 * Math.PI) / totalSubPoints;
                    const radiusOffset = 0.15; 
                    const displayLat = eq.lat + (Math.sin(angle) * radiusOffset);
                    const displayLon = eq.lon + (Math.cos(angle) * radiusOffset);

                    const subMarker = L.circleMarker([displayLat, displayLon], {
                        radius: 8, color: '#ff7800', fillColor: '#ffa500', fillOpacity: 0.8, weight: 2
                    }).addTo(markerLayerGroup);

                    const subUrlHtml = subEq.url ? `<br><a href="${subEq.url}" target="_blank">查看機構報告</a>` : '';
                    subMarker.bindPopup(`
                        <b style="color:orange;">[聯合觀測] ${subEq.type.toUpperCase()}</b><br>
                        <b>震級：</b>M ${subEq.mg} | <b>深度：</b>${subEq.depth} km<br>
                        <b>時間：</b>${formattedSubTime}${subUrlHtml}
                    `);

                    L.polyline([[eq.lat, eq.lon], [displayLat, displayLon]], {
                        color: '#ff7800', weight: 1.5, dashArray: '4, 4', opacity: 0.6
                    }).addTo(markerLayerGroup);
                });
            }

            // --- 側邊欄項目 ---
            const sourceCount = eq.eqs ? eq.eqs.length + 1 : 1;
            const $item = $('<div></div>').addClass('eq-item').html(`
                <p><span class="mg-badge">M ${eq.mg}</span> <b>${eq.region || '未知'}</b></p>
                <p style="margin: 2px 0 5px 0; font-size: 0.85em; color: #666; font-style: italic;">${eq.regionEn || ''}</p>
                <small>來源: ${eq.center.toUpperCase()} | 聯合觀測: ${sourceCount} 家</small>
            `);
            
            $item.on('click', function() {
                map.setView([eq.lat, eq.lon], 7); 
                mainMarker.openPopup();
            });
            $listContainer.append($item);
        });
    }

    // 5. UI 連動事件監聽：當任何一個下拉選單被改變，自動觸發重新抓取並改網址
    $('#select-time, #select-mg, #select-type, #select-region').on('change', function() {
        fetchEarthquakeData();
    });

    // 手動重整按鈕
    $('#btn-refresh').on('click', function() {
        fetchEarthquakeData();
    });

    // 💡 監聽瀏覽器「上一頁/下一頁」按鈕事件：如果用戶按瀏覽器上下頁，也要自動同步
    window.onpopstate = function() {
        initFiltersFromURL();
        fetchEarthquakeData();
    };

    // 網頁初始化第一次載入
    initFiltersFromURL(); // 先同步選單
    fetchEarthquakeData(); // 再撈資料
});