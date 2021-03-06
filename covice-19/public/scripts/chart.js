var lastCountry = null;

resetInfo = () => {
    $("#idDensity").val(100);
    $("#idIsolation").val(50);
    $("#idAir").val(50);
    $("#idICU").val(50);
    $("#idOld").val(100);
    $("#idUrban").val(100);

};

am4core.ready(function () {
    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end

    // Create map instance
    var chart = am4core.create("chartdiv", am4maps.MapChart);
    chart.projection = new am4maps.projections.Miller();

    // Create map polygon series for world map
    var worldSeries = chart.series.push(new am4maps.MapPolygonSeries());
    worldSeries.useGeodata = true;
    worldSeries.geodata = am4geodata_worldLow;
    worldSeries.exclude = ["AQ"];

    var worldPolygon = worldSeries.mapPolygons.template;
    worldPolygon.tooltipText = "{name}";
    worldPolygon.nonScalingStroke = true;
    worldPolygon.strokeOpacity = 0.5;
    worldPolygon.fill = am4core.color("#eee");
    worldPolygon.propertyFields.fill = "color";

    var hs = worldPolygon.states.create("hover");
    hs.properties.fill = chart.colors.getIndex(9);

    var activeState = worldPolygon.states.create("active");
    activeState.properties.fill = chart.colors.getIndex(9);

    // Create country specific series (but hide it for now)
    var countrySeries = chart.series.push(new am4maps.MapPolygonSeries());
    countrySeries.useGeodata = true;
    countrySeries.hide();
    countrySeries.geodataSource.events.on("done", function (ev) {
        worldSeries.hide();
        countrySeries.show();
    });

    var countryPolygon = countrySeries.mapPolygons.template;
    countryPolygon.tooltipText = "{name}";
    countryPolygon.nonScalingStroke = true;
    countryPolygon.strokeOpacity = 0.5;
    countryPolygon.fill = am4core.color("#eee");

    var hs = countryPolygon.states.create("hover");
    hs.properties.fill = chart.colors.getIndex(9);

    countryPolygon.events.on("hit", function (ev) {
        ev.target.isActive = !ev.target.isActive;
    });

    // Set up click events
    worldPolygon.events.on("hit", function (ev) {
        ev.target.series.chart.zoomToMapObject(ev.target);
        ev.target.isActive = true;
        let name = ev.target.dataItem.dataContext.name;
        if(name == "United States")
            name = "United States of America"

        if (lastCountry != null) {
            lastCountry.isActive = false;
        }

        if (lastCountry == ev.target) {
            lastCountry = null;
            $("#nameCountry").css('font-size', '14px');
            $("#nameCountry").text("No selected");
            chart.goHome();
            resetInfo()
        } else {

            lastCountry = ev.target;
            if (name.length > 22) {
                $("#nameCountry").css('font-size', '11px');
            } else {
                $("#nameCountry").css('font-size', '14px');
            }
            $("#nameCountry").text(name);
            $.ajaxSetup({
                scriptCharset: "utf-8", //or "ISO-8859-1"
                contentType: "application/json; charset=utf-8"
            });

            let link = "https://egg-wave.herokuapp.com/country/"
            try {
                $.ajax({
                    type: "GET",
                    url: link + name,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (data) {
                        $("#idDensity").val(Math.round(data['Demographic_Density']));
                        $("#idICU").val(Math.round(data['Hospital beds (per 1,000 people)']));
                        $("#idOld").val(Math.round(data['Population ages 65 and above (% of total population)']));
                        $("#idUrban").val(Math.round(data['Urban population (% of total population)']));
                        $("#cases").text(data['Cases']);
                        $("#deaths").text(data['Deaths']);
                        get_situation();
                    },
                    error: function (data) {
                        $("#errorMessage").text("Error to customize information. Please, try it later!")
                        $("#modalError").modal('open');
                        resetInfo()
                    }
                });
            } catch (error) {
                console.log("Error on server or it's missing " + name + " data");
            }

        }
    });

    // Zoom control
    chart.zoomControl = new am4maps.ZoomControl();
}); // end am4cnd am4core.ready()