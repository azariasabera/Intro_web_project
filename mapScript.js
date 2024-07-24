
const geoJsonURL = "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";
let negativeMig = {}
let positiveMig = {}

const fetchData = async () => {
    let response = await fetch(geoJsonURL);
    let data = await response.json();
    console.log(data)
    initMap(data);
}

// creating leaflet map to the div of id 'map'
const initMap = function(data) {
    let map = L.map('map', {
        minZoom: -3
    })

    let geoJson = L.geoJSON(data, {
        weight: 2,
        onEachFeature: getFeature,
        style: getStyle,
    }).addTo(map);

    let osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }).addTo(map);

    let google = L.tileLayer("https://{s}.google.com/vt/lyrs=s@221097413,traffic&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        minZoom: 2,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map)

    // This object contains both sources of maps: osm and google maps
    let baseMaps = {
        "OpenStreetMap": osm,
        "GoogleMaps": google
    }

    // This object is whether to show the geoJson or not
    let overlayMaps = {
        "Municipalities": geoJson
    }

    let layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    map.fitBounds(geoJson.getBounds())
}

let getFeature = (features, layer) => {

    const municipality = features.properties.kunta;
    const id = positiveMig.dataset.dimension.Tuloalue.category.index[`KU${municipality}`];
    
    // when hovering
    layer.bindTooltip(features.properties.name)

    // when clicking
    layer.bindPopup(
        `<ul>
            <li>Name: ${features.properties.name}</li>
            <li>Positive migration: ${positiveMig.dataset.value[id]}</li>
            <li>Negative migration: ${negativeMig.dataset.value[id]}</li>
        </ul>`
    )
}

async function fetchMigriData() {
    
    let positiveMigRes = await fetch('https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f');
    let positiveMigData = await positiveMigRes.json();

    let negativeMigRes = await fetch('https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e');
    let negativeMigData = await negativeMigRes.json();

    positiveMig = positiveMigData
    negativeMig = negativeMigData

    fetchData()
} 

const getStyle = (features) => {
    return {
        fillColor: `hsl(${hue(features)}, 75%, 50%)`,
        color: `hsl(${hue(features)}, 75%, 50%)`,
        fillOpacity: 0.3
    }
}

const hue = (features) => {
    const municipality = features.properties.kunta;
    const id = positiveMig.dataset.dimension.Tuloalue.category.index[`KU${municipality}`];
    let pos = positiveMig.dataset.value[id];
    let neg = negativeMig.dataset.value[id] || 1; // to avoid division by zero
    
    let net = Math.pow((pos/neg), 3)*60;
    
    if (net > 120) {
        return 120;
    } else {
        return net;
    }
}

fetchMigriData()
