let margin = {top: 10, bottom: 10, left: 10, right:10};

// let width = parseInt(d3.select('.viz').style('width'));
let width = 960;
    width = width - margin.left - margin.right;

let mapRatio = 0.5;
let height = width * mapRatio;
let active = d3.select(null);

let currentId = 0;
let isClicked = false;

let scaleProportionShootingsPerState;
let scaleColor = d3.scaleLinear()
    .domain([0, 5, 10])
    .range(['#5c7658', '#e6d385', '#d25959']);

// Male, Female, Male/Female, Unknown
let colorsSex = {Male : "#00adb5", Female : '#ff2e63', Unknown : "#8785a2"};
let colorsRace = {White : "#00adb5", Black : '#ff2e63', both : '#fce38a', unknown : "#8785a2"};
let colorsGuns = {male : "#00adb5", female : '#ff2e63', both : '#fce38a', unknown : "#8785a2"};
let colorsMentalIllness = {male : "#00adb5", female : '#ff2e63', both : '#fce38a', unknown : "#8785a2"};

// Now we need to gather all the data and we set it them in a dataset with the id os the state as the key

// dataset = {id1: [], id2: []}

let numberOfMassShooting = 0;
let maxNumberMassShootingPerState= 0;
let dataset = {};
let fips;

let capitals = {};

let tableFirstId = 0;

let bigData;

d3.json('data/fipsToState.json').then(function (data) {
    fips = data;

    d3.json('data/capital.json').then(function (capitalData) {
        capitalData.states.forEach(function (d) {
            capitals[Number(fips[d.name])] = [d.long, d.lat];
        });
    });

    return data;


}).then(function (fips) {

    d3.json("data/mass-shootings-in-america.json").then(function (data) {

        // We store the Big data
        bigData = data;

        // Get the number of mass shootings
        numberOfMassShooting = data.length;

        // Populate the dataset
        data.forEach(function (d) {
            if (dataset.hasOwnProperty(Number(fips[d.fields.state]))) {
                dataset[Number(fips[d.fields.state])].push(d);
            } else {
                dataset[Number(fips[d.fields.state])] = [d];
            }
        });

        // Get the max number of shootings
        for (let id in dataset) {
            if (dataset[id].length > maxNumberMassShootingPerState) {
                maxNumberMassShootingPerState = dataset[id].length;
            }
        }

        // Make the scaling method to get the size of the dot fo mass shootings
        scaleProportionShootingsPerState = d3.scaleSqrt().domain([0, maxNumberMassShootingPerState]).range([1, 20]);


        Promise.resolve(d3.json('javascripts/us.json')).then(ready);

    });

});

// SVGs

var svgTitle = d3.select('.viz').append('svg')
    .attr('class', 'center-container')
    .attr('height', 50)
    .attr('width', (width + width * 0.8) + 2 * margin.left + 2 * margin.right)
    .attr('x', 0)
    .attr('y', 0);

svgTitle.append('g')
    .append('text')
    .text('Mass Shootings repartition in the US')
    .style('font-size', '35px')
    .attr('x', function () {

        return (width + width * 0.8) / 2 - d3.select(this).node().getBBox().width / 2;

    })
    .attr('y', function () {

        return 50 - d3.select(this).node().getBBox().height / 2;

    });

var svgMap = d3.select('.viz').append('svg')
    .attr('class', 'center-container')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right)
    .attr('x', 0)
    .attr('y', 0);

svgMap.append('rect')
    .attr('class', 'background center-container')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right)
    .on('click', clicked);

var svgGender = d3.select('.viz').append('svg')
    .attr('class', 'center-container')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width * 0.7 + margin.left + margin.right)
    .attr('transform', 'translate(5,0)');

var svgHisto = d3.select('.viz').append('svg')
    .attr('class', 'center-container')
    .attr('height', height * 0.7 + margin.top + margin.bottom)
    .attr('width', width * 0.7 + margin.left + margin.right)

var svgTable = d3.select('.viz').append('svg')
    .attr('overflow', 'auto')
    .attr('class', 'center-container')
    .attr('height', height * 0.7 + margin.top + margin.bottom)
    .attr('width', width * 1.1 + margin.left + margin.right)
    .append('g')
    .append("foreignObject")
    .attr('height', height * 0.7 + margin.top + margin.bottom)
    .attr('width', width * 1.1 + margin.left + margin.right)
    .append("xhtml:body");

var projection = d3.geoAlbersUsa()
    .translate([width /2 , height / 2])
    .scale(width);

var path = d3.geoPath().projection(projection);

