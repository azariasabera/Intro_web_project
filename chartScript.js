
document.addEventListener("DOMContentLoaded", async () => {
    const dropdownInput = document.getElementById("dropdownInput");
    const dropdownList = document.getElementById("dropdownList");
    const dropdown = document.querySelector(".dropdown");
    const selectData = document.getElementById("selectData");
    const selectGraph = document.getElementById("selectGraph");
    const toMap = document.getElementById("toMap");

    const fetchRegion = async () => {
        const url = "regions.json"
        const res = await fetch(url)
        const data = await res.json()   
        //console.log(data)
        return data
    };

    const getUrlParameter = (name) => {
        // I am sending something like this: /index.html?region=KU020
        // and I want to get the value of region
        const queryString = window.location.search;
        return queryString.split('?')[1]
    };


    const populateDropdown = async () => {

        dropdownList.innerHTML = '';

        const optionValues = await fetchRegion();
        Object.entries(optionValues).forEach(([key, value]) => {
            const option = document.createElement('div');
            option.textContent = value;
            option.dataset.value = key;

            option.addEventListener('click', () => {
                dropdownInput.value = value;
                dropdown.classList.remove('dropdown-active');

                jsonQuery.query[0].selection.values = [key];
                buildChart(selectGraph.value, selectData.value);
            });
            dropdownList.appendChild(option)
        });

        const regionParam = getUrlParameter('region');
        console.log(regionParam)
        if (regionParam) {
            const regionName = optionValues[regionParam];
            if (regionName) {
                dropdownInput.value = regionName;
                jsonQuery.query[0].selection.values = [regionParam];
                buildChart(selectGraph.value, selectData.value);
            }
            else console.log('Municipality not found')
        }
        else console.log('NOTHING')
    }

    function filterOptions() {
        const filterText = dropdownInput.value.toLowerCase();

        const options = dropdownList.children; // these are divs
        Object.values(options).forEach(option => {
            const text = option.textContent.toLocaleLowerCase();
            if (text.includes(filterText))
                option.style.display = ''; // display
            else
                option.style.display = 'none'; // don't display
        })
    }

    dropdownInput.addEventListener("focus", function() {
        dropdown.classList.add("dropdown-active");
    });

    dropdownInput.addEventListener("blur", function() {
        // Timeout to allow click event to register before hiding
        setTimeout(() => {
            dropdown.classList.remove("dropdown-active");
        }, 200);
    });

    // if they select one call buildChart, selectdata is a select
    selectData.addEventListener("change", () => {
        if (selectData.value === "employment") {
            buildChart(selectGraph.value, "employment");
        }
        else if (selectData.value === "unemployment") {
            buildChart(selectGraph.value, "unemployment");
        }
        else {
            buildChart(selectGraph.value, "both");
        }});

    selectGraph.addEventListener("change", () => {
        if (selectGraph.value === "line") {
            buildChart("line", selectData.value);
        }
        else {
            buildChart("bar", selectData.value);
        }
    });  
    
    toMap.addEventListener("click", () => {
        window.location.href = "map.html";
    });

    dropdownInput.addEventListener("input", filterOptions);
    populateDropdown();
    console.log(dropdownInput.value)
});



const jsonQuery = 
{
    "query": [
      {
        "code": "Alue",
        "selection": {
          "filter": "item",
          "values": [
            "SSS",
            "KU020"
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

const getData = async () => {
    console.log('jsonQuery', jsonQuery)
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
    console.log(JSON.stringify(data.dimension.Alue.category.label))

    return data
}

const buildChart = async (type="line", which="both") => {
    const data = await getData()

    // assign employment with the data from first to the year's lenth index of the data
    const employmentData = data.value.slice(0, data.value.length / 2);
    console.log(employmentData)
    const unemploymentData = data.value.slice(data.value.length / 2);
    const years = Object.values(data.dimension.Vuosi.category.label);
    const datasets = {
        'employment': [{
            name: 'Employment',
            values: employmentData
        }],
        'unemployment': [{
            name: 'Unemployment',
            values: unemploymentData
        }],
        'both': [{
            name: 'Employment',
            values: employmentData
        },
        {
            name: 'Unemployment',
            values: unemploymentData
        }]
    }
    
    console.log('first', datasets[which])
    
    const chartData = {
        labels: years,
        datasets: datasets[which]
    }

    const chart = new frappe.Chart("#chart", {
        title: "Votes in Finnish municipalities",
        data: chartData,
        type: type,
        height: 450,
        colors: ["#63d0ff", "#363636"]
    })
}

buildChart()
//getData()