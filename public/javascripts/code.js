let margin = {top: 10, bottom: 10, left: 10, right:10};

let width = 960;
    width = width - margin.left - margin.right;

let mapRatio = 0.5;
let height = width * mapRatio;
let active = d3.select(null);

let currentId = 0;

let globalPopulation = {"Alabama":4779736,"Alaska":710231,"Arizona":6392017,"Arkansas":2915918,"California":37253956,"Colorado":5029196,"Connecticut":3574097,"Delaware":897934,"District of Columbia":601723,"Florida":18801310,"Georgia":9687653,"Hawaii":1360301,"Idaho":1567582,"Illinois":12830632,"Indiana":6483802,"Iowa":3046355,"Kansas":2853118,"Kentucky":4339367,"Louisiana":4533372,"Maine":1328361,"Maryland":5773552,"Massachusetts":6547629,"Michigan":9883640,"Minnesota":5303925,"Mississippi":2967297,"Missouri":5988927,"Montana":989415,"Nebraska":1826341,"Nevada":2700551,"New Hampshire":1316470,"New Jersey":8791894,"New Mexico":2059179,"New York":19378102,"North Carolina":9535483,"North Dakota":672591,"Ohio":11536504,"Oklahoma":3751351,"Oregon":3831074,"Pennsylvania":12702379,"Rhode Island":1052567,"South Carolina":4625364,"South Dakota":814180,"Tennessee":6346105,"Texas":25145561,"Utah":2763885,"Vermont":625741,"Virginia":8001024,"Washington":6724540,"West Virginia":1852994,"Wisconsin":5686986,"Wyoming":563626};

let minPopulation = globalPopulation['Alabama'];
let maxPopulation = globalPopulation['Alabama'];

for(key in globalPopulation) {
    if (globalPopulation[key] > maxPopulation) {
        maxPopulation = globalPopulation[key];
    }

    if (globalPopulation[key] < minPopulation) {
        minPopulation = globalPopulation[key];
    }
}

let statesPopulationColor = d3.scaleLinear()
    .domain([minPopulation, maxPopulation])
    .range(["#b2dffb", '#0c084c']);


let scaleProportionShootingsPerState;
let scaleColor = d3.scaleLinear()
    .domain([0, 5, 10])
    .range(['#5c7658', '#e6d385', '#d25959']);

// Male, Female, Male/Female, Unknown
let colorsSex = {"Male" : "#00adb5", "Female" : '#ff2e63', "Unknown" : "#8785a2"};
let colorsRace = {"White" : "#00adb5", "Black" : '#ff2e63', "Asian" : '#fce38a', "Native" : "#8785a2", "Other" : "#758184"};

// Now we need to gather all the data and we set it them in a dataset with the id os the state as the key
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

let svgTitle = d3.select('.viz').append('svg')
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

let svgMap = d3.select('.viz').append('svg')
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

let svgGender = d3.select('.viz').append('svg')
    .attr('class', 'center-container')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width * 0.6 + margin.left + margin.right)
    //.attr('transform', 'translate(5,0)');

let svgSkull = d3.select('.viz').append('svg')
    .attr('class', 'center-container')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width * 0.2);