var g = svgMap.append("g")
    .attr('class', 'center-container center-items us-state')
    .attr('transform', 'translate('+margin.left+','+margin.top+')')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

function ready(us) {
    g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "county-boundary")
        .on("click", reset)
        .on('mouseover', function (d) {

            tableFirstId = 0;
            drawPieCharts(getStateDataForPie(currentId));
            setViewLabel(currentId);
            showTable(currentId);

        });

    g.append("g")
        .attr("id", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "state")
        .on("click", clicked)
        .on("mouseover", mouseOver)
        .on('mouseout', mouseOut);

    g.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("id", "state-borders")
        .attr("d", path);

    // Legend plot
    g.append("text")
        .attr('y', function (d) {
            return g.node().getBBox().height + 50;
        })
        .style('font-style', 'italic')
        .text(function (d) {
            return "Fig. 1 : Map of the United States Of America representing mass shooting proportion per state";
        }).attr('x', function () {
            return 0;
        });

    // We plot the points representing the density of the mass shootings per states
    for (let id in dataset) {
        g.append("g").append("circle")
            .attr("fill", "red")
            .attr("stroke", "red")
            .attr("stroke-width", "2")
            .style("opacity", 0.5)
            .attr("r", function (d) {
                return scaleProportionShootingsPerState(dataset[id].length);
            })
            .attr("class", "statesPoints")
            .attr("cx", function (d) {
                return projection(capitals[Number(id)])[0];
                //return projection(dataset[id][0].geometry.coordinates)[0];
            })
            .attr("cy", function (d) {
                return projection(capitals[Number(id)])[1];
                //return projection(dataset[id][0].geometry.coordinates)[1]
            })
            .on('mouseover', function () {
                mouseOver({id : Number(id)});
            })
            .on('mouseout', reset());
    }


    // Then I need to make the scaling map
    let circles = [1, 10, 20, 30, 34];

    let count = 0;
    let step = 0;

    circles.forEach(function (circleValue) {

        g.append("circle")
            .attr('r', scaleProportionShootingsPerState(circleValue))
            .attr('cx', 20)
            .style('opacity', 0.5)
            .attr('cy', function (d) {
                return 300 - step;
            })
            .attr('fill', "red");

        g.append("text")
            .attr('x', 50)
            .attr('y', function (d) {
                return 300 - step + (scaleProportionShootingsPerState(circleValue) * 0.5);
            })
            .text(function (d) {
                return  circleValue;
            });

        step += (2 * scaleProportionShootingsPerState(circleValue) + 15);

        count++;

    });

    g.append("text")
        .attr('x', 0)
        .attr('y', function (d) {
            return 300 + 30;
        })
        .text("Proportion of mass shootings");

    tableFirstId = 0;
    drawPieCharts(getStateDataForPie(0));
    setViewLabel(0);
    showTable(0);
}

function mouseOver(d) {
    tableFirstId = 0;
    drawPieCharts(getStateDataForPie(d.id));
    setViewLabel(d.id);
    showTable(d.id);
}

function mouseOut(d) {
    tableFirstId = 0;
    drawPieCharts(getStateDataForPie(0));
    setViewLabel(0);
    showTable(0);
}

function clicked(d) {

    currentId = 0;

    if (d3.select('.background').node() === this) return reset();

    if (active.node() === this) return reset();

    currentId = d.id;

    tableFirstId = 0;
    drawPieCharts(getStateDataForPie(d.id));
    setViewLabel(d.id);
    showTable(d.id);

    active.classed("active", false);
    active = d3.select(this).classed("active", true);

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

    g.transition()
        .duration(1000)
        .style("stroke-width", 1.5 / scale + "px")
        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

    d3.selectAll(".pointsToView").remove();

    // Now we need to show the points of where the mass shooting come from

    // If there is not shooting we abort
    if (dataset[d.id]) {

        dataset[d.id].forEach(function (data) {

            g.append("circle")
                .attr("fill", "red")
                .attr("r", 2)
                .attr("class", "pointsToView")
                .style("opacity", 0.5)
                .attr("cx", function (d) {
                    return projection(data.geometry.coordinates)[0];
                })
                .attr("cy", function (d) {
                    return projection(data.geometry.coordinates)[1]
                });

            // We need to show the infos about this or this mass shooting

        });

    }

    // Hide the states dots
    d3.selectAll(".statesPoints").transition().duration(750).style('visibility', "hidden");
}

