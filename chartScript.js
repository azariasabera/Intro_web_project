const inputArea = document.getElementById('input-area');
const searchButton = document.getElementById('submit-data');
const addButton = document.getElementById('add-data');
const navigateButton = document.getElementById('navigation');

const jsonQuery = { 
    "query": [{   
        "code": "Vuosi",
        "selection": {
            "filter": "item",
            "values": [ "2000",
                        "2001",
                        "2002",
                        "2003",
                        "2004",
                        "2005",
                        "2006",
                        "2007",
                        "2008",
                        "2009",
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
                        "2021" ]}
            },
            {
                "code": "Alue", 
                "selection": {
                    "filter": "item",
                    "values": ["SSS"]
                }
            },
            {
                "code": "Tiedot",
                "selection": {
                    "filter": "item",
                    "values": ["vaesto"]
                }
            }],
    "response": { "format": "json-stat2"}
}

searchButton.addEventListener('click', async (e)=>{
    e.preventDefault();
    const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/statfin_synt_pxt_12dy.px"
    const res = await fetch(url);
    const data = await res.json();
    //console.log(data)
    let name = inputArea.value.toLowerCase();
    name = name.slice(0, 1).toUpperCase() + name.slice(1);
    let code = "";
    //console.log(data.variables[1].valueTexts)
    if (name === "Whole country")
        code = "SSS";
    else{
        data.variables[1].valueTexts.forEach((element, index) => {
            if(element === name){
                code = data.variables[1].values[index];
            }
        });
        // or simply
        // if (data.variables[1].valueTexts.includes(name)) {
        //     code = data.variables[1].values[data.variables[1].valueTexts.indexOf(name)];
        // }
    }

    if (code === ""){
        alert("Invalid area name");
        return;
    }
    jsonQuery.query[1].selection.values = [code];
    buildChart();
})


const getData = async () => {
    const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/statfin_synt_pxt_12dy.px"

    const res = await fetch(url, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(jsonQuery)
    })
    if(!res.ok) {
        return;
    }
    const data = await res.json()

    return data
}

const buildChart = async () => {
    const data = await getData()
    console.log(data)
    const area = Object.values(data.dimension.Alue.category.label);
    const years = Object.values(data.dimension.Vuosi.category.label);
    const values = data.value;

    /* 
    // Option 1
    const chartData = {
        labels: years,
        dataset: [] // accepts an array of objects with name and values
    }
    for (let i = 0; i < area.length; i++) {
        const dataset = {
            name: area[i],
            values: []
        }
        for (let j = 0; j < years.length; j++) {
            dataset.values.push(values[i + j])
        }
        chartData.datasets.push(dataset)
    }
    */

    // Option 2
    area[0] = {
        name: area[0],
        values: values
    }

    const chartData = {
        labels: years,
        datasets: area
    }

    const chart = new frappe.Chart("#chart", {
        title: "Population growth in whole country",
        data: chartData,
        type: "line",
        height: 450,
        colors: ['#eb5146'],
        /*barOptions: {
           stacked: 1
        }*/
        lineOptions: {
            hideDots: 0,
            regionFill: 0
        }

    });
}
buildChart()

addButton.addEventListener('click', async (e)=>{
    e.preventDefault();
    const data = await getData();
    const values = data.value;
    const years = Object.values(data.dimension.Vuosi.category.label);
    const area = Object.values(data.dimension.Alue.category.label);
    
    let deltas = []; // storing the differences between a value and its predecessor
    for (let i = 1; i < values.length; i++) {
        deltas.push(values[i] - values[i - 1]);
    }

    let sum = 0;
    deltas.forEach(delta => sum += delta);

    const mean = sum / deltas.length;
    const newValue = values[values.length - 1] + mean;
    const newYear = parseInt(years[years.length - 1]) + 1;

    values.push(newValue);
    years.push(newYear.toString());

    area[0] = {
        name: area[0],
        values: values
    }

    const chartData = {
        labels: years,
        datasets: area
    }

    const chart = new frappe.Chart("#chart", {
        title: "Population growth in whole country",
        data: chartData,
        type: "line",
        height: 450,
        colors: ['#eb5146'],
        /*barOptions: {
           stacked: 1
        }*/
        lineOptions: {
            hideDots: 0,
            regionFill: 0
        }

    });
});

navigateButton.addEventListener('click', async (e)=>{
    e.preventDefault();
    window.location.href = "/newchart.html";
});
