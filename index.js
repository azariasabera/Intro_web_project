
document.addEventListener("DOMContentLoaded", async () => {
    const dropdownInput = document.getElementById("dropdownInput");
    const dropdownList = document.getElementById("dropdownList");
    const dropdown = document.querySelector(".dropdown");
    const selectYear = document.getElementById("selectYear");
    const selectParty = document.getElementById("selectParty");
    const singleYearDiv = document.getElementById("singleYearDiv");
    const showSingleYear = document.getElementById("showSingleYear");
    const yearRangeDiv = document.getElementById("yearRangeDiv");
    const singleYear = document.getElementById("singleYear");
    

    yearsArray = [1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2017, 2021];

    const fetchMunicipality = async () => {
        const url = "municipalities.json"
        const res = await fetch(url)
        const data = await res.json()   
        //console.log(data)
        return data
    };

    const populateDropdown = async () => {

        dropdownList.innerHTML = '';

        const optionValues = await fetchMunicipality();
        Object.entries(optionValues).forEach(([key, value]) => {
            const option = document.createElement('div');
            option.textContent = value;
            option.dataset.value = key;

            option.addEventListener('click', () => {
                dropdownInput.value = value;
                dropdown.classList.remove('dropdown-active');

                if (dropdownInput.value === "single")
                    singleYearDiv.style.display = "block";
                else
                    jsonQuery.query[1].selection.values = [key];
                    if (showSingleYear.checked) 
                        buildChart("bar");
                    else
                        buildChart();
            });
            dropdownList.appendChild(option)
        });
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

    selectYear.addEventListener("change", () => {
        const years = yearsArray.filter(year => year >= parseInt(selectYear.value));
        jsonQuery.query[0].selection.values = years;
        buildChart();
    });

    singleYear.addEventListener("change", () => {
        jsonQuery.query[0].selection.values = [parseInt(singleYear.value)];
        buildChart("bar");
    });

    selectParty.addEventListener("change", () => {
        if(selectParty.value === "all") {
            jsonQuery.query[2].selection.values = [
                "03",
                "01",
                "04",
                "02",
                "06",
                "07",
                "08",
                "80"
            ]
        } else {
            jsonQuery.query[2].selection.values = [selectParty.value];
        }

        if (showSingleYear.checked) 
            buildChart("bar");
        else
            buildChart();
    });

    showSingleYear.addEventListener("change", () => {
        if(showSingleYear.checked) {
            console.log('checked')
            singleYearDiv.style.display = "block";
            yearRangeDiv.style.display = "none";
            showSingleYear.textContent = "Hide year range";
            jsonQuery.query[0].selection.values = [parseInt(singleYear.value)];
            buildChart("bar");  
        } else {
            console.log('unchecked')
            yearRangeDiv.style.display = "block";
            singleYearDiv.style.display = "none";
            jsonQuery.query[0].selection.values = [1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2017, 2021];
            buildChart();
        }
    });

    dropdownInput.addEventListener("input", filterOptions);
    populateDropdown();
    console.log(dropdownInput.value)
});



const jsonQuery = 
    {
        "query": [
            {
            "code": "Vuosi",
            "selection": {
                "filter": "item",
                "values": [1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2017, 2021]
            }
            },
            {
            "code": "Alue",
            "selection": {
                "filter": "item",
                "values": [
                "000000"
                ]
            }
            },
            {
            "code": "Puolue",
            "selection": {
                "filter": "item",
                "values": [
                "03",
                "01",
                "04",
                "02",
                "06",
                "07",
                "08",
                "80"
                ]
            }
            },
            {
            "code": "Tiedot",
            "selection": {
                "filter": "item",
                "values": [
                "osuus_aanista"
                ]
            }
            }
        ],
        "response": {
            "format": "json-stat2"
        }

    }

const getData = async () => {
    console.log('jsonQuery', jsonQuery)
    const url = "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/kvaa/statfin_kvaa_pxt_12g3.px"
    const res = await fetch(url, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(jsonQuery)
    })
    if(!res.ok) {
        return;
    }
    const data = await res.json()
    console.log(data)
    console.log(JSON.stringify(data.dimension.Alue.category.label))

    return data
}

const buildChart = async (type="line") => {
    const data = await getData()

    const dataValues = data.value;

    const years = Object.values(data.dimension.Vuosi.category.label);

    const sortingCriteria = data.dimension.Puolue.category.index;
    const partiesWithNames = data.dimension.Puolue.category.label;
    let parties = Object.values(partiesWithNames);

    parties.forEach((party, index) => {
        let partySupport = []; // to store the data for each party
        const partyCode = Object.keys(partiesWithNames).find(key => partiesWithNames[key] === party);
        dataValues.forEach((value, i) => {
            if((i) % parties.length === sortingCriteria[partyCode]) {
                partySupport.push(value)
            }
        })
        parties[index] = {
            name: party,
            values: partySupport
        }
    })
    console.log(parties)
    
    const chartData = {
        labels: years,
        datasets: parties
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