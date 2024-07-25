const geoJsonURL = "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";
let dataset = {};
let employment = [];
let unemployment = [];
let jsonQuery = 
{
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
    }],
    "response": {
      "format": "json-stat2"
    }
  }


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
        //style: getStyle,
        style: {
            fillColor: "blue",
            color: "blue",
            fillOpacity: 0.3
        }
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

const fetchRegion = async () => {
    const url = "regions.json"
    const res = await fetch(url)
    const data = await res.json()   
    //console.log(data)
    dataset = data
    return data
};

const getData = async () => {
    const regions = await fetchRegion()
    jsonQuery.query[0].selection.values = Object.keys(regions)
    jsonQuery.query[4].selection.values = ["2022"]
    console.log('jsonQueryy', jsonQuery)
    const url = "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/tyokay/statfin_tyokay_pxt_115b.px"
    const res = await fetch(url, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(jsonQuery)
    })
    if(!res.ok) {
        return;
    }
    const data = await res.json()
    console.log('data', data)
    //console.log(JSON.stringify(data.dimension.Alue.category.label))
    //console.log('first, jsonQuery', jsonQuery)

    return data
}

const populateData = async () => {
    const data = await getData()
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
    console.log(employment, unemployment)
    fetchData()
    return [employment, unemployment]
}

let getFeature = (features, layer) => {
    const municipality = features.properties.kunta;
    //const id = dataset.dataset.dimension.Tuloalue.category.index[`KU${municipality}`];
    console.log(employment, unemployment)
    
    // when hovering
    layer.bindTooltip(features.properties.name)

    // when clicking
    layer.bindPopup(
        `<ul>
            <li>Name: ${features.properties.name}</li>
            <li>Employment: ${employment[`KU${municipality}`]}</li>
            <li>Unemployment: ${unemployment[`KU${municipality}`]}</li>
            <li><button onclick="window.location.href='/chart.html?KU${municipality}'">Chart description</button></li>
        </ul>`,
    )
}

/*const getStyle = (features) => {
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
}*/

populateData()