function reset() {
    active.classed("active", false);
    active = d3.select(null);

    d3.selectAll(".pointsToView").transition().duration(750).remove();
    d3.selectAll(".statesPoints").transition().delay(750).duration(1500).style('visibility', "visible");

    g.transition()
        .duration(750)
        .style("stroke-width", "1.5px")
        .attr('transform', 'translate('+margin.left+','+margin.top+')');
}

// History of Mental Illness - General
// Type of Gun - General
// Shooter Race
// Shooter Sex

// 4 Charts

function drawPieCharts(data) {

    if (!data) {
        return;
    }

    let radius = 100;
    let color = d3.scaleOrdinal(d3.schemeCategory10);
    let pie = d3.pie().value(function(d) {return d.value; }).sort(null);
    let arc = d3.arc().innerRadius(radius - 60).outerRadius(radius - 20);

    let g;
    let path;
    let text;
    let circle;

    let count = 0;

    svgGender.selectAll("*").remove();

    let max = 0;
    for(let key in data[0].data) {
        max += data[0].data[key].value;
    }

    for (let i = 0; i < 2; i++) {

        for (let j = 0; j < 2; j++) {

            g = svgGender.append("g")
                .attr('class', 'center-container')
                //.attr("transform", "translate(" + (radius * (2 * i + 1)) + "," + radius + ")")
                .attr("transform", "translate(" + (radius * (3 * i + 1)) + "," + ((2 * j + 1) * radius) + ")")
                .attr('width', width * 0.8 + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom);

            path = g.datum(data[count].data).selectAll("path")
                .data(pie)
                .enter().append("path")
                .attr("fill", function(d, i) { return color(i); })
                .attr("d", arc)
                .on('mouseover', function (d) {
                    d3.select(this.parentNode).append('text')
                        .text(function () {
                            return (Math.round((d.value / max) * 100)).toFixed(2) + "%";
                        })
                        .attr('id', 'tempText')
                        .attr('x', function () {
                            return - (d3.select(this).node().getBBox().width / 2);
                        })
                        .attr('y', function () {
                            return (d3.select(this).node().getBBox().height / 2);
                        })
                }).on('mouseout', function (d) {
                    d3.select(this.parentNode).selectAll('#tempText').remove();
                })
                .each(function(d) { this._current = d; });

            circle = g.datum(data[count].data).selectAll("circle")
                .data(function (d) {
                    return d;
                })
                .enter()
                .append("circle")
                .attr('r', 10)
                .attr('cx', radius * 1)
                .attr('cy', function (d) {
                    return (radius * 0.5) + (d.id * -25);
                })
                .attr('fill', function (d) {
                    return color(d.id);
                });

            g.datum(data[count].data).selectAll("text")
                .data(function (d) {
                    return d;
                }).enter()
                .append("text")
                .attr('x', radius * 1.15)
                .attr('y', function (d) {
                    return ((radius * 0.5) + (d.id * -25)) + 5;
                })
                .text(function (d) {
                    return d.title;
                });

            text = g.append("text")
                .attr('y', function (d) {
                    return radius;
                })
                .style('font-style', 'italic')
                .text(function (d) {
                    return "Fig. " + (count + 2) + " : " + data[count].title;
                }).attr('x', function () {
                    return - (radius * 0.75);
                });

            count++;
        }
    }
}

function setViewLabel(id) {

    // Know which state we are focusing on
    svgGender.append("g")
        .append("text")
        .attr('id', 'stateText')
        .text(function () {

            if (id == 0) {
                return 'Global view';
            } else {
                if (id < 10) {
                    return getKeyByValue(fips, "0" + id) + '\'s view';
                }
                return getKeyByValue(fips, "" + id) + '\'s view';
            }

        })
        .style('font-size', '32px')
        .attr('y', function () {
            //return (d3.select(this).node().getBBox().height);
            return svgGender.node().getBBox().height + d3.select(this).node().getBBox().height;
        })
        .attr('x', function () {
            return svgGender.node().getBBox().width / 2 - d3.select(this).node().getBBox().width / 2;
        });

}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

// Titles

// Table here

// Number of shooting
// Number of victims
// Age
// Date
// City
// Fate of shooter

