const geoJsonURL = "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";
let dataset = {};
let employment = [];
let unemployment = [];
let isEmployment = true;
let map, geoJsonLayer;
let jsonQuery = {
    "query": [
        {
            "code": "Alue",
            "selection": {
                "filter": "item",
                "values": [
                    "SSS"
                ]
            }
        },
        {
            "code": "Pääasiallinen toiminta",
            "selection": {
                "filter": "item",
                "values": [
                    "11",
                    "12"
                ]
            }
        },
        {
            "code": "Sukupuoli",
            "selection": {
                "filter": "item",
                "values": [
                    "SSS"
                ]
            }
        },
        {
            "code": "Ikä",
            "selection": {
                "filter": "item",
                "values": [
                    "SSS",
                ]
            }
        },
        {
            "code": "Vuosi",
            "selection": {
                "filter": "item",
                "values": [
                    "2010",
                    "2011",
                    "2012",
                    "2013",
                    "2014",
                    "2015",
                    "2016",
                    "2017",
                    "2018",
                    "2019",
                    "2020",
                    "2021",
                    "2022"
                ]
            }
        }
    ],
    "response": {
        "format": "json-stat2"
    }
};

const fetchData = async () => {
    let response = await fetch(geoJsonURL);
    let data = await response.json();
    if (!map) {
        initMap(data);
    } else {
        updateMap(data);
    }
};

const initMap = function(data) {
    map = L.map('map', {
        minZoom: -3
    });

    geoJsonLayer = L.geoJSON(data, {
        weight: 2,
        onEachFeature: getFeature,
        style: getStyle
    }).addTo(map);

    let osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }).addTo(map);

    let google = L.tileLayer("https://{s}.google.com/vt/lyrs=s@221097413,traffic&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        minZoom: 2,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    let baseMaps = {
        "OpenStreetMap": osm,
        "GoogleMaps": google
    };

    let overlayMaps = {
        "Municipalities": geoJsonLayer
    };

    L.control.layers(baseMaps, overlayMaps).addTo(map);
    map.fitBounds(geoJsonLayer.getBounds());
};

const updateMap = function(data) {
    map.removeLayer(geoJsonLayer);

    geoJsonLayer = L.geoJSON(data, {
        weight: 2,
        onEachFeature: getFeature,
        style: getStyle
    }).addTo(map);

    map.fitBounds(geoJsonLayer.getBounds());
};

const fetchRegion = async () => {
    const url = "regions.json";
    const res = await fetch(url);
    const data = await res.json();
    dataset = data;
    return data;
};

const getData = async () => {
    const regions = await fetchRegion();
    jsonQuery.query[0].selection.values = Object.keys(regions);
    jsonQuery.query[4].selection.values = ["2022"];
    const url = "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/tyokay/statfin_tyokay_pxt_115b.px";
    const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(jsonQuery)
    });
    if (!res.ok) {
        return;
    }
    const data = await res.json();
    return data;
};

const populateData = async () => {
    const data = await getData();
    const sortingCriteria = data.dimension.Alue.category.index;

    let employmentData = data.value.slice(0, data.value.length / 2);
    let unemploymentData = data.value.slice(data.value.length / 2);

    employmentData.forEach((value, index) => {
        const region = Object.keys(sortingCriteria).find(key => sortingCriteria[key] === index);
        employment[region] = value;
    });
    unemploymentData.forEach((value, index) => {
        const region = Object.keys(sortingCriteria).find(key => sortingCriteria[key] === index);
        unemployment[region] = value;
    });
    fetchData();
    return [employment, unemployment];
};

const getFeature = (features, layer) => {
    const municipality = features.properties.kunta;

    layer.bindTooltip(features.properties.name);

    if (isEmployment) {
        layer.bindPopup(
            `<ul>
                <li>Name: ${features.properties.name}</li>
                <li>Employment: ${employment[`KU${municipality}`]}</li>
                <li><button onclick="window.location.href='/chart.html?KU${municipality}'">Chart description</button></li>
            </ul>`
        );
    } else {
        layer.bindPopup(
            `<ul>
                <li>Name: ${features.properties.name}</li>
                <li>Unemployment: ${unemployment[`KU${municipality}`]}</li>
                <li><button onclick="window.location.href='/chart.html?KU${municipality}'">Chart description</button></li>
            </ul>`
        );
    }
};

const getStyle = (features) => {
    const municipality = features.properties.kunta;
    if (isEmployment)
        return {
            fillColor: `hsl(${getEmploymentHue(features)}, 55%, 50%)`,
            color: `hsl(${getEmploymentHue(features)}, 75%, 50%)`,
            fillOpacity: 0.8
        }
    else
        return {
            fillColor: `hsl(${getUnemploymentHue(features)}, 50%, 50%)`,
            color: `hsl(${getUnemploymentHue(features)}, 75%, 50%)`,
            fillOpacity: 0.8
        }
};

const getEmploymentHue = (features) => {
    const data = employment[`KU${features.properties.kunta}`];
    if (data > 100000) return 120;
    if (data > 50000) return 100;
    if (data > 10000) return 80;
    if (data > 1000) return 60;
    if (data > 500) return 50;
    if (data <= 500) return 40;
};

const getUnemploymentHue = (features) => {
    const data = unemployment[`KU${features.properties.kunta}`];
    
    if (data > 100000) return 0;
    if (data > 50000) return 10;
    if (data > 10000) return 20;
    if (data > 5000) return 30;
    if (data > 1000) return 40;
    if (data > 500) return 45;
    if (data <= 500) return 50;
};

populateData();

document.addEventListener('DOMContentLoaded', () => {
    let employmentCheck = document.getElementById('showEmployment');
    let unemploymentCheck = document.getElementById('showUnemployment');
    let goButton = document.getElementById('go');

    employmentCheck.addEventListener('click', () => {
        if (employmentCheck.checked) {
            isEmployment = true;
            unemploymentCheck.checked = false;
            fetchData();
        }
    });

    unemploymentCheck.addEventListener('click', () => {
        if (unemploymentCheck.checked) {
            isEmployment = false;
            employmentCheck.checked = false;
            fetchData();
        }
    });

    goButton.addEventListener('click', () => {
        window.location.href = '/';
    });
});
