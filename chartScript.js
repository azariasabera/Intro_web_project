let checkedBoxes = ['11'];
let checkedAge = [];
let checkedSex = [];
document.addEventListener("DOMContentLoaded", async () => {
    const dropdownInput = document.getElementById("dropdownInput");
    const dropdownList = document.getElementById("dropdownList");
    const dropdown = document.querySelector(".dropdown");
    const selectGraph = document.getElementById("selectGraph");
    const toMap = document.getElementById("toMap");
    const checkBoxes = document.querySelectorAll(".checkBox");
    const ageCorrelation = document.getElementById("ageCorrelations");
    const sexCorrelation = document.getElementById("sexCorrelation");

    document.getElementById("downloadChart").addEventListener("click", () => {
        html2canvas(document.getElementById("chart")).then(canvas => {
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = "chart.png";
            link.click();
        });
    });
    

    const fetchRegion = async () => {
        const url = "regions.json"
        const res = await fetch(url)
        const data = await res.json()   
        //console.log(data)
        return data
    };

    const getUrlParameter = () => {
        const queryString = window.location.search;
        const region = queryString.split('?')[1];
        const id = queryString.split('?')[2];
        if (region && id) {
            return [region, id];
        }
        return null;
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
                buildChart(selectGraph.value);
            });
            dropdownList.appendChild(option)
        });

        const regionParam = getUrlParameter();
        console.log(regionParam)
        if (regionParam) {
            let id = '';
            checkBoxes.forEach(checkbox => {
                if (regionParam[1] === checkbox.value){
                    checkbox.checked = true;
                    id = checkbox.value;
                    checkedBoxes = [];
                    checkedBoxes.push(id);
                    console.log('HEYY the id is',id)
                }
                else
                    checkbox.checked = false;
            });
            const regionName = optionValues[regionParam[0]];
            if (regionName) {
                dropdownInput.value = regionName;
                jsonQuery.query[0].selection.values = [regionParam[0]];
                jsonQuery.query[1].selection.values = [id];
                //console.log('jsonQueryyy', jsonQuery)
                buildChart(selectGraph.value);
                // remove the query parameters from the URL
                window.history.replaceState({}, document.title, "/chart.html");
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

    selectGraph.addEventListener("change", () => {
        if (selectGraph.value === "line") {
            buildChart("line");
        }
        else {
            buildChart("bar");
        }
    });  
    
    toMap.addEventListener("click", () => {
        window.location.href = "map.html";
    });

    checkBoxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            // collect all the checked checkboxes, and return array of their values
            const checked = Array.from(checkBoxes).filter(checkbox => checkbox.checked);
            const values = checked.map(checkbox => checkbox.value);
            if (values.length !== 0) {
                jsonQuery.query[1].selection.values = values;
                console.log(jsonQuery)
                buildChart(selectGraph.value);
                checkedBoxes = [];
                checkedBoxes = values;
                console.log('YAYY UM CHECKED')
            }
        });
    });

    /*ageCorrelation.addEventListener("change", () => {
        if (ageCorrelation.checked) {
            // create 3 checkboxes for age groups
            const ageGroups = ['0-17', '18-64', '65-'];
            for (let i = 0; i < 3; i++) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = i;
                checkbox.classList.add('check-box');
                checkbox.addEventListener('change', () => {
                    const checked = Array.from(checkedAge).filter(checkbox => checkbox.checked);
                    const values = checked.map(checkbox => checkbox.value);
                    if (values.length !== 0) {
                        jsonQuery.query[3].selection.values = values;
                        console.log(jsonQuery)
                        buildChart(selectGraph.value);
                    }

                });
                checkedAge.push(checkbox);
                const label = document.createElement('label');
                label.textContent = ageGroups[i];
    }}});*/

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
          "values": ["SSS"]
        }
      },
      {
        "code": "Pääasiallinen toiminta",
        "selection": {
          "filter": "item",
          "values": ["11"]
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
          "values": ["SSS"]
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
    //console.log(JSON.stringify(data.dimension.Alue.category.label))

    return data
}

const buildChart = async (type="line") => {
    const data = await getData();

    const years = Object.values(data.dimension.Vuosi.category.label);
    const sortingCriteria = data.dimension['Pääasiallinen toiminta'].category.index;
    const separationPoint = data.value.length / checkedBoxes.length;

    let datasets = [];
    //console.log('important', checkedBoxes, sortingCriteria, separationPoint)

    checkedBoxes.forEach((value) => {
        const order = sortingCriteria[value];
        datasets.push({
            name: document.querySelector(`label[for="${value}"]`).textContent,
            values: data.value.slice(separationPoint * order, separationPoint * (order + 1))
        })
    });
    //console.log(datasets)
    
    const chartData = {
        labels: years,
        datasets: datasets
    }

    const chart = new frappe.Chart("#chart", {
        title: "Votes in Finnish municipalities",
        data: chartData,
        type: type,
        height: 450,
        //colors: ["#63d0ff", "#363636"]
    })
}

buildChart()