// Show Table
function showTable(stateID) {

    let theData;

    if (stateID == 0) {
        theData = bigData;
    } else {
        theData = dataset[stateID];
    }

    // If there is no shooting we return
    if (theData.length == 0) {
        return;
    }

    /*

    let dataToDisplay = [];

    let date;
    let age;
    let city;
    let fate;
    let victims;

    theData.forEach(function (d) {

        date = "Unknown";
        age = "Unknown";
        city = "Unknown";
        fate = "Unknown";
        victims = "Unknown";

        if (d.fields.date) {
            date = d.fields.date;
        }

        if (d.fields.average_shooter_age) {
            age = d.fields.average_shooter_age;
        }

        if (d.fields.city) {
            city = d.fields.city;
        }

        if (d.fields.fate_of_shooter_at_the_scene) {
            fate = d.fields.fate_of_shooter_at_the_scene;
        }

        if (d.fields.number_of_victims_injured) {
            victims = d.fields.number_of_victims_injured;
        }

        dataToDisplay.push([date, age, city, fate, victims]);
    });

     */

    svgTable.selectAll('table').remove();

    let table = svgTable
            .append("table")
            .attr("class", "table table-condensed table-striped");

    let thead = table.append("thead");
    thead.html('<th>Date</th><th>City</th><th>Age of shooter</th><th>Number of victims</th><th>Fate of Shooter</th>');

    let tbody = table.append("tbody")
        .on("wheel.zoom", function () {

            var direction = d3.event.wheelDelta < 0 ? 'down' : 'up';
            console.log(direction);

            if (direction === 'up') {
                tableFirstId--;
            } else {
                tableFirstId++;
            }

            showTable(currentId);

            //console.log("eaez");


        });

    /*

    var header = thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(function(d){ return d;})

    */

    /*

    dataToDisplay.forEach(function (d) {

        tbody.append('tr')
            .html(function () {

                return '<td>5<td>';

            })
    });

     */

    /*

    var cells = rows.selectAll("td")
        .data(function(row){
            console.log(row);
        })
        .enter()
        .append("td")
        .html(function(d){ return d.value;});

     */

    let date;
    let age;
    let city;
    let fate;
    let victims;

    if (tableFirstId >= theData.length) {
        tableFirstId --;
    }

    if (tableFirstId < 0) {
        tableFirstId = 0;
    }

    theData.slice(tableFirstId, tableFirstId + 9).forEach(function (d) {

        date = "Unknown";
        age = "-";
        city = "Unknown";
        fate = "Unknown";
        victims = "-";

        if (d.fields.date) {
            date = d.fields.date;
        }

        if (d.fields.average_shooter_age) {
            age = d.fields.average_shooter_age;
        }

        if (d.fields.city) {
            city = d.fields.city;
        }

        if (d.fields.fate_of_shooter_at_the_scene) {
            fate = d.fields.fate_of_shooter_at_the_scene;
        }

        if (d.fields.number_of_victims_injured) {
            victims = d.fields.number_of_victims_injured;
        }

        tbody.append('tr')
            .html(function () {

                return '<td>' + date + '</td>' + '<td>' + city + '</td>' + '<td>' + age + '</td>' + '<td>' + victims + '</td>' + '<td>' + fate + '</td>';

            })

    });

    /*

    theData.forEach(function (d) {

        date = "Unknown";
        age = "-";
        city = "Unknown";
        fate = "Unknown";
        victims = "-";

        if (d.fields.date) {
            date = d.fields.date;
        }

        if (d.fields.average_shooter_age) {
            age = d.fields.average_shooter_age;
        }

        if (d.fields.city) {
            city = d.fields.city;
        }

        if (d.fields.fate_of_shooter_at_the_scene) {
            fate = d.fields.fate_of_shooter_at_the_scene;
        }

        if (d.fields.number_of_victims_injured) {
            victims = d.fields.number_of_victims_injured;
        }

        tbody.append('tr')
            .html(function () {

                return '<td>' + date + '</td>' + '<td>' + city + '</td>' + '<td>' + age + '</td>' + '<td>' + victims + '</td>' + '<td>' + fate + '</td>';

            })

    });

     */
}

