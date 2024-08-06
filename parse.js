const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const places = [];

fs.createReadStream(path.join(__dirname, 'places.csv'))
  .pipe(csv())
  .on('data', (row) => {
    places.push({
      name: row['名前'],
      suit: row['ジャンル'],
      address: row['住所']
    });
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    console.log(places);  // パースされたデータを出力
  });
