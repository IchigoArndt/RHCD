const fs = require('fs');

function getRoomById(id) {
    const data = fs.readFileSync('assets/salas.json', 'utf-8');
    const rooms = JSON.parse(data);
    return rooms.find(room => room.id === id) || null;
}

function getAllRoomIds() {
    const data = fs.readFileSync('assets/salas.json', 'utf-8');
    const rooms = JSON.parse(data);
    return rooms.map(room => room.id);
}

module.exports = { getRoomById, getAllRoomIds };