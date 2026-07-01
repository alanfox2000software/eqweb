$(document).ready(function() {

    // 1. Initialize Leaflet Map (Default global overview)
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Layer Group to manage and clear all markers/lines efficiently
    let markerLayerGroup = L.layerGroup().addTo(map);

    // Backend Worker API Endpoint
    const MY_WORKER_URL = 'https://eqweb.alanfox2000software.workers.dev/fetchData';

    // 2. Initialization: Read URL search parameters and sync them into UI selectors
    function initFiltersFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('time')) $('#select-time').val(urlParams.get('time'));
        if (urlParams.get('mg')) $('#select-mg').val(urlParams.get('mg'));
        if (urlParams.get('type')) $('#select-type').val(urlParams.get('type'));
        if (urlParams.get('region')) $('#select-region').val(urlParams.get('region'));
    }

    // 3. Core Function: Get values from UI, update URL bar, and send POST request to Worker
    async function fetchEarthquakeData() {
        // Show loading message
        $('#list-container').html('<p style="color:#666; padding:10px;">🔄 Loading earthquake data, please wait...</p>');
        
        // Clear old map markers before each request
        markerLayerGroup.clearLayers();

        // Get current filter selections
        const selectedTime = $('#select-time').val();
        const selectedMg = $('#select-mg').val();
        const selectedType = $('#select-type').val();
        const selectedRegion = $('#select-region').val();

        // Two-way sync: Dynamic URL update without reloading the page
        const newUrlParams = new URLSearchParams();
        newUrlParams.set('time', selectedTime);
        newUrlParams.set('mg', selectedMg);
        newUrlParams.set('type', selectedType);
        newUrlParams.set('region', selectedRegion);
        
        const newRelativePathQuery = window.location.pathname + '?' + newUrlParams.toString();
        history.pushState(null, '', newRelativePathQuery);

        // Convert region selection into coordinate filters
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
                regionParams = ''; // World / Global Overview
        }

        // Package payload for backend Worker
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

            if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
            const data = await response.json();
            
            if (data && data.status === 'error') {
                $('#list-container').html(`<p style="color:orange; padding:10px;">⚠️ Server Note: ${data.message}</p>`);
                return;
            }

            if (data && data.status === 'success' && data.result) {
                renderData(data.result);
            } else {
                $('#list-container').html('<p style="padding:10px;">No earthquake data found for current filters.</p>');
            }

        } catch (error) {
            console.error('Request failed:', error);
            $('#list-container').html(`<p style="color:red; font-weight:bold; padding:10px;">❌ Connection or parsing error: ${error.message}</p>`);
        }
    }

    // 4. Data Rendering Function
    function renderData(eqList) {
        const $listContainer = $('#list-container').empty(); 

        // Dynamic user timezone offset calculation (Outputs: UTC+X or UTC-X)
        const offsetMinutes = new Date().getTimezoneOffset(); 
        const offsetHours = -offsetMinutes / 60; 
        const utcSuffix = offsetHours >= 0 ? ` (UTC+${offsetHours})` : ` (UTC${offsetHours})`; 

        // Time format configurations (Output format: YYYY-MM-DD HH:MM:SS)
        const timeOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        $.each(eqList, function(index, eq) {
            const fullRegionText = (eq.region && eq.regionEn) ? `${eq.region} (${eq.regionEn})` : (eq.region || eq.regionEn || 'Unknown Region');

            // Format main report time
            let formattedMainTime = 'Unknown';
            if (eq.dateTime) {
                const mainDate = new Date(eq.dateTime);
                // Convert to local format and replace slashes with hyphens
                formattedMainTime = mainDate.toLocaleString('en-US', timeOptions).replace(/\//g, '-') + utcSuffix;
            }

            // --- Draw Main Source Marker ---
            const mainMarker = L.marker([eq.lat, eq.lon], { zIndexOffset: 1000 }).addTo(markerLayerGroup);
            
            // Main report dynamic link
            const mainUrlHtml = eq.detailUrl ? `<br><a href="${eq.detailUrl}" target="_blank" style="font-weight:bold;">View ${eq.center.toUpperCase()} Original Report</a>` : '';

            // Bind metadata popup
            mainMarker.bindPopup(`
                <b style="color:red;">[Main Report] ${eq.center.toUpperCase()}</b><br>
                <b>Region:</b> ${fullRegionText}<br>
                <b>Coordinates:</b> Lon ${eq.lon}, Lat ${eq.lat}<br>
                <b>Magnitude:</b> M ${eq.mg}<br>
                <b>Depth:</b> ${eq.depth} km<br>
                <b>Time:</b> ${formattedMainTime}
                ${mainUrlHtml}
            `);

            // --- Draw Sub-agencies Joint Observation Markers (eqs Array) ---
            if (eq.eqs && eq.eqs.length > 0) {
                const totalSubPoints = eq.eqs.length;
                $.each(eq.eqs, function(i, subEq) {
                    const subTime = subEq.dateTime || eq.dateTime;
                    
                    // Format sub report time
                    let formattedSubTime = 'Unknown';
                    if (subTime) {
                        const subDate = new Date(subTime);
                        formattedSubTime = subDate.toLocaleString('en-US', timeOptions).replace(/\//g, '-') + utcSuffix;
                    }

                    // Spiderweb offset logic to prevent overlapping
                    const angle = (i * 2 * Math.PI) / totalSubPoints;
                    const radiusOffset = 0.15; 
                    const displayLat = eq.lat + (Math.sin(angle) * radiusOffset);
                    const displayLon = eq.lon + (Math.cos(angle) * radiusOffset);

                    const subMarker = L.circleMarker([displayLat, displayLon], {
                        radius: 8, color: '#ff7800', fillColor: '#ffa500', fillOpacity: 0.8, weight: 2
                    }).addTo(markerLayerGroup);

                    const subUrlHtml = subEq.url ? `<br><a href="${subEq.url}" target="_blank">View Agency Report</a>` : '';
                    
                    subMarker.bindPopup(`
                        <b style="color:orange;">[Joint Obs] ${subEq.type.toUpperCase()}</b><br>
                        <b>Actual Loc:</b> Lon ${subEq.lon}, Lat ${subEq.lat}<br>
                        <b>Magnitude:</b> M ${subEq.mg}<br>
                        <b>Depth:</b> ${subEq.depth} km<br>
                        <b>Time:</b> ${formattedSubTime}
                        ${subUrlHtml}
                    `);

                    // Draw dashed lines linking sub-marker to main marker
                    L.polyline([[eq.lat, eq.lon], [displayLat, displayLon]], {
                        color: '#ff7800', weight: 1.5, dashArray: '4, 4', opacity: 0.6
                    }).addTo(markerLayerGroup);
                });
            }

            // --- 5. Generate Sidebar List Item ---
            const sourceCount = eq.eqs ? eq.eqs.length + 1 : 1;
            const $item = $('<div></div>').addClass('eq-item').html(`
                <p><span class="mg-badge">M ${eq.mg}</span> <b>${eq.region || 'Unknown'}</b></p>
                <p style="margin: 2px 0 5px 0; font-size: 0.85em; color: #666; font-style: italic;">${eq.regionEn || ''}</p>
                <small>
                    Main Source: ${eq.center.toUpperCase()} | 
                    Time: ${formattedMainTime}<br>
                    <span style="color: #ff7800; font-weight:bold;">Joint Agencies: ${sourceCount}</span>
                </small>
            `);
            
            // Pan map and open main popup on sidebar click
            $item.on('click', function() {
                map.setView([eq.lat, eq.lon], 7); 
                mainMarker.openPopup();
            });
            $listContainer.append($item);
        });
    }

    // 5. Event Listeners: Trigger data refetch on UI input change
    $('#select-time, #select-mg, #select-type, #select-region').on('change', function() {
        fetchEarthquakeData();
    });

    // Refresh button listener
    $('#btn-refresh').on('click', function() {
        fetchEarthquakeData();
    });

    // Handle browser back/forward history navigation sync
    window.onpopstate = function() {
        initFiltersFromURL();
        fetchEarthquakeData();
    };

    // App Initialization
    initFiltersFromURL();  // Step 1: Read URL string to selectors
    fetchEarthquakeData(); // Step 2: Fire request to populate data
});