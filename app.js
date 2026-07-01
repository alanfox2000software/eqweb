$(document).ready(function() {

    // 1. 初始化 Leaflet 地圖（設在全球視野）
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 2. 💡 改用 seep.eu.org 代理伺服器
    const PROXY_URL = 'https://seep.eu.org/';
    const TARGET_URL = 'http://eq.kyhtech.com/hapi/do.action?l=1';

    function fetchEarthquakeData() {
        // 💡 拼接後的 URL 格式為: https://seep.eu.org/http://eq.kyhtech.com/hapi/do.action?l=1
        $.ajax({
            url: PROXY_URL + TARGET_URL,
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            headers: {
                // 🔐 經由 seep.eu.org 轉發，這項自訂 App 驗證私鑰會被原封不動送達目標伺服器
                // 💡 依據你的要求，這裡已完全移除了 'User-Agent' 欄位
                'EQ-Agent': 'GooglePlayAppStore/com.topstcn.eq/3.6.1.346/Android/12/SM-A156E/e0NeKUb1Sny2PE2epzalvn/105c41e54edca8bbcd95ddc63e15c2e/null'
            },
            // 這裡 100% 複製你 cURL 中的 -d 參數物件
            data: {
                'action': 'eQndsAll',
                'filter_GEN_mg': 'All',
                'lang': 'zh_CN',
                'page.order': 'DESC',
                'page.orderBy': 'dateTime',
                'page.pageNo': '1',
                'page.pageSize': '20',
                'pn': 'com.topstcn.eq',
                'time': 'month',
                'type': 'USGS',
                'vcod': '346'
            },
            success: function(response) {
                // seep.eu.org 會直接回傳目標伺服器的原始內容
                let data = response;
                // 保險起見，如果回傳結果是純文字，自動轉為 JSON 物件
                if (typeof response === 'string') {
                    try { data = JSON.parse(response); } catch(e) {}
                }

                if (data && data.status === 'success' && data.result) {
                    renderData(data.result);
                } else {
                    $('#list-container').text('伺服器未返回成功狀態，請確認數據。');
                }
            },
            error: function(xhr, status, error) {
                console.error('seep.eu.org 代理請求出錯:', error);
                $('#list-container').html('<p style="color:red; font-weight:bold;">❌ 透過 seep 代理獲取數據失敗，可能因請求過於頻繁被 WAF 暫時封鎖</p>');
            }
        });
    }

    // 3. 數據渲染函數（將地震點畫在地圖與列表上）
    function renderData(eqList) {
        const $listContainer = $('#list-container');
        $listContainer.empty(); // 清空載入中提示

        $.each(eqList, function(index, eq) {
            // 在 Leaflet 地圖上標註紅點
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
                    <small>深度: ${eq.depth}km | 緯度: ${eq.lat} | 經度: ${eq.lon}</small>
                `);
            
            // 點擊列表項目時，地圖自動平移並開啟彈出視窗
            $item.on('click', function() {
                map.setView([eq.lat, eq.lon], 5);
                marker.openPopup();
            });

            $listContainer.append($item);
        });
    }

    // 執行獲取數據
    fetchEarthquakeData();
});