function getStateDataForPie(stateID) {

    let dataToReturn = [];

    // History of Mental Illness - General
    // Type of Gun - General
    // Shooter Race
    // Shooter Sex

    let mentalIllness = {};
    let typeOfGun = {};
    let shooterRace = {};
    let shooterSex = {};

    let dataToLoop;

    if (stateID == 0) {
        dataToLoop = bigData;
    } else {
        if (!dataset[stateID]) {return;}

        dataToLoop = dataset[stateID];
    }

    dataToLoop.forEach(function (d) {

        // Mental Illness - fields.history_of_mental_illness_general
        if ((d['fields']['history_of_mental_illness_general'].indexOf('Yes') !== -1)) {
            if (mentalIllness['Yes']) {
                mentalIllness['Yes']++;
            } else {
                mentalIllness['Yes'] = 1;
            }
        } else if ((d['fields']['history_of_mental_illness_general'].indexOf('Unknown') !== -1)) {
            if (mentalIllness['Unknown']) {
                mentalIllness['Unknown']++;
            } else {
                mentalIllness['Unknown'] = 1;
            }
        } else {
            if (mentalIllness['No']) {
                mentalIllness['No']++;
            } else {
                mentalIllness['No'] = 1;
            }
        }

        // Type of Gun
        if ((d['fields']['type_of_gun_general'].indexOf('Handgun') !== -1)) {
            if (typeOfGun['Handgun']) {
                typeOfGun['Handgun']++;
            } else {
                typeOfGun['Handgun'] = 1;
            }
        } else if ((d['fields']['type_of_gun_general'].indexOf('Multiple') !== -1)) {
            if (typeOfGun['Multiple Guns']) {
                typeOfGun['Multiple Guns']++;
            } else {
                typeOfGun['Multiple Guns'] = 1;
            }
        } else if ((d['fields']['type_of_gun_general'].indexOf('Rifle') !== -1)) {
            if (typeOfGun['Rifle']) {
                typeOfGun['Rifle']++;
            } else {
                typeOfGun['Rifle'] = 1;
            }
        } else if ((d['fields']['type_of_gun_general'].indexOf('Shotgun') !== -1)) {
            if (typeOfGun['Shotgun']) {
                typeOfGun['Shotgun']++;
            } else {
                typeOfGun['Shotgun'] = 1;
            }
        } else {
            if (typeOfGun['Unknown']) {
                typeOfGun['Unknown']++;
            } else {
                typeOfGun['Unknown'] = 1;
            }
        }

        // Shooter race
        if ((d['fields']['shooter_race'].indexOf('White') !== -1)) {
            if (shooterRace['White']) {
                shooterRace['White']++;
            } else {
                shooterRace['White'] = 1;
            }
        } else if ((d['fields']['shooter_race'].indexOf('Black') !== -1)) {
            if (shooterRace['Black']) {
                shooterRace['Black']++;
            } else {
                shooterRace['Black'] = 1;
            }
        } else if ((d['fields']['shooter_race'].indexOf('Asian') !== -1)) {
            if (shooterRace['Asian']) {
                shooterRace['Asian']++;
            } else {
                shooterRace['Asian'] = 1;
            }
        } else if ((d['fields']['shooter_race'].indexOf('Native') !== -1)) {
            if (shooterRace['Native']) {
                shooterRace['Native']++;
            } else {
                shooterRace['Native'] = 1;
            }
        } else {
            if (shooterRace['Other']) {
                shooterRace['Other']++;
            } else {
                shooterRace['Other'] = 1;
            }
        }

        // Shooter sex
        if ((d['fields']['shooter_sex'].indexOf('Male') !== -1)) {
            if (shooterSex['Male']) {
                shooterSex['Male']++;
            } else {
                shooterSex['Male'] = 1;
            }
        } else if ((d['fields']['shooter_sex'].indexOf('Female') !== -1)) {
            if (shooterSex['Female']) {
                shooterSex['Female']++;
            } else {
                shooterSex['Female'] = 1;
            }
        } else {
            if (shooterSex['Unknown']) {
                shooterSex['Unknown']++;
            } else {
                shooterSex['Unknown'] = 1;
            }
        }

    });

    let mentalIllnessArray = [];
    let typeOfGunArray = [];
    let shooterRaceArray = [];
    let shooterSexArray = [];

    let i = 0;
    for (key in mentalIllness) {
        mentalIllnessArray.push({id : i, title : key, value : mentalIllness[key]});
        i++;
    }

    mentalIllnessArray.sort(function (a, b) {
        return a.value > b.value;
    });

    i = 0;
    for (key in typeOfGun) {
        typeOfGunArray.push({id : i, title : key, value : typeOfGun[key]});
        i++;
    }

    typeOfGunArray.sort(function (a, b) {
        return a.value > b.value;
    });

    i = 0;
    for (key in shooterRace) {
        shooterRaceArray.push({id : i, title : key, value : shooterRace[key]});
        i++;
    }

    shooterRaceArray.sort(function (a, b) {
        return a.value > b.value;
    });

    i = 0;
    for (key in shooterSex) {
        shooterSexArray.push({id : i, title : key, value : shooterSex[key]});
        i++;
    }

    shooterSexArray.sort(function (a, b) {
        return a.value > b.value;
    });

    return [{title : 'Shooter mentally ill ?', data : mentalIllnessArray}, {title : 'Type of gun', data : typeOfGunArray}, {title : 'Race of shooter', data : shooterRaceArray}, {title : 'Sex of shooter', data : shooterSexArray}];
}