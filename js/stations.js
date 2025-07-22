// Station data and management
export const stationData = [
    { name: 'Cavo Paradiso', url: 'https://neos.win:48488/1', genre: 'Deep & Progressive House', quality: 'MP3 192kbps' },
    { name: 'Ibiza Global Radio', url: 'https://andromeda.housejunkie.ca/radio/8000/radio.mp3', genre: 'House, Tech House', quality: 'MP3 320kbps' },
    { name: 'Intense Radio', url: 'https://secure.live-streams.nl/flac.flac', genre: 'Dance, Trance, Techno', quality: 'MP3 128kbps' },
    { name: 'Proton Radio', url: 'https://shoutcast.protonradio.com/;', genre: 'Progressive House', quality: 'MP3 320kbps' },
    { name: 'High Fi Dream Radio', url: 'https://cdn06-us-east.radio.cloud/80ba63862a97bd69c593cc7a2ccaab1c_hq', genre: 'Eclectic mix of Pop/Rock and Dance music', quality: 'FLAC (Lossless)' },
    { name: 'Starter FM', url: 'http://10321.cloudrad.io:9054/hd', genre: 'Electronic Dance Music', quality: 'MP3 320kbps' },
    { name: 'City Radio', url: 'http://cityradio.ddns.net:8000/cityradio48flac', genre: 'Classic & Modern Jazz', quality: 'FLAC (Lossless)' },
    { name: 'Naim Jazz', url: 'http://mscp3.live-streams.nl:8340/jazz-flac.flac', genre: 'Contemporary & Classic Jazz', quality: 'MP3 320kbps' },
    { name: 'Roxy Radio', url: 'https://s2.audiostream.hu/roxy_FLAC', genre: 'Today`s Music', quality: 'FLAC (Lossless)' },
    { name: 'Danubius Radio', url: 'https://stream.danubiusradio.hu/danubius_HiFi', genre: 'From retro to today`s hits', quality: 'FLAC (Lossless)' },
    { name: 'Dance Wave!', url: 'https://dancewave.online/dance.flac.ogg', genre: '80s & 90s Dance', quality: 'FLAC (Lossless)' },
    { name: 'Dance Wave Retro!', url: 'https://retro.dancewave.online/retrodance.flac.ogg', genre: '80s & 90s Dance', quality: 'FLAC (Lossless)' },
    { name: 'Sector 80s', url: 'http://89.223.45.5:8000/geny-flac', genre: '80s Dance & Pop', quality: 'OGG (Lossless)' },
    { name: 'Sector 90s', url: 'http://89.223.45.5:8000/next-flac', genre: '90s Dance & Pop', quality: 'OGG (Lossless)' },
    { name: 'Sector 00s', url: 'http://89.223.45.5:8000/indigo-flac', genre: '00s Dance & Pop', quality: 'OGG (Lossless)' },
    { name: 'Sector 10s', url: 'http://89.223.45.5:8000/zed-flac', genre: '10s Dance & Pop', quality: 'OGG (Lossless)' },
    { name: 'Sector Progressive', url: 'http://89.223.45.5:8000/progressive-flac', genre: 'EDM, Dance, Progressive', quality: 'OGG (Lossless)' },
    { name: 'Sector Jazz', url: 'http://89.223.45.5:8000/jazz-flac', genre: 'Jazz', quality: 'OGG (Lossless)' },
    { name: 'Radio Paradise (Main)', url: 'https://stream.radioparadise.com/flac', genre: 'Eclectic Rock, Pop, Jazz', quality: 'FLAC (Lossless)' },
    { name: 'Fréquence 3 – Dance', url: 'https://frequence3.net-radio.fr/frequence3dance.flac', genre: 'House and Dance', quality: 'FLAC (Lossless)' },
    { name: 'Fréquence 3 – Gold', url: 'https://frequence3.net-radio.fr/frequence3gold.flac', genre: '80s and 90s hits', quality: 'FLAC (Lossless)' },
    { name: 'Fréquence 3 – World', url: 'https://frequence3.net-radio.fr/frequence3world.flac', genre: 'World music', quality: 'FLAC (Lossless)' },
    { name: 'Hi On Radio - Lounge', url: 'https://mediaserv33.live-streams.nl:8036/live', genre: 'Lounge music', quality: 'MP3 320kbps' },

];

let stations = [...stationData];

export function getStations() {
    return stations;
}

export function setStations(newStations) {
    stations = newStations;
}

export function findStationByName(name) {
    return stations.find(s => s.name === name);
}

export function updateStationOrder(oldIndex, newIndex) {
    const movedItem = stations.splice(oldIndex, 1)[0];
    stations.splice(newIndex, 0, movedItem);
    return stations;
}
