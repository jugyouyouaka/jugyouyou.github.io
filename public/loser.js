document.addEventListener('DOMContentLoaded', function() {
    const placesWithinRadius = JSON.parse(localStorage.getItem('placesWithinRadius')) || [];
    const travelTimeHistory = JSON.parse(localStorage.getItem('travelTimeHistory')) || [];
    const userTravelTime = parseInt(localStorage.getItem('userTravelTime')) || 0;

    console.log('Places Within Radius:', placesWithinRadius);
    console.log('Travel Time History:', travelTimeHistory);
    console.log('User Travel Time:', userTravelTime);

    setupCardSelection(placesWithinRadius, travelTimeHistory, userTravelTime);
});

function setupCardSelection(placesWithinRadius, travelTimeHistory, userTravelTime) {
    const availableSuits = ['スペード', 'ハート', 'ダイヤ', 'クローバー', 'ジョーカー'];
    const cardButtonsContainer = document.getElementById('cardButtons');
    
    console.log('Card Buttons Container:', cardButtonsContainer);
    
    if (cardButtonsContainer) {
        cardButtonsContainer.innerHTML = '';
        availableSuits.forEach((suit, index) => {
            const img = document.createElement('img');
            img.src = 'back.png'; // カードの画像を設定
            img.alt = `Card ${index + 1}`;
            img.classList.add('cardImage');
            img.addEventListener('click', () => {
                handleCardClick(availableSuits, placesWithinRadius, travelTimeHistory, userTravelTime);
            });
            cardButtonsContainer.appendChild(img);
        });
    } else {
        console.error('Card Buttons Container not found.');
    }
}

function handleCardClick(availableSuits, placesWithinRadius, travelTimeHistory, userTravelTime) {
    const randomSuit = availableSuits[Math.floor(Math.random() * availableSuits.length)];

    console.log('選ばれた絵柄:', randomSuit);

    if (randomSuit === 'ジョーカー') {
        filterPlacesByJoker(placesWithinRadius, travelTimeHistory, userTravelTime);
    } else {
        filterPlacesBySuit(randomSuit, placesWithinRadius, travelTimeHistory, userTravelTime);
    }
}

function filterPlacesByJoker(placesWithinRadius, travelTimeHistory, userTravelTime) {
    const filteredPlaces = placesWithinRadius.filter(place => {
        const travelTimeEntry = travelTimeHistory.find(entry => entry.name.includes(place.name));
        const isWithinTimeRange = travelTimeEntry && Math.abs(travelTimeEntry.duration - userTravelTime) <= 15;
        
        console.log('フィルタ条件: ジョーカー');
        console.log('場所:', place.name);
        console.log('所要時間エントリー:', travelTimeEntry);
        console.log('ユーザー所要時間:', userTravelTime);
        console.log('時間範囲内:', isWithinTimeRange);
        
        return isWithinTimeRange;
    });

    const selectedPlaceDiv = document.getElementById('selectedPlace');
    selectedPlaceDiv.innerHTML = `<h3>選択された絵柄: ジョーカー</h3>`;

    if (filteredPlaces.length > 0) {
        const randomPlace = filteredPlaces[Math.floor(Math.random() * filteredPlaces.length)];
        const travelTimeEntry = travelTimeHistory.find(entry => entry.name.includes(randomPlace.name));

        selectedPlaceDiv.innerHTML += `<p>ランダムで選ばれた場所: ${randomPlace.name}: ${randomPlace.address}</p>`;
        if (travelTimeEntry) {
            selectedPlaceDiv.innerHTML += `<p>所要時間: ${travelTimeEntry.duration} 分</p>`;
        } else {
            selectedPlaceDiv.innerHTML += `<p>所要時間の履歴がありません</p>`;
        }
    } else {
        selectedPlaceDiv.innerHTML += '<p>該当する場所が見つかりませんでした。</p>';
    }
}

function filterPlacesBySuit(suit, placesWithinRadius, travelTimeHistory, userTravelTime) {
    const filteredPlaces = placesWithinRadius.filter(place => {
        const travelTimeEntry = travelTimeHistory.find(entry => entry.name.includes(place.name));
        const isWithinTimeRange = place.suit === suit && travelTimeEntry && Math.abs(travelTimeEntry.duration - userTravelTime) <= 15;
        
        console.log('フィルタ条件:', suit);
        console.log('場所:', place.name);
        console.log('所要時間エントリー:', travelTimeEntry);
        console.log('ユーザー所要時間:', userTravelTime);
        console.log('時間範囲内:', isWithinTimeRange);
        
        return isWithinTimeRange;
    });

    const selectedPlaceDiv = document.getElementById('selectedPlace');
    selectedPlaceDiv.innerHTML = `<h3>選択された絵柄: ${suit}</h3>`;

    if (filteredPlaces.length > 0) {
        const randomPlace = filteredPlaces[Math.floor(Math.random() * filteredPlaces.length)];
        const travelTimeEntry = travelTimeHistory.find(entry => entry.name.includes(randomPlace.name));
        
        selectedPlaceDiv.innerHTML += `<p>ランダムで選ばれた場所: ${randomPlace.name}: ${randomPlace.address}</p>`;
        if (travelTimeEntry) {
            selectedPlaceDiv.innerHTML += `<p>所要時間: ${travelTimeEntry.duration} 分</p>`;
        } else {
            selectedPlaceDiv.innerHTML += `<p>所要時間の履歴がありません</p>`;
        }
    } else {
        selectedPlaceDiv.innerHTML += '<p>該当する場所が見つかりませんでした。</p>';
    }
}
