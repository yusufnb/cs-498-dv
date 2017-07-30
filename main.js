var projection = d3.geoMercator();
var data = null;

var qualityOfLifeColors = null;

function getDomain(prop) {
	var scale = _.map(data.features, function(node) {
		if (node.properties[prop]) return node.properties[prop];
		else return null;
	});
	scale = _.uniq(scale);
	 return d3.extent(scale);
}

function setScales() {
	qualityOfLifeColors = d3.scaleLinear().domain(getDomain('Quality of Life Index')).range(['red','green']);
}

function loadData(csv, json) {
	var countries = json;
	var csvData = _.indexBy(d3.csvParse(csv), 'Country');
	countries.features = _.map(countries.features, function(node) {
		if (csvData[node.properties.name]) {
			var countryData = csvData[node.properties.name];
			for (var k in countryData) {
				if (k != 'Country') countryData[k] = countryData[k]*1;
			}
			node.properties = countryData;
		} else {
			node.properties = {Country: node.properties.name}
		}
		return node;
	});

	return countries;
}

function loadSlide1() {
	var svg = d3.select("#slide1 svg");

	var path = d3.geoPath()
		.projection(projection);

	var g = svg.append("g");

	g.selectAll("path")
		.data(data.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "country")
		.style("fill-opacity", 0.7)
		.style("fill", function(data){
			if (data.properties['Quality of Life Index']) {
				return qualityOfLifeColors(data.properties['Quality of Life Index']);
			}
			else return "lightgrey";
		}).on('mouseover', function(d, i){
			d3.select(this).style('fill-opacity', 1);
			$('#map-help').hide();
			$('#country-name').text(d.properties['Country']);
			var prop = $('#country-properties').empty();
			_.each(d.properties, function(v, k) {
				prop.append("<li><b>"+k+":</b> " + v + "</li>")
			});
		}).on('mouseout', function(d, i) {
			g.selectAll("path").style('fill-opacity', 0.7);
			$('#country-name').empty();
			$('#country-properties').empty();
			$('#map-help').show();
		});

}


function loadSlide2() {
	var svgMap = d3.select("#slide2 #svg-custom");

	$("#svg-prop-bar").empty();
	var svgBar = d3.select("#slide2 #svg-prop-bar");

	var tip = d3.select("body").append("div")	
	    .attr("class", "tooltip")				
	    .style("opacity", 0);

	var index = $('#custom-index').val();
	var order = $('#custom-index option:selected').attr('data-order') == 'desc' ? 1 : -1;
	var indexDomain = getDomain(index);
	if (order == -1) indexDomain.reverse();
	var indexDomain = d3.scaleLinear().domain(indexDomain);

	// Get countries in order of index
	data.features.sort(function(a, b) {
		if (a.properties[index] && b.properties[index]) {
			if (a.properties[index] < b.properties[index]) return 1 * order;
			if (a.properties[index] > b.properties[index]) return -1 * order;
			return 0;
		}
		if (a.properties[index]) return -1;
		if (b.properties[index]) return 1;
		return 0;
	});

	// Draw the map
	var indexColors = indexDomain.range(['red','green']);

	var path = d3.geoPath()
		.projection(projection);

	var g = svgMap.append("g");

	g.selectAll("path")
		.data(data.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "country")
		.style("fill-opacity", 0.7)
		.style("fill", function(d, i){
			if (d.properties[index]) {
				return indexColors(d.properties[index]);
			}
			else return "lightgrey";
		})
		.on('mouseover', function(d,i) {
			d3.select(this).style('fill-opacity', 1);
			var propText = ['<table>'];
			_.each(d.properties, function(v, k) {
				propText.push('<tr><td>' + k.replace('Index', '').trim() + "</td><td>" + v + "</td></tr>");
			});
			propText.push('</table>');
			tip.transition()		
                .duration(200)		
                .style("opacity", .9);
            tip	.html(propText.join(''))
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");
		})
		.on('mousemove', function(d, i){
			tip.style("left", (d3.event.pageX) + "px")
		       .style("top", (d3.event.pageY - 28) + "px")			
		})
		.on('mouseout', function(d,i) {
			g.selectAll("path").style('fill-opacity', 0.7);
			tip.transition()		
                .duration(500)		
                .style("opacity", 0);	
		})

		// Draw the bar chart for selected index
		var topData = data.features.slice(0, 20);

		var barHeight = d3.scaleLinear().domain([topData[0].properties[index], topData[19].properties[index]]).range([300,10]);

		var barWidth = $('#svg-prop-bar').width() / topData.length;

		var height = $('#svg-prop-bar').height();


		var bar = svgBar.selectAll("g")
					.data(topData)
					.enter().append("g")
					.attr("transform", function(d, i) { return "translate("+i*barWidth+",0)"})
					.append("rect")
					.attr("y", function(d, i) { return  height - barHeight(d.properties[index]); })
					.attr("height", function(d, i) { return barHeight(d.properties[index]); })
					.attr("width", barWidth - 1)
					.style("fill", function(d, i){
						return indexColors(d.properties[index]);
					}).on('mouseover', function(d,i) {
						var propText = ['<table>'];
						var country = d.properties.Country;
						var indexData = d.properties[index];
						propText.push('<tr><td>Country: ' + "</td><td>" + country + "</td></tr>");
						propText.push('<tr><td>' + index.replace('Index','') + ': ' + "</td><td>" + indexData + "</td></tr>");
						_.each(d.properties, function(v, k) {
							
						});
						propText.push('</table>');
						tip.transition()		
			                .duration(200)		
			                .style("opacity", .9);
			            tip	.html(propText.join(''))
			                .style("left", (d3.event.pageX) + "px")		
			                .style("top", (d3.event.pageY - 28) + "px");
					})
					.on('mousemove', function(d, i){
						tip.style("left", (d3.event.pageX) + "px")
					       .style("top", (d3.event.pageY - 28) + "px")			
					})
					.on('mouseout', function(d,i) {
						tip.transition()		
			                .duration(500)		
			                .style("opacity", 0);	
					})

}

function loadViz() {
	loadSlide1();
	$('#custom-index').change(function(){
		loadSlide2();
	});
	loadSlide2();
}

$(function(){
	$.when($.get('data/quality-of-life.csv'), $.getJSON('data/countries.geo.json'))
		.then(function(v1, v2) {
			var csv = v1[0];
			var json = v2[0];
			data = loadData(csv, json);
			setScales();
			loadViz();
		});
});