svgSkull.append('g')
    .attr('transform', 'translate(0, 150) scale(0.02, -0.02)')
    .append('path')
    .style('opacity', 0.9)
    .attr('fill', 'red')
    .attr('id', 'skull')
    .attr('d', "M4548.9,4997c-1351.6-189.5-2337.7-875.5-2662.7-1850.3c-160.2-489.7-133.1-1130.5,79-1839.1c144.4-478.4,148.9-507.7,153.4-801.1c2.3-155.7-4.5-318.2-13.5-363.3C2091.6,71,2078,59.7,1983.3,30.4c-133.1-40.6-191.8-117.3-205.3-275.3c-18.1-234.7,121.9-609.3,327.2-859.7c135.4-167,232.4-216.6,471.6-248.2c137.6-15.8,191.8-31.6,198.6-56.4c31.6-103.8,171.5-877.8,194.1-1062.8c15.8-126.4,18-311.4,9-453.6c-11.3-191.8-6.8-264,24.8-370.1c137.7-473.9,559.6-952.2,1186.9-1347.1c112.8-72.2,241.4-135.4,282.1-144.4c49.6-9,153.4,4.5,279.8,33.8c246,58.7,234.7,58.7,494.2-2.3c261.7-58.7,300.1-51.9,577.7,121.9C6406-4270.5,6868.6-3747,6990.5-3311.5c33.8,126.4,38.4,196.3,27.1,422c-13.5,295.6,22.6,607,144.4,1207.2l63.2,304.6l189.6,24.8c106.1,13.5,234.7,47.4,286.6,72.2c173.8,90.3,408.4,464.9,491.9,783c40.6,162.5,40.6,243.7,0,361c-36.1,99.3-90.3,146.7-212.1,180.5c-79,22.6-81.2,29.3-99.3,158c-11.3,74.5-13.5,250.5-6.8,390.4c11.3,203.1,29.3,302.4,90.3,496.4c437.8,1362.9,300.1,2258.8-460.3,2992.1c-435.5,419.7-1026.7,713.1-1737.5,859.7c-223.4,47.4-363.3,60.9-676.9,67.7C4873.8,5012.8,4630.1,5008.3,4548.9,4997z M3973.5,1111.3c322.7-169.2,453.6-543.8,297.9-857.5c-155.7-315.9-521.3-482.9-1112.5-507.7c-273-11.3-306.9-9-397.1,33.8C2642.2-161.4,2597-89.2,2563.2,98.1c-29.3,169.2-13.5,383.6,47.4,582.2c56.4,185,198.6,315.9,431,399.4c234.7,85.8,338.5,101.5,593.5,94.8C3826.8,1169.9,3876.5,1160.9,3973.5,1111.3z M6719.7,1149.6c194-40.6,431-146.7,521.2-232.4c133.1-126.4,196.3-325,196.3-625.1c0-442.3-99.3-552.9-500.9-552.9c-361,0-622.8,54.2-859.7,176c-340.7,176-487.4,478.4-388.1,807.8c58.7,196.3,225.7,365.5,424.2,428.7C6243.6,1192.5,6521.1,1190.2,6719.7,1149.6z M5131.1-159.1c115.1-97,433.3-907.1,433.3-1098.9c-2.2-121.8-74.5-252.7-164.7-297.8c-72.2-33.8-90.3-33.8-160.2-4.5c-81.3,33.8-180.5,164.7-207.6,270.8c-20.3,81.2-36.1,74.5-81.3-38.4c-47.4-112.8-135.4-214.4-214.4-243.7c-81.2-31.6-209.8,36.1-259.5,137.6c-60.9,121.9-49.6,255,51.9,552.8c117.3,352,268.5,665.7,347.5,728.8C4957.3-86.9,5049.9-89.2,5131.1-159.1z M3429.7-1452.1c112.8-65.4,151.2-142.2,173.8-343c11.3-101.6,31.6-227.9,45.1-277.6c13.5-51.9,31.6-198.6,40.6-324.9c13.5-232.4,42.9-313.6,94.8-261.7c13.5,13.5,31.6,94.8,38.3,180.5c11.3,155.7,33.8,198.6,90.3,167c24.8-13.6,33.9-72.2,36.1-223.4c2.3-162.5,11.3-214.4,42.9-246c36.1-36.1,40.6-36.1,79,0c29.3,31.6,38.4,79,38.4,230.2c0,203.1,27.1,252.7,99.3,180.5c27.1-27.1,33.8-74.5,27.1-214.4c-6.8-198.6,29.3-293.3,108.3-293.3c79,0,103.8,63.2,103.8,264c0,158,6.8,189.6,40.6,200.8c70,22.6,133.1-13.6,119.6-67.7c-29.3-119.6-38.4-300.1-15.8-356.6c45.1-119.6,279.8-103.8,309.1,20.3c9,33.8,6.8,130.9-4.5,214.4l-22.6,153.4l72.2,13.5c40.6,6.8,94.8,6.8,121.9-2.3c45.1-13.5,47.4-24.8,31.6-169.2c-6.8-85.7-9-180.5,0-214.4c18-69.9,103.8-108.3,207.6-88c99.3,18,126.4,108.3,97,318.2c-22.6,151.2-11.3,185,63.2,187.3c76.7,0,85.7-22.6,79-187.3c-6.8-191.8,24.8-275.3,108.3-275.3c88,0,117.3,83.5,106.1,300.1c-9,169.2-6.8,187.3,33.8,209.9c24.8,13.5,54.2,15.8,63.2,4.5c11.3-9,22.6-101.5,27.1-203.1c4.5-139.9,18-196.3,47.4-225.7c36.1-36.1,40.6-36.1,79,0c31.6,31.6,38.4,79,38.4,243.7c0,160.2,6.8,207.6,33.8,223.4c60.9,33.8,83.5-6.8,94.8-162.5c9-164.7,42.9-227.9,92.5-180.5c15.8,18.1,29.4,108.3,31.6,236.9c4.5,115.1,22.6,261.8,40.6,327.2c18,67.7,38.4,196.3,47.4,291.1c22.6,255,124.1,370.1,347.5,403.9l101.5,13.5l-56.4-40.6c-31.6-22.6-63.2-51.9-72.2-63.2c-9-13.5-18-162.5-18-331.7c0-230.2-11.3-349.8-45.1-480.6c-47.4-187.3-187.3-478.4-291.1-600.2l-63.2-76.7l-15.8,103.8c-15.8,106.1-56.4,146.7-101.5,101.5c-13.6-13.5-24.8-103.8-24.8-212.1c0-160.2-6.8-189.5-42.9-209.8c-67.7-36.1-70-31.6-70,121.9c0,97-11.3,151.2-33.9,171.5c-97,81.2-173.8-72.2-133.1-270.8c20.3-94.8,18-117.3-13.6-146.7c-81.2-72.2-103.8-45.1-94.8,121.9c9,135.4,2.3,162.5-38.3,203.1c-60.9,60.9-124.1,60.9-185,0c-42.9-42.9-47.4-67.7-40.6-232.4c9-176,6.8-182.8-42.9-189.5c-103.8-15.8-112.8,2.2-76.7,148.9c27.1,115.1,27.1,144.4,0,198.6c-27.1,60.9-40.6,65.4-153.4,65.4c-110.5,0-126.3-6.8-155.7-60.9c-31.6-56.4-31.6-76.7,2.2-203.1c38.4-153.4,31.6-176-72.2-176c-94.8,0-117.3,27.1-90.3,103.8c36.1,90.3,36.1,270.8,0,311.4c-18.1,24.8-65.4,36.1-137.7,36.1c-178.3,0-209.8-94.8-130.9-381.4c11.3-38.3-51.9-56.4-126.4-38.3c-49.6,13.5-51.9,20.3-29.3,97c69.9,255-67.7,462.6-209.9,320.4c-38.4-38.4-45.1-70-40.6-196.3c6.8-160.2-18.1-196.3-97-135.4c-31.6,24.8-33.8,49.6-13.5,164.7c24.8,146.7,0,250.5-60.9,273c-67.7,27.1-101.5-33.8-101.5-185c0-153.5-2.3-158-70-121.9c-36.1,20.3-42.9,49.6-42.9,191.8c0,191.8-13.5,236.9-67.7,236.9c-40.6,0-67.7-58.7-67.7-151.2c0-83.5-29.3-60.9-130.9,94.8c-214.4,322.7-275.3,541.6-275.3,992.9c0,173.8-9,327.2-18,340.7c-9,11.3-40.6,40.6-72.2,63.2l-56.4,40.6l101.5-13.5C3319.1-1407,3393.6-1431.8,3429.7-1452.1z")

