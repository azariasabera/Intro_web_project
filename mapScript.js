const geoJsonURL = "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";
let dataArray = [];

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
        "Show Regions": geoJsonLayer
    };

    let showLegend =
        L.control({ position: 'topleft' });

    L.control.layers(baseMaps, overlayMaps, addLegend()).addTo(map);
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

const addLegend = () => {
    const legend = L.control({ position: 'topleft' });

    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [0, 20, 50, 80, 100, 120]; // Adjust these values as needed
        const labels = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];
        const colors = ['#ff0000', '#ff5500', '#ffff00', '#55ff00', '#00ff00']; // Red, Orange, Yellow, Green, Dark Green

        // Loop through the grades and create a label with colored square
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colors[i] + '"></i> ' +
                (grades[i] ? grades[i] + ' - ' + (grades[i + 1] ? grades[i + 1] : 'Above') + '<br>' : '+');
        }

        return div;
    };

    legend.addTo(map);
};

const fetchRegion = async () => {
    const url = "regions.json";
    const res = await fetch(url);
    const data = await res.json();
    return data;
};

const getData = async () => {
    const regions = await fetchRegion();
    jsonQuery.query[0].selection.values = Object.keys(regions);
    jsonQuery.query[4].selection.values = [document.getElementById('year').value];
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

    let dataValues = data.value;

    dataValues.forEach((value, index) => {
        const region = Object.keys(sortingCriteria).find(key => sortingCriteria[key] === index);
        dataArray[region] = value;
    });
        
    fetchData();
    return dataArray;
};

const getFeature = (features, layer) => {
    const municipality = features.properties.kunta;

    layer.bindTooltip(features.properties.name);

    // get the name in the checked radio button
    const radioDiv = document.getElementById('radioDiv');
    const checkedRadio = radioDiv.querySelector('input[type="radio"]:checked');

    layer.bindPopup(
        `<ul>
            <li>Name: ${features.properties.name}</li>
            <li>${checkedRadio.textContent}: ${dataArray[`KU${municipality}`]}</li>
            <li><button onclick="window.location.href='/chart.html?KU${municipality}'">Chart description</button></li>
        </ul>`
    );
};

const getStyle = (features) => {
    return {
        fillColor: `hsl(${getHue(features)}, 75%, 50%)`,
        color: `hsl(${getHue(features)}, 75%, 50%)`,
        fillOpacity: 0.8
    };
};

const getHue = (features) => {
    const data = dataArray[`KU${features.properties.kunta}`];
    if (data > 100000) return 120;
    if (data > 50000) return 100;
    if (data > 10000) return 80;
    if (data > 1000) return 60;
    if (data > 500) return 50;
    if (data > 100) return 20;
    if (data <= 100) return 0;
};

populateData();

document.addEventListener('DOMContentLoaded', () => {
    let goButton = document.getElementById('go');
    let yearSelect = document.getElementById('year');
    let dropArea = document.getElementById('dropArea');
    let container = document.querySelector('.dragDropContainer');
    let cards = document.querySelectorAll('.card');
    let cardContainer = document.querySelector('.cardContainer');
    let top = document.getElementById('top');
    let bottom = document.getElementById('bottom');

    goButton.addEventListener('click', () => {
        window.location.href = '/';
    });

    let years = [2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];
    years.forEach(year => {
        let option = document.createElement('option');
        option.value = year;
        option.text = year;
        yearSelect.add(option);
    });

    yearSelect.addEventListener('change', () => {
        populateData();
    });

    cards.forEach(card => {
        card.addEventListener('dragstart', () => {
            card.classList.add('dragging');
        });
    
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
    });
    
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const card = document.querySelector('.dragging');
        if (card) {
            dropArea.appendChild(card);
            card.classList.remove('dragging');
        }
        getRadioButtons();
    });

    const getRadioButtons = () => {
        const radioDiv = document.getElementById('radioDiv');
        radioDiv.innerHTML = ''; // Clear any existing content

        const p = document.createElement('p');
            p.textContent = 'Which to show?';
        radioDiv.appendChild(p);
    
        let cardsInDropArea = dropArea.querySelectorAll('.card');
        cardsInDropArea.forEach((card, index) => {
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'radio';
            radio.id = card.id;
    
            const cardName = card.querySelector('p').textContent;
    
            const label = document.createElement('label');
            label.textContent = cardName;
            radio.textContent = cardName;
            label.htmlFor = radio.id;

            if (index === 0) {
                radio.checked = true;
            }

            const radioContainer = document.createElement('div');
            radioContainer.classList.add('radio-container');
            radioContainer.appendChild(radio);
            radioContainer.appendChild(label);
    
            radioDiv.appendChild(radioContainer);
        });
        radioDiv.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                jsonQuery.query[1].selection.values = [event.target.id];
                populateData();
            });
        });
    };    

    cardContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    cardContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const card = document.querySelector('.dragging');
        if (card) {
            cardContainer.appendChild(card);
            card.classList.remove('dragging');
        }
    });

    top.addEventListener('click', () => {
        document.getElementById('topDiv').scrollIntoView({ behavior: 'smooth' });
    });

    bottom.addEventListener('click', () => {
        container.scrollIntoView({ behavior: 'smooth' });
    });

    getRadioButtons();
});
