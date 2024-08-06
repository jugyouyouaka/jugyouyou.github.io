let map;
let geocoder;
let userMarker;
let travelRadiusCircle;
let markers = [];
let places = [];
let placesWithinRadius = [];
let userLocation;
let selectedSuit;
let travelTimeHistory = []; // 所要時間の履歴を保持
let userTravelTime; // ユーザーが入力した所要時間
let avoidTolls; // ユーザーの有料道路の有無

document.addEventListener('DOMContentLoaded', function() {
    fetch('/places')
        .then(response => response.json())
        .then(data => {
            places = data.map(place => ({
                name: place.name,
                suit: place.suit,
                address: place.address
            }));
            console.log('Places loaded:', places);

            // 初期化時に進むボタンを表示
            document.getElementById('proceedButton').style.display = 'block';
        });
});

function startApp() {
    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('inputScreen').style.display = 'block';
}

function updateTimeDisplay() {
    userTravelTime = parseInt(document.getElementById('timeRange').value);
    document.getElementById('timeDisplay').textContent = userTravelTime + '分';
    checkInputCompletion();
}

function checkInputCompletion() {
    // 所要時間が0分の場合はボタンを非表示にする
    if (userTravelTime <= 0) {
        document.getElementById('proceedButton').style.display = 'none';
    } else {
        document.getElementById('proceedButton').style.display = 'block';
    }
}

function proceedToMap() {
    avoidTolls = document.getElementById('tollRoads').checked;
    userTravelTime = parseInt(document.getElementById('timeRange').value); // ここでuserTravelTimeを設定

    console.log('User settings - Travel Time:', userTravelTime, 'Use Toll Roads:', avoidTolls);
    document.getElementById('inputScreen').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    initMap();
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 34.6937, lng: 135.5021 },
        zoom: 10
    });
    geocoder = new google.maps.Geocoder();

    map.addListener('click', function (event) {
        placeUserMarker(event.latLng);
        drawTravelRadius(event.latLng);
        plotPlacesWithinRadius(event.latLng);
    });
}

function geocodeAddress(place, callback) {
    geocoder.geocode({ 'address': place.address }, function (results, status) {
        if (status === 'OK') {
            callback(results[0].geometry.location, place);
        } else {
            console.error('Geocode was not successful for the following reason: ' + status);
        }
    });
}

function placeUserMarker(location) {
    if (userMarker) {
        userMarker.setPosition(location);
    } else {
        userMarker = new google.maps.Marker({
            position: location,
            map: map,
            title: "現在地",
            icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }
        });
    }

    document.getElementById('confirmLocation').style.display = 'block';
}

function confirmLocation() {
    if (userMarker) {
        userLocation = userMarker.getPosition();
        alert('現在地が設定されました: ' + userLocation.lat() + ', ' + userLocation.lng());
        showPlacesWithinRadius();
    }
}

function drawTravelRadius(location) {
    const travelTime = parseInt(document.getElementById('timeRange').value);
    const averageSpeed = 60; // 平均速度 (km/h)
    const radius = (travelTime / 60) * averageSpeed * 1000; // km to meters

    if (travelRadiusCircle) {
        travelRadiusCircle.setMap(null);
    }

    travelRadiusCircle = new google.maps.Circle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        map,
        center: location,
        radius: radius,
        clickable: false
    });
}

function plotPlacesWithinRadius(center) {
    clearMarkers();
    placesWithinRadius = [];

    places.forEach(place => {
        geocodeAddress(place, function (location, place) {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(location, center);
            if (distance <= travelRadiusCircle.getRadius()) {
                const marker = new google.maps.Marker({
                    map: map,
                    position: location,
                    title: place.name
                });
                markers.push(marker);
                placesWithinRadius.push({
                    name: place.name,
                    address: place.address,
                    suit: place.suit, 
                    location
                });
            }
        });
    });
}

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

function showPlacesWithinRadius() {
    const mapDiv = document.getElementById('map');
    const resultsDiv = document.getElementById('results');
    const placeList = document.getElementById('placeList');

    mapDiv.style.display = 'none';
    resultsDiv.style.display = 'block';
    placeList.innerHTML = '';

    placesWithinRadius.forEach(place => {
        const listItem = document.createElement('li');
        listItem.textContent = `${place.name} (${place.suit}): ${place.address}`;
        placeList.appendChild(listItem);

        // 距離行列APIを使用して所要時間を取得
        calculateTravelTime(userLocation, place.location, listItem);
    });

    // `userTravelTime`、`placesWithinRadius`、`travelTimeHistory`をlocalStorageに保存
    localStorage.setItem('userTravelTime', JSON.stringify(userTravelTime));
    localStorage.setItem('placesWithinRadius', JSON.stringify(placesWithinRadius));
}

function calculateTravelTime(origin, destination, listItem) {
    const service = new google.maps.DirectionsService();
    
    // 有料道路を使うルート
    service.route({
        origin: origin,
        destination: destination,
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.METRIC,
        region: 'JP',
        provideRouteAlternatives: false,
        waypoints: [],
        optimizeWaypoints: false,
        avoidTolls: avoidTolls // ユーザーの選択を反映
    }, (response, status) => {
        if (status === 'OK') {
            const duration = response.routes[0].legs[0].duration.text;
            const durationValue = response.routes[0].legs[0].duration.value; // 秒単位の値を取得
            listItem.textContent += ` - 所要時間: ${duration}`;

            // 所要時間を履歴に追加
            travelTimeHistory.push({
                name: listItem.textContent,
                duration: Math.round(durationValue / 60) // 分単位に変換
            });

            // コンソールにログを追加
            console.log('所要時間計算結果:');
            console.log('出発地:', origin);
            console.log('目的地:', destination);
            console.log('計算結果:', {
                durationText: duration,
                durationSeconds: durationValue,
                durationMinutes: Math.round(durationValue / 60)
            });
        } else {
            console.error('Directions request failed due to ' + status);
        }
    });
}

function displayTravelTimeHistory() {
    const historyDiv = document.getElementById('history');
    if (!historyDiv) {
        console.error('履歴表示用の要素が見つかりません。');
        return;
    }
    historyDiv.innerHTML = '<h3>履歴:</h3><ul>';
    travelTimeHistory.forEach(entry => {
        historyDiv.innerHTML += `<li>${entry.name} - 所要時間: ${entry.duration} 分</li>`;
    });
    historyDiv.innerHTML += '</ul>';
}

function goBackToMap() {
    const mapDiv = document.getElementById('map');
    const resultsDiv = document.getElementById('results');
    mapDiv.style.display = 'block';
    resultsDiv.style.display = 'none';
}

function redirectToHiLo() {
    window.location.href = 'HiLo.html'; // HiLo.htmlへのリダイレクト
    localStorage.setItem('travelTimeHistory', JSON.stringify(travelTimeHistory));
}