let svgHisto = d3.select('.viz').append('svg')
    .attr('class', 'center-container')
    .attr('height', height * 0.6 + 4 * margin.top + 4 * margin.bottom)
    .attr('width', width * 0.7 + margin.left + margin.right);

let svgTable = d3.select('.viz').append('svg')
    .attr('overflow', 'auto')
    .attr('class', 'center-container')
    .attr('height', height * 0.7 + margin.top + 2 * margin.bottom)
    .attr('width', width * 1.1 + margin.left + margin.right)
    .append('g')
    .append("foreignObject")
    .attr('height', height * 0.7 + margin.top + margin.bottom)
    .attr('width', width * 1.1 + margin.left + margin.right)
    .append("xhtml:body");

let projection = d3.geoAlbersUsa()
    .translate([width /2 , height / 2])
    .scale(width);

let path = d3.geoPath().projection(projection);

let g = svgMap.append("g")
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
            showBarChart(currentId);
        });

    g.append("g")
        .attr("id", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr('fill', function (d) {

            // If the id's are 72 or 78 we pass because it is Puerto Rico and United States Virgin Islands
            if (!(d.id === 72 || d.id === 78)) {
                if (d.id < 10) {
                    //console.log(globalPopulation[getKeyByValue(fips, "0" + d.id)]);
                    return statesPopulationColor(globalPopulation[getKeyByValue(fips, "0" + d.id)]);
                } else {
                    //console.log(globalPopulation[getKeyByValue(fips, "" + d.id)]);
                    return statesPopulationColor(globalPopulation[getKeyByValue(fips, "" + d.id)]);
                }
            }
        })
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
            })
            .attr("cy", function (d) {
                return projection(capitals[Number(id)])[1];
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
        .attr('y', 0)
        .text(minPopulation)
        .style('font-size', '12px');

    g.append("text")
        .attr('x', 120)
        .attr('y', 0)
        .text(maxPopulation)
        .style('font-size', '12px');

    g.append("text")
        .attr('x', 0)
        .attr('y', function (d) {
            return 300 + 30;
        })
        .text("Number of mass shootings");

    g.append("text")
        .attr('id', 'legendDensity')
        .attr('x', 15)
        .attr('y', function (d) {
            return 45;
        })
        .text("Population density");

    let rangeColorToPos = d3.scaleLinear()
        .range([0, d3.select("#legendDensity").node().getBBox().width])
        .domain([minPopulation, maxPopulation]);

    let rangeColor = d3.range(minPopulation, maxPopulation, 100000);
    g.selectAll('rect')
        .data(rangeColor)
        .enter()
        .append('rect')
        .attr('x', function(d) {
            return 15 + rangeColorToPos(d);
        })
        .attr('width', 11)
        .attr('height', 15)
        .style('fill', function(d) {
            return statesPopulationColor(d);
        })
        .attr('y', '10');

    tableFirstId = 0;
    drawPieCharts(getStateDataForPie(0));
    setViewLabel(0);
    showTable(0);
    showBarChart(0);
}

function mouseOver(d) {
    tableFirstId = 0;
    drawPieCharts(getStateDataForPie(d.id));
    setViewLabel(d.id);
    showTable(d.id);
    showBarChart(d.id);
}

function mouseOut(d) {
    tableFirstId = 0;
    drawPieCharts(getStateDataForPie(0));
    setViewLabel(0);
    showTable(0);
    showBarChart(0);
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
    showBarChart(d.id);

    active.classed("active", false);
    active = d3.select(this).classed("active", true);

    let bounds = path.bounds(d),
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
                .attr("fill", function(d, i) {

                    // Race
                    if (count === 2) {
                        return colorsRace[d.data.title];
                    }

                    // Sex
                    else if (count === 3) {
                        return colorsSex[d.data.title];
                    }
                    
                    return color(i);
                })
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
                    // Race
                    if (count === 2) {
                        return colorsRace[d.title];
                    }

                    // Sex
                    else if (count === 3) {
                        return colorsSex[d.title];
                    }

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

    d3.select("#stateDeaths").remove();

    let gSkull = svgSkull.append('g')
        .attr('id', 'stateDeaths');

    gSkull.append('text')
        .style('font-size', '64px')
        .style('opacity', 0.9)
        .style('fill', 'red')
        .text(function () {
            if (id == 0) {
                return bigData.length;
            } else {
                if (dataset[id]) {
                    return dataset[id].length;
                } else {
                    return 0;
                }
            }
        })
        .attr('y', function () {
            return d3.select('#skull').node().getBBox().height * 0.02 + 125;
        })
        .attr('x', function () {
            return (d3.select("#skull").node().getBBox().width * 0.02 - d3.select("#stateDeaths").node().getBBox().width) / 2 + d3.select("#skull").node().getBBox().x * 0.02;
        });

    gSkull.append('text')
        .style('font-size', '14px')
        .style('opacity', 0.9)
        .style('fill', 'red')
        .text("(Number of mass shootings)")
        .attr('y', function () {
            return d3.select('#skull').node().getBBox().height * 0.02 + 150;
        })
        .attr('x', function () {
            return (d3.select("#skull").node().getBBox().width * 0.02 - d3.select("#stateDeaths").node().getBBox().width) / 2 + d3.select("#skull").node().getBBox().x * 0.02;
        })

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
    if (!theData || theData.length == 0) {
        return;
    }

    svgTable.selectAll('table').remove();

    let table = svgTable
            .append("table")
            .attr("class", "table table-condensed table-striped");

    let thead = table.append("thead");
    thead.html('<th>Date</th><th>City</th><th>Age of shooter</th><th>Number of victims</th><th>Fate of Shooter</th>');

    let tbody = table.append("tbody")
        .on("wheel.zoom", function () {
            let direction = d3.event.wheelDelta < 0 ? 'down' : 'up';

            if (direction === 'up') {
                tableFirstId--;
            } else {
                tableFirstId++;
            }

            showTable(currentId);
        });

    let date, age, city, fate, victims;

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


    // Legend plot
    table.append('g').append("text")
        .attr("transform", "translate(0," + 60 + ")")
        .attr('y', function (d) {
            return 0;
        })
        .style('font-style', 'italic')
        .text(function (d) {
            if (stateID === 0) {
                return "Fig. 7 : Different mass shooting in the US";
            }
            if (stateID < 10) {
                return "Fig. 7 : Different mass shooting in " + getKeyByValue(fips, "0" + stateID);
            }
            return "Fig. 7 : Different mass shooting in " + getKeyByValue(fips, "" + stateID);
        }).attr('x', function () {
        return 0;
    });
}

function showBarChart(stateId) {

    svgHisto.selectAll("*").remove();

    let theData;

    if (stateId === 0) {
        theData = bigData;

    } else {
        theData = dataset[stateId];
    }

    // If there is no shooting we return
    if (!theData || theData.length === 0) {
        return;
    }

    let dataToDisplay = [];
    let shootingsPerYear = {};
    let year;

    theData.forEach(function (d) {
        year = d['fields']['date'].split("-")[0];

        if (stateId === 0) {
            if (Number(year) >= 2000) {
                if (shootingsPerYear[year]) {
                    shootingsPerYear[year]++;
                } else {
                    shootingsPerYear[year] = 1;
                }
            }
        } else {
            if (shootingsPerYear[year]) {
                shootingsPerYear[year]++;
            } else {
                shootingsPerYear[year] = 1;
            }
        }
    });

    for (key in shootingsPerYear) {
        dataToDisplay.push({year : key, value : shootingsPerYear[key]});
    }

    let colorScaleChart = d3.scaleLinear().domain([1, d3.max(dataToDisplay,  d => { return d.value; })]).range(['orange', 'red']);

    let barColor = d3.interpolateInferno(0.1);
    let highlightColor = d3.interpolateInferno(0.3);

    let gHisto = svgHisto.append("g")
        .attr("transform", "translate(" + (2.5 * margin.left) + "," + ( 3 * margin.top) + ")");

    let x = d3.scaleBand()
        .range([0, width * 0.7])
        .padding(0.4);

    let y = d3.scaleLinear()
        .range([height * 0.6, 0])
        .nice()
        .interpolate(d3.interpolateRound);

    let xAxis = d3.axisBottom(x).tickSize([]).tickPadding(10);
    let yAxis = d3.axisLeft(y).tickSize(1);

    x.domain(dataToDisplay.map( d => { return d.year; }));
    y.domain([0, d3.max(dataToDisplay,  d => { return d.value; })]);
    //y.domain(dataToDisplay.map( d => { return d.value; }));

    gHisto.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height * 0.6 + ")")
        .call(xAxis);
    gHisto.append("g")
        .attr("class","y axis")
        .call(yAxis);

    gHisto.selectAll(".bar")
        .data(dataToDisplay)
        .enter().append("rect")
        .attr("class", "bar")
        .style("display", d => { return d.value === null ? "none" : null; })
        .style("fill",  d => {
            return colorScaleChart(d.value);
        })
        .attr("x",  d => { return x(d.year); })
        .attr("width", x.bandwidth())
        .attr("y",  d => { return height * 0.6; })
        .attr("height", 0)
        .attr("y",  d => { return y(d.value); })
        .attr("height",  d => { return 0.6 * height - y(d.value); });

    // Labels
    gHisto.selectAll(".label")
        .data(dataToDisplay)
        .enter()
        .append("text")
        .attr("class", "label")
        .style("display",  d => { return d.value === null ? "none" : null; })
        .style('opacity', 0.9)
        .attr("x", ( d => { return x(d.year) + (x.bandwidth() / 2) -8 ; }))
        .attr("y",  d => { return height * 0.7; })
        .attr("height", 0)
        .text( d => { return d.value; })
        .attr("y",  d => { return y(d.value) + .1; })
        .attr("dy", "-.7em");

    // Legend plot
    svgHisto.append('g').append("text")
        .attr("transform", "translate(" + (margin.left) + "," + (height * 0.7 + margin.bottom * 2) + ")")
        .attr('y', function (d) {
            return 0;
        })
        .style('font-style', 'italic')
        .text(function (d) {
            if (stateId === 0) {
                return "Fig. 6 : Number of mass shootings per year in the US (values before 2000 not displayed)";
            }

            if (stateId < 10) {
                return "Fig. 6 : Number of mass shootings per year in " + getKeyByValue(fips, "0" + stateId);
            }
            return "Fig. 6 : Number of mass shootings per year in " + getKeyByValue(fips, "" + stateId);

        }).attr('x', function () {
        return 0;
    });
}

