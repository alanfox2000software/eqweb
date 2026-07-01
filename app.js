$(document).ready(function() {

    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

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
            
            // 💡 檢查 Worker 傳回來的特製錯誤訊息
            if (data && data.status === 'error') {
                console.error("Worker 轉發報告錯誤:", data);
                $('#list-container').html(`<p style="color:orange;">⚠️ 伺服器拒絕連線：${data.message}</p>`);
                return;
            }

            if (data && data.status === 'success' && data.result) {
                renderData(data.result);
            } else {
                $('#list-container').text('資料格式不符，請確認數據。');
            }

        } catch (error) {
            console.error('請求失敗:', error);
            $('#list-container').html(`<p style="color:red; font-weight:bold;">❌ 無法解析數據：${error.message}</p>`);
        }
    }

    function renderData(eqList) {
        const $listContainer = $('#list-container').empty(); 
        $.each(eqList, function(index, eq) {
            const marker = L.marker([eq.lat, eq.lon]).addTo(map);
            marker.bindPopup(`<b>${eq.region || eq.regionEn || '未知'}</b><br>震級：M ${eq.mg}`);

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