function getStateDataForPie(stateID) {
    // History of Mental Illness - General
    // Type of Gun - General
    // Shooter Race
    // Shooter Sex

    let mentalIllness = {};
    let typeOfGun = {};
    let shooterRace = {};
    let shooterSex = {};

    let dataToLoop;

    if (stateID === 0) {
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
    for (let key in mentalIllness) {
        mentalIllnessArray.push({id : i, title : key, value : mentalIllness[key]});
        i++;
    }

    mentalIllnessArray.sort(function (a, b) {
        return a.value > b.value;
    });

    i = 0;
    for (let key in typeOfGun) {
        typeOfGunArray.push({id : i, title : key, value : typeOfGun[key]});
        i++;
    }

    typeOfGunArray.sort(function (a, b) {
        return a.value > b.value;
    });

    i = 0;
    for (let key in shooterRace) {
        shooterRaceArray.push({id : i, title : key, value : shooterRace[key]});
        i++;
    }

    shooterRaceArray.sort(function (a, b) {
        return a.value > b.value;
    });

    i = 0;
    for (let key in shooterSex) {
        shooterSexArray.push({id : i, title : key, value : shooterSex[key]});
        i++;
    }

    shooterSexArray.sort(function (a, b) {
        return a.value > b.value;
    });

    return [{title : 'Shooter mentally ill ?', data : mentalIllnessArray}, {title : 'Type of gun', data : typeOfGunArray}, {title : 'Race of shooter', data : shooterRaceArray}, {title : 'Sex of shooter', data : shooterSexArray}];
}