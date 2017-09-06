
require([
	"dojo/_base/lang",
	"dojo/on",
	"dojo/dom",
    "dojo/window",
    "dojo/_base/array",
    "dojo/store/Memory",
    "dojo/dom-construct",
    "dijit/form/ComboBox",
	"application/Drawer",
    "application/DrawerMenu",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/TileLayer",
    "esri/layers/MapImageLayer",
    "esri/widgets/Search",
    "esri/widgets/Home",
    "esri/widgets/Locate",
    "esri/PopupTemplate",
    "esri/widgets/Popup",
    "esri/tasks/IdentifyTask",
    "esri/tasks/support/IdentifyParameters",
    "esri/tasks/FindTask",
    "esri/tasks/support/FindParameters",
    "esri/geometry/Point",
    "esri/geometry/SpatialReference",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleLineSymbol",
    "esri/Graphic",
    "esri/tasks/GeometryService",
    "esri/tasks/support/ProjectParameters",
    "esri/geometry/support/webMercatorUtils",
    "esri/layers/ImageryLayer",
	"esri/geometry/geometryEngine",
	"esri/symbols/SimpleFillSymbol",
	"esri/geometry/Polygon",
	"esri/tasks/QueryTask",
	"esri/tasks/support/Query",
	"esri/widgets/Legend",
	"esri/layers/FeatureLayer",
	"esri/renderers/SimpleRenderer",
	"esri/renderers/ClassBreaksRenderer",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/geometry/support/webMercatorUtils",
	"esri/Viewpoint",
	"esri/widgets/ScaleBar",
    "dojo/domReady!"
],
function(
	lang,
	on,
	dom,
    win,
    arrayUtils,
    Memory,
    domConstruct,
    ComboBox,
	Drawer,
	DrawerMenu,
    Map,
    MapView,
    TileLayer,
    MapImageLayer,
    Search,
    Home,
    Locate,
    PopupTemplate,
    Popup,
    IdentifyTask,
    IdentifyParameters,
    FindTask,
    FindParameters,
    Point,
    SpatialReference,
    SimpleMarkerSymbol,
    GraphicsLayer,
    SimpleLineSymbol,
    Graphic,
    GeometryService,
    ProjectParameters,
    webMercatorUtils,
    ImageryLayer,
	geometryEngine,
	SimpleFillSymbol,
	Polygon,
	QueryTask,
	Query,
	Legend,
	FeatureLayer,
	SimpleRenderer,
	ClassBreaksRenderer,
	SimpleMarkerSymbol,
	webMercatorUtils,
	Viewpoint,
	ScaleBar
) {
    var isMobile = WURFL.is_mobile;
	var firstUpdatePass = true;
	var idDef = [];
	var wmSR = new SpatialReference(3857);
	var urlParams, hilite, bufferGraphic;
	var geomWhere;
	var comboWhere = "";
	var wellsComboWhere = "";
	var class1ComboWhere = "";
	var wellsGeomWhere;
	var class1GeomWhere;
	var attrWhere = "";
	var locWhere = "";
	var wellsAttrWhere = "";
	var c1WellsAttrWhere = "";
	var fromYear, toYear;
	var userDefinedPoint;
	var facilities;
	var cntyArr = new Array("Allen", "Anderson", "Atchison", "Barber", "Barton", "Bourbon", "Brown", "Butler", "Chase", "Chautauqua", "Cherokee", "Cheyenne", "Clark", "Clay", "Cloud", "Coffey", "Comanche", "Cowley", "Crawford", "Decatur", "Dickinson", "Doniphan", "Douglas", "Edwards", "Elk", "Ellis", "Ellsworth", "Finney", "Ford", "Franklin", "Geary", "Gove", "Graham", "Grant", "Gray", "Greeley", "Greenwood", "Hamilton", "Harper", "Harvey", "Haskell", "Hodgeman", "Jackson", "Jefferson", "Jewell", "Johnson", "Kearny", "Kingman", "Kiowa", "Labette", "Lane", "Leavenworth", "Lincoln", "Linn", "Logan", "Lyon", "McPherson", "Marion", "Marshall", "Meade", "Miami", "Mitchell", "Montgomery", "Morris", "Morton", "Nemaha", "Neosho", "Ness", "Norton", "Osage", "Osborne", "Ottawa", "Pawnee", "Phillips", "Pottawatomie", "Pratt", "Rawlins", "Reno", "Republic", "Rice", "Riley", "Rooks", "Rush", "Russell", "Saline", "Scott", "Sedgwick", "Seward", "Shawnee", "Sheridan", "Sherman", "Smith", "Stafford", "Stanton", "Stevens", "Sumner", "Thomas", "Trego", "Wabaunsee", "Wallace", "Washington", "Wichita", "Wilson", "Woodson", "Wyandotte");

    // Set up basic frame:
    window.document.title = "Tremor Database Mapper";
    $("#title").html("Kansas Earthquakes<a id='kgs-brand' href='http://www.kgs.ku.edu'>Kansas Geological Survey</a>");

    var showDrawerSize = 850;

	var drawer = new Drawer( {
        showDrawerSize: showDrawerSize,
        borderContainer: 'bc_outer',
        contentPaneCenter: 'cp_outer_center',
        contentPaneSide: 'cp_outer_left',
        toggleButton: 'hamburger_button'
    } );
    drawer.startup();

    // Broke the template drawer open/close behavior when paring down the code, so...
    $("#hamburger_button").click(function(e) {
        e.preventDefault();
        if ($("#cp_outer_left").css("width") === "293px") {
            $("#cp_outer_left").css("width", "0px");
        } else {
            $("#cp_outer_left").css("width", "293px");
        }
    } );

	createMenus();

    // Create map, layers, and widgets:
    var tremorGeneralServiceURL = "http://services.kgs.ku.edu/arcgis8/rest/services/tremor/tremor_general/MapServer";
	identifyTask = new IdentifyTask(tremorGeneralServiceURL);
	identifyParams = new IdentifyParameters();
	identifyParams.returnGeometry = true;
	identifyParams.tolerance = (isMobile) ? 9 : 4;
    var findTask = new FindTask(tremorGeneralServiceURL);
    var findParams = new FindParameters();
	findParams.returnGeometry = true;

    var basemapLayer = new TileLayer( {url:"http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer", id:"Base Map", visible:true} );
    var plssLayer = new TileLayer( {url:"http://services.kgs.ku.edu/arcgis8/rest/services/plss/plss/MapServer", id:"Section-Township-Range", visible:false} );
	var latestAerialsLayer = new ImageryLayer( {url:"http://services.kgs.ku.edu/arcgis7/rest/services/IMAGERY_STATEWIDE/FSA_NAIP_2015_Color/ImageServer", id:"Aerial Imagery", visible:false} );
	var kgsCatalogedLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:14}], id:"KGS Cataloged Events", visible:true} );
	var kgsPrelimLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:15}], id:"KGS Preliminary Events", visible:true} );
	var neicLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:16}], id:"NEIC Cataloged Events", visible:false} );
	// var ogsLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:17}], id:"OGS Cataloged Events", visible:false} );
	var seismicConcernLayer = new MapImageLayer( {url:"http://services.kgs.ku.edu/arcgis8/rest/services/tremor/seismic_areas/MapServer", sublayers:[{id:0}], id:"2015 Areas of Seismic Concern", visible:false} );
	var seismicConcernExpandedLayer = new MapImageLayer( {url:"http://services.kgs.ku.edu/arcgis8/rest/services/tremor/seismic_areas/MapServer", sublayers:[{id:1}], id:"2016 Specified Area", visible:false} );
	var class1Layer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:18}], id:"Class 1 Wells", visible:true} );
	var historicLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:20}], id:"Historic Events", visible:false} );
	var usgsTopoLayer = new TileLayer( {url:"https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer", id:"Topo", visible:false} );
	var basementStructuresLayer = new MapImageLayer( {url:"http://services.kgs.ku.edu/arcgis8/rest/services/tremor/seismic_areas/MapServer", sublayers:[{id:2}], id:"Basement Structures", visible:false} );
	var arbuckleFaultsLayer = new MapImageLayer( {url:"http://services.kgs.ku.edu/arcgis8/rest/services/tremor/seismic_areas/MapServer", sublayers:[{id:3}], id:"Precambrian-Arbuckle Faults", visible:false} );

	var swdRenderer = new ClassBreaksRenderer( {
		field: "MOST_RECENT_TOTAL_FLUID"
	} );
	swdRenderer.addClassBreakInfo( {
  		minValue: 0,
  		maxValue: 500000,
		label: "Fewer than 500,000",
  		symbol: new SimpleMarkerSymbol( {
    		style: "diamond",
    		size: 5,
    		color: [115, 178, 255, 0.80]
		} )
	} );
	swdRenderer.addClassBreakInfo( {
  		minValue: 500000,
  		maxValue: 1000000,
		label: "500,000 to 1,000,000",
  		symbol: new SimpleMarkerSymbol( {
    		style: "diamond",
    		size: 8,
    		color: [115, 178, 255, 0.80]
		} )
	} );
	swdRenderer.addClassBreakInfo( {
  		minValue: 1000000,
  		maxValue: 2000000,
		label: "1,000,000 to 2,000,000",
  		symbol: new SimpleMarkerSymbol( {
    		style: "diamond",
    		size: 13,
    		color: [115, 178, 255, 0.80]
		} )
	} );
	swdRenderer.addClassBreakInfo( {
  		minValue: 2000000,
  		maxValue: 5000000,
		label: "2,000,000 to 5,000,000",
  		symbol: new SimpleMarkerSymbol( {
    		style: "diamond",
    		size: 16,
    		color: [115, 178, 255, 0.80]
		} )
	} );
	swdRenderer.addClassBreakInfo( {
  		minValue: 5000000,
		maxValue: 1000000000000,
		label: "Greater than 5,000,000",
  		symbol: new SimpleMarkerSymbol( {
    		style: "diamond",
    		size: 20,
    		color: [115, 178, 255, 0.80]
		} )
	} );
	swdRenderer.legendOptions = {
  		title: "2016 Total Fluid Injection (bbls)"
	};
	var swdLayer = new MapImageLayer( {
		url:tremorGeneralServiceURL,
		sublayers:[ {
			id: 19,
		 	renderer: swdRenderer
		} ],
		id:"Class 2 Wells",
		visible: true
	} );

	var countyRenderer = new SimpleRenderer( {
  		symbol: new SimpleFillSymbol( {
  			style: "none",
  			outline: {
    			color: "gray",
    			width: 2
  			}
		} )
  	} );
	var countiesLayer = new FeatureLayer( {url:"http://services1.arcgis.com/q2CglofYX6ACNEeu/arcgis/rest/services/KS_CountyBoundaries/FeatureServer/0", renderer: countyRenderer, id:"Counties", visible:true} );

    var map = new Map( {
		layers: [basemapLayer, usgsTopoLayer, latestAerialsLayer, basementStructuresLayer, arbuckleFaultsLayer, plssLayer, swdLayer, class1Layer, seismicConcernExpandedLayer, seismicConcernLayer, neicLayer, kgsPrelimLayer, kgsCatalogedLayer, historicLayer, countiesLayer]
    } );

    var graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    var view = new MapView( {
        map: map,
        container: "mapDiv",
        center: [-98, 39.1],
        zoom: 7,
        ui: { components: ["zoom"] },
		constraints: { rotationEnabled: false }
    } );

    view.then(function() {
		createTOC();
		createDashboard();
		popCountyDropdown();

		var isIE = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g);

		if (!isIE) {
			// TODO: save prefs not working in IE as of 20170417, disabling it until I can revisit it down the road.
			if ( localStorage.getItem("saved") === "true" ) {
				$("#save-prefs-chk").prop("checked", true);
				setRadioPrefs();
				setTextboxPrefs();
				setTocPrefs();
				if ( localStorage.getItem("center-x") ) {
					view.center = [localStorage.getItem("center-x"), localStorage.getItem("center-y")];
					view.zoom = localStorage.getItem("zoom");
				}
			} else {
				$("#save-prefs-chk").prop("checked", false);
			}
		} else {
			$("#save-prefs").html("");
		}

        on(view, "click", executeIdTask);

		identifyParams.width = view.width;
		identifyParams.height = view.height;

        // Define additional popup actions:
        var fullInfoAction = {
            title: "Full Report",
            id: "full-report",
            className: "esri-icon-documentation pu-icon"
        };
        // view.popup.actions.push(fullInfoAction);

        var bufferFeatureAction = {
            title: "Filter Features",
            id: "filter-buffer-feature",
            className: "esri-icon-filter pu-icon"
        };
        // view.popup.actions.push(bufferFeatureAction);

        view.popup.on("trigger-action", function(evt) {
            if(evt.action.id === "full-report") {
                showFullInfo();
            } else if (evt.action.id === "filter-buffer-feature") {
				$("#filter-buff-dia").dialog("open");
            } else if (evt.action.id === "report-error") {
                $("#prob-dia").dialog("open");
            } else if (evt.action.id === "zoom-to") {
                // Default zoom-to action wasn't working, so I rolled my own.
				zoomToFeature(view.popup.selectedFeature);
            }
        } );

		view.watch("extent", function() {
			var center = webMercatorUtils.webMercatorToGeographic(view.center);
			localStorage.setItem("center-x", center.x);
			localStorage.setItem("center-y", center.y);
			localStorage.setItem("zoom", view.zoom);
		} );

		view.on("double-click", function(event) {
			graphicsLayer.remove(userDefinedPoint);

			var p = new Point( {
				x: event.mapPoint.x,
				y: event.mapPoint.y,
				spatialReference: wmSR
			 } );

			userDefinedPoint = new Graphic ( {
				geometry: p,
				// popupTemplate: new PopupTemplate( {
				// 	title: "Selected Location",
				// 	content: "<b>Foo Bar</b>"
				// } ),
				symbol: new SimpleMarkerSymbol( {
					size: 18,
    				style: "cross",
					outline: new SimpleLineSymbol ( {
						color: [230, 0, 0, 0.7],
						width: 2
					} )
				} )
			} );

			graphicsLayer.add(userDefinedPoint);
			highlightFeature(userDefinedPoint);
			$(".esri-icon-checkbox-checked").show();
		} );

		urlParams = location.search.substr(1);
	    urlZoom(urlParams);

		updateMap();
    } );

	var searchWidget = new Search( {
		view: view,
		popupEnabled: false
	}, "srch" );

	var stateVp = new Viewpoint( {
		scale: 2750000,
		targetGeometry: new Point ( {
			x: -98,
			y: 39.1
		} )
	} );

	var homeBtn = new Home( {
        view: view
	} );
    homeBtn.startup();
	view.ui.add(homeBtn, {
    	position: "top-left",
        index: 1
     } );
	 homeBtn.viewpoint = stateVp;

	 var scaleBar = new ScaleBar( {
        view: view,
        unit: "dual"
      } );
      view.ui.add(scaleBar, {
        position: "bottom-left"
      } );

	// var locateBtn = new Locate( {
    //     view: view
	// }, "LocateButton" );
    // locateBtn.startup();
	// view.ui.add(locateBtn, {
    // 	position: "top-left",
    //     index: 2
    //  } );

	var legend = new Legend( {
	 	view: view,
	  	layerInfos: [
		{
			layer: seismicConcernLayer,
			title: " "
		},
		{
			layer: seismicConcernExpandedLayer,
			title: " "
		},
		{
	    	layer: kgsCatalogedLayer,
			title: " "
	  	},
	 	{
			layer: kgsPrelimLayer,
			title: " "
		},
		{
			layer: neicLayer,
			title: " "
		},
		{
			layer: neicLayer,
			title: " "
		},
		{
			layer: historicLayer,
			title: " "
		},
		{
			layer: swdLayer,
			title: " "
		},
		{
			layer: basementStructuresLayer,
			title: " "
		},
		{
			layer: class1Layer,
			title: " "
		},
		{
			layer: arbuckleFaultsLayer,
			title: " "
		}
		]
	}, "legend-content" );

    // End map and map widgets.


    // Miscellaneous click handlers:
	// find section:
    $(".find-header").click(function() {
        $("[id^=find]").fadeOut("fast");
        $(".find-header").removeClass("esri-icon-down-arrow");
        $(this).addClass("esri-icon-down-arrow");
        var findBody = $(this).attr("id");
        $("#find-"+findBody).fadeIn("fast");
    } );

	// data section:
	$(".data-header").click(function() {
		var section = $(this).attr("id");
		if ( $(this).hasClass("esri-icon-down-arrow") ) {
			$("#data-" + section).fadeOut("fast");
			$(this).removeClass("esri-icon-down-arrow");
			$(this).addClass("esri-icon-right-triangle-arrow");
		} else {
			$("[id^=data]").fadeOut("fast");
			$(".data-header").removeClass("esri-icon-down-arrow no-border");
		    $(this).addClass("esri-icon-down-arrow no-border");
			$("#data-" + section).fadeIn("fast");
		}
	} );

	$(".esri-icon-filter").click(function() {
		$("#filter-buff-dia").dialog("open");
	} );

	$("#buff-opts-btn").click(function() {
		$("#buff-opts").toggleClass("show");
	} );

	$("#dashboard-btn").click(function() {
		$(".dashboard").show();
		$("#dashboard-btn").hide();
	} );


    function popCountyDropdown() {
        for(var i=0; i<cntyArr.length; i++) {
            theCnty = cntyArr[i];
            $('#lstCounty').append('<option value="' + theCnty + '">' + theCnty + '</option>');
        }
    }


	checkOgState = function() {
		if ( $("[name=area-type]").filter("[value='state']").prop("checked") && $("[name=return-type]").filter("[value='Oil and Gas']").prop("checked") ) {
			alert("Oil wells cannot be selected statewide. Please select a smaller area.");
			$("[name=area-type]").filter("[value='state']").prop("checked", false);
		}
	}


	checkLocRadio = function() {
		$("[name=loc-type]").prop("checked", false);
		if (!view.popup.selectedFeature) {
			if (!userDefinedPoint) {
				alert("Please select an event, well, point, or address to buffer.");
			} else if ( !userDefinedPoint.geometry) {
				alert("Please select an event, well, point, or address to buffer.");
			}
		}
		$("[name=loc-type]").filter("[value='buf']").prop("checked", true);
	}


	checkTimeRadio = function() {
		$("[name=time-type]").prop("checked", false);
		$("[name=time-type]").filter("[value='date']").prop("checked", true);
		// Enable volume plot options if a date is entered before radio is checked:
		$(".inj-graph-text").css("color", "#000");
		$(".inj-graph").attr("disabled", false);
	}


	checkMagRadio = function() {
		$("[name=mag-type]").prop("checked", false);
		$("[name=mag-type]").filter("[value='magrange']").prop("checked", true);
	}

	checkWellRadio = function(box) {
		if (box === 'bbls') {
			$("[name=well-type]").filter("[value='bbls']").prop("checked", true);
		} else {
			$("[name=well-type]").prop("checked", false);
		}
	}


	resetDefaults = function() {
		userDefinedPoint = new Graphic();

		graphicsLayer.removeAll();
		view.popup.clear();
		view.popup.visible = false;

		$("[name=loc-type]").filter("[value='state']").prop("checked", true);
		$("[name=time-type]").filter("[value='week']").prop("checked", true);

		// TODO: reset next 2 lines when done testing:
		// $("[name=mag-type]").filter("[value='gt3517']").prop("checked", true);
		$("[name=mag-type]").filter("[value='all']").prop("checked", true);

		$("#lstCounty2").val("").trigger("chosen:updated");
		$("#sca").val("").trigger("chosen:updated");

		$("#from-date, #to-date, #low-mag, #high-mag").val("");
		$("#loc-buff").val("6");
		$("[name=well-type]").filter("[value='bbls']").prop("checked", true);
		$("#bbls").val("150,000");
		$("#inj-year").val("2016");
		$(".esri-icon-checkbox-checked").hide();
		$(".esri-icon-erase").hide();
		$("#chkArb").prop("checked", false);

		swdLayer.findSublayerById(19).definitionExpression = "";
		kgsCatalogedLayer.findSublayerById(14).definitionExpression = "";
		kgsPrelimLayer.findSublayerById(15).definitionExpression = "";
		neicLayer.findSublayerById(16).definitionExpression = "";
		historicLayer.findSublayerById(20).definitionExpression = "";
		swdLayer.findSublayerById(19).definitionExpression = "";
		idDef[14] = "";
		idDef[15] = "";
		idDef[16] = "";
		idDef[17] = "";
		idDef[18] = "";
		idDef[20] = "";
		idDef[19] = "";
		identifyParams.layerDefinitions = idDef;

		geomWhere = "clear";	// Gets reset to "" in applyDefExp().
		wellsGeomWhere = "clear";	// ditto.
		class1GeomWhere = "clear";

		// Save default settings to local storage:
		saveRadioPrefs("loc-state");
		saveTextboxPrefs("loc-buff");
		saveTextboxPrefs("lstCounty2");
		saveTextboxPrefs("sca");
		saveRadioPrefs("tim-week");
		saveTextboxPrefs("from-date");
		saveTextboxPrefs("to-date");
		saveRadioPrefs("mag-all");	// TODO: reset this to 3517 when in production (see SP first).
		saveTextboxPrefs("low-mag");
		saveTextboxPrefs("high-mag");
		saveRadioPrefs("wel-bbl");
		saveTextboxPrefs("bbls");
		saveTextboxPrefs("inj-year");

		// Disable injection graphs:
		$(".inj-graph-text").css("color", "#808080");
		$(".inj-graph").attr("disabled", true);

		updateMap();
	}


	changeEvtChk = function() {
		$("[name=return-type]").prop("checked", false);
		$("[name=return-type]").filter("[value='Earthquakes']").prop("checked", true);
	}


	resetEvtChk = function() {
		$(".evt-chk").prop("checked", false);
		$(".eqf").val("");
	}


	updateMap = function() {
		locWhere = "";
		var timeWhere = "";
		var magWhere = "";
		wellsWhere = "";
		c1WellsWhere = "";
		attrWhere = "";
		geomWhere = "";
		wellsGeomWhere = "";
		class1GeomWhere = "";
		wellsAttrWhere = "";
		c1WellsAttrWhere = "";

		// Remove download links and clear graphics:
		$(".download-link").html("");
		// graphicsLayer.removeAll();
		graphicsLayer.remove(bufferGraphic);
		graphicsLayer.remove(hilite);

		// Create location clause:
		var location = $("input[name=loc-type]:checked").val();
		switch (location) {
			case "state":
				// Dummy clause to select all:
				locWhere = "objectid > 0";
				break;
			case "buf":
				buffDist = $("#loc-buff").val();

				if ( localStorage.getItem("saved") === "true" ) {
					//need check for saved xy here?
					var selX = localStorage.getItem("sel-feat-x");
					var selY = localStorage.getItem("sel-feat-y");
					createBufferGeom(buffDist, selX, selY);
				}

				if (view.popup.selectedFeature) {
					if (userDefinedPoint.geometry) {
						createBufferGeom(buffDist, userDefinedPoint.geometry.x, userDefinedPoint.geometry.y);
					} else {
						createBufferGeom(buffDist);
					}
				} else if (userDefinedPoint.geometry) {
					if (view.popup.selectedFeature) {
						createBufferGeom(buffDist);
					} else {
						createBufferGeom(buffDist, userDefinedPoint.geometry.x, userDefinedPoint.geometry.y);
					}
				} else {
					if (!firstUpdatePass) {
						alert("Please select an event, well, point, or address to buffer.");
					}
				}
				break;
			case "co":
				var counties = "'" + $("#lstCounty2").val().join("','") + "'";
				if (counties !== 'Counties') {
					/// locWhere = "county_name in (" + counties + ")";
					locWhere = "county_name in (" + counties + ") or county_name in (select dept_motor_vehicles_abbrev from global.counties where name in (" + counties + "))";
				}
				break;
			case "sca":
				var selected = $("#sca").val();
				if (selected.length == 1 && selected[0] === "Seismic Concern Areas") {
					return;
				} else {
					if (selected[0] === "Seismic Concern Areas") {
						selected.shift();
					}
					var scas = "'" + selected.join("','") + "'";
					geomWhere = "";
					getScaGeometry(scas);
				}
				break;
		}

		// Create time clause:
		// This timeWhere only applies to events, dates for wells handled under "bbls" section of wells where.
		var time = $("input[name=time-type]:checked").val();
		switch (time) {
			case "week":
				timeWhere = "sysdate - cast(local_time as date) <= 7";
				break;
			case "month":
				timeWhere = "sysdate - cast(local_time as date) <= 29";
				break
			case "year":
				timeWhere = "to_char(local_time,'YYYY') = to_char(sysdate, 'YYYY')";
				break;
			case "all":
				timeWhere = "";
				break;
			case "date":
				// Enable injection graphs:
				$(".inj-graph-text").css("color", "#000");
				$(".inj-graph").attr("disabled", false);

				var fromDate = dom.byId('from-date').value;
				var toDate = dom.byId('to-date').value;
				var fromDateIsValid = true;
				var toDateIsValid = true;

				// Check validity of dates:
				if (fromDate !== "") {
					var fromDateParts = fromDate.split("/");
					var fromMonth = parseInt(fromDateParts[0]);
					var fromDay = parseInt(fromDateParts[1]);
					fromYear = parseInt(fromDateParts[2]);
					fromDateIsValid = validateDate( fromDay, fromMonth, fromYear );
				} else {
					fromMonth = "";
					fromYear = "";
				}
				if (toDate !== "") {
					var toDateParts = toDate.split("/");
					var toMonth = parseInt(toDateParts[0]);
					var toDay = parseInt(toDateParts[1]);
					toYear = parseInt(toDateParts[2]);
					toDateIsValid = validateDate( toDay, toMonth, toYear );
				} else {
					toMonth = "";
					toYear = "";
				}
				if (!fromDateIsValid || !toDateIsValid) {
					alert("An invalid date was entered.");
					return;
				}
				var d1 = new Date();
				var d2 = new Date(fromDate);
				if (d2 > d1) {
					alert("From Date cannot be in the future.");
					return;
				}
				var d3 = new Date(toDate);
				if (d2 > d3) {
					alert("From Date cannot be later than To Date");
					return;
				}

				if (fromDate && toDate) {
					timeWhere = "trunc(local_time) >= to_date('" + fromDate + "','mm/dd/yyyy') and trunc(local_time) <= to_date('" + toDate + "','mm/dd/yyyy')";
				} else if (fromDate && !toDate) {
					timeWhere = "trunc(local_time) >= to_date('" + fromDate + "','mm/dd/yyyy')";
				} else if (!fromDate && toDate) {
					timeWhere = "trunc(local_time) <= to_date('" + toDate + "','mm/dd/yyyy')";
				}
				break;
		}

		// Create mag-sas clause:
		var lMag = dom.byId('low-mag').value;
		var uMag = dom.byId('high-mag').value;

		var mag = $("input[name=mag-type]:checked").val();
		switch (mag) {
			case "all":
				// blank in this case.
				break;
			case "magrange":
				if (lMag && uMag) {
					magWhere = "magnitude >= " + lMag + " and magnitude <= " + uMag;
				} else if (lMag && !uMag) {
					magWhere = "magnitude >= " + lMag;
				} else if (!lMag && uMag) {
					magWhere = "magnitude <= " + uMag;
				}
				break
			case "gt3517":
				magWhere = "(magnitude >= 3.5 or sas >= 17)";
				break;
		}

		// Create wells clause:
		var well = $("input[name=well-type]:checked").val();
		var chkArbuckle = $("#chkArb:checked").val();

		switch (well) {
			case "all":
				// Dummy clause to return all:
				if (chkArbuckle) {
					wellsWhere = "kid in (select well_header_kid from qualified.injections where injection_zone in (select injection_zone from arbuckle_injection_zones))";
				} else {
					wellsWhere = "objectid > 0";
				}
				c1WellsWhere = "objectid > 0";
				break;
			case "bbls":
				var bbls = $("#bbls").val().replace(/,/g, "");
				var dateClause, c1DateClause;

				// Calculate most recent injection data availability for SWDs:
				var today = new Date();
				var thisYear = today.getFullYear();
				var thisMonth = today.getMonth() + 1;
				var mostRecentDataDate = new Date("April 1, " + thisYear);	// Date when last year's data should be available.
				if (today > mostRecentDataDate) {
					var y = thisYear - 1;
					dateClause = "year = " + y;
				} else {
					var y = thisYear - 2;
					dateClause = "year = " + y;
				}

				if ( $("#tim-date").prop("checked") ) {
					// Use date range.
					if ( parseInt(fromYear) < 2015 || parseInt(toYear) < 2015 ) {
						// Use annual volumes.
						if (fromYear && toYear) {
							var yearClause = "year >= " + fromYear + " and year <= " + toYear;
							c1DateClause = "year >= " + fromYear + " and year <= " + toYear + " and month >= " + fromMonth + " and month <= " + toMonth;
						} else if (fromYear && !toYear) {
							var yearClause = "year >= " + fromYear;
							c1DateClause = "year >= " + fromYear + " and month >= " + fromMonth;
						} else if (!fromYear && toYear) {
							var yearClause = "year <= " + toYear;
							c1DateClause = "year <= " + toYear + " and month <= " + toMonth;
						}
						wellsWhere = "kid in (select well_header_kid from qualified.injections where " + yearClause + " and total_fluid_volume/12 >= " + bbls + ")";
						c1WellsWhere = "uic_id in (select uic_id from TREMOR.CLASS_1_INJECTION_VOLUMES where " + c1DateClause + " and barrels >= " + bbls + ")";
					} else if (fromYear == thisYear) {
						// essentially the same as a date preset.
						wellsWhere = "kid in (select well_header_kid from mk_injections_months where " + dateClause + " and fluid_injected >= " + bbls + ")";
						c1WellsWhere = "uic_id in (select uic_id from TREMOR.CLASS_1_INJECTION_VOLUMES where year = " + thisYear + " and month = " + thisMonth + " and barrels >= " + bbls + ")";
					} else {
						dateClause = "";
						// Use monthly volumes.
						if (fromYear && toYear) {
							dateClause = "month_year >= to_date('" + fromMonth + "/" + fromYear + "','mm/yyyy') and month_year <= to_date('" + toMonth + "/" + toYear + "','mm/yyyy')";
							c1DateClause = "year >= " + fromYear + " and year <= " + toYear + " and month >= " + fromMonth + " and month <= " + toMonth;
						} else if (fromYear && !toYear) {
							dateClause = "month_year >= to_date('" + fromMonth + "/" + fromYear + "','mm/yyyy')";
							c1DateClause = "year >= " + fromYear + " and month >= " + fromMonth;
						} else if (!fromYear && toYear) {
							dateClause = "month_year <= to_date('" + toMonth + "/" + toYear + "','mm/yyyy')";
							c1DateClause = "year <= " + toYear + " and month <= " + toMonth;
						}
						wellsWhere = "kid in (select well_header_kid from mk_injections_months where " + dateClause + " and fluid_injected >= " + bbls + ")";
						c1WellsWhere = "uic_id in (select uic_id from TREMOR.CLASS_1_INJECTION_VOLUMES where " + c1DateClause + " and barrels >= " + bbls + ")";

						var fDate = dom.byId('from-date').value;
						var tDate = dom.byId('to-date').value;
						if (!fDate && !tDate) {
							// Date pickers are blank, return all.
							wellsWhere = "kid in (select well_header_kid from mk_injections_months where fluid_injected >= " + bbls + ")";
						}


					}
				} else if ( $("[name=time-type]").filter("[value='all']").prop("checked") ) {
					// Time = all, so no date clause, just volumes. NOTE "all" option is commented out as of 20170824.
					wellsWhere = "kid in (select well_header_kid from mk_injections_months where fluid_injected >= " + bbls + ")";
				} else {
					// Date presets, use most recent year data is available.
					// Class 2:
					wellsWhere = "kid in (select well_header_kid from mk_injections_months where " + dateClause + " and fluid_injected >= " + bbls + ")";

					// Class 1:
					// Figure out most recent data available date:
					$.get("getMostRecentC1Date.cfm", function(response) {
						var date = response.split(",");

						if ( $("[name=time-type]").filter("[value='week']").prop("checked") || $("[name=time-type]").filter("[value='month']").prop("checked") ) {
							// Use most recent month and year available.
							c1WellsWhere = "uic_id in (select uic_id from TREMOR.CLASS_1_INJECTION_VOLUMES where year = " + date[0] + " and month = " + date[1] + " and barrels >= " + bbls + ")";
						}
						if ($("[name=time-type]").filter("[value='year']").prop("checked")) {
							// Use most recent year.
							c1WellsWhere = "uic_id in (select uic_id from TREMOR.CLASS_1_INJECTION_VOLUMES where year = " + date[0] + " and barrels >= " + bbls + ")";
						}
					} );
				}
				break;
		}

		// Put where clauses together (excluding wells clause which is created below):
		if (locWhere !== "") {
			attrWhere += locWhere + " and ";
		}
		if (timeWhere !== "") {
			attrWhere += timeWhere + " and ";
		}
		if (magWhere !== "") {
			attrWhere += magWhere + " and ";
		}
		// Strip off final "and":
		if (attrWhere.substr(attrWhere.length - 5) === " and ") {
			attrWhere = attrWhere.slice(0,attrWhere.length - 5);
		}

		// Put wells clauses together w/ location where (note - location-where really only includes counties, others are handled through geomWhere):
		// Class 2:
		if (wellsWhere !== "") {
			if (chkArbuckle) {
				wellsAttrWhere += wellsWhere + " and kid in (select well_header_kid from qualified.injections where injection_zone in (select injection_zone from arbuckle_injection_zones)) and ";
			} else {
				wellsAttrWhere += wellsWhere + " and ";
			}
		}
		if (locWhere !== "") {
			wellsAttrWhere += locWhere + " and ";
		}
		// Strip off final "and":
		if (wellsAttrWhere.substr(wellsAttrWhere.length - 5) === " and ") {
			wellsAttrWhere = wellsAttrWhere.slice(0,wellsAttrWhere.length - 5);
		}

		// Class 1:
		if (c1WellsWhere !== "") {
			if (chkArbuckle) {
				c1WellsAttrWhere += c1WellsWhere + " and uic_id in (select uic_id from TREMOR.CLASS_1_INJECTION_WELLS where injection_zone = 'Arbuckle') and ";
			} else {
				c1WellsAttrWhere += c1WellsWhere + " and ";
			}
		}
		if (locWhere !== "") {
			c1WellsAttrWhere += locWhere + " and ";
		}
		// Strip off final "and":
		if (c1WellsAttrWhere.substr(c1WellsAttrWhere.length - 5) === " and ") {
			c1WellsAttrWhere = c1WellsAttrWhere.slice(0,c1WellsAttrWhere.length - 5);
		}

		if ( (location === "buf" || location === "sca") && (geomWhere == "" || wellsGeomWhere == "" || class1GeomWhere == "") ) {
			setTimeout(waitForGeomWheres(), 100);
		} else {
			applyDefExp();
		}
		firstUpdatePass = false;
	}	// end updateMap().


	function diff_months(dt2, dt1) {
		var diff =(dt2.getTime() - dt1.getTime()) / 1000;
		diff /= (60 * 60 * 24 * 7 * 4);
		// return Math.abs(Math.round(diff));
		return Math.ceil(diff);	// Want total number of months not number between.
	}


	function validateDate( intDay, intMonth, intYear ) {
	    return intMonth >= 1 && intMonth <= 12 && intDay > 0 && intDay <= daysInMonth( intMonth, intYear );
	}

	function daysInMonth( intMonth, intYear ) {
	    switch ( intMonth )
	    {
	        case 2:
	            return (intYear % 4 == 0 && intYear % 100) || intYear % 400 == 0 ? 29 : 28;
	        case 4:
	        case 6:
	        case 9:
	        case 11:
	            return 30;
	        default :
	            return 31
	    }
	}


	function createBufferGeom(buffDist, x, y) {
		if (x) {
			graphicsLayer.remove(bufferGraphic);
			var theX = x;
			var theY = y;
			var g = "point";
		} else if (view.popup.selectedFeature) {
			graphicsLayer.remove(userDefinedPoint);
			var theX = view.popup.selectedFeature.geometry.x;
			var theY = view.popup.selectedFeature.geometry.y;
			if (view.popup.selectedFeature.geometry.type === "point") {
				var g = "point";
			} else {
				var g = "polygon";
			}
		} else {
			alert("Please select a feature to buffer");
			return;
		}

		if (g === "point") {
			var buffFeature = new Point( {
				x: theX,
				y: theY,
				spatialReference: wmSR
			 } );
		} else {
			var buffFeature = new Polygon( {
				rings: f.geometry.rings,
				spatialReference: wmSR
			 } );
		}

		var buffPoly = geometryEngine.geodesicBuffer(buffFeature, buffDist, "miles");
		var fillSymbol = new SimpleFillSymbol( {
			color: [102, 205, 170, 0.25],
			outline: new SimpleLineSymbol( {
				color: [0, 0, 0],
				width: 1
			} )
		} );
		bufferGraphic = new Graphic( {
			geometry: buffPoly,
			symbol: fillSymbol
		} );
		graphicsLayer.add(bufferGraphic);

		$(".esri-icon-erase").show();

		view.goTo( {
			target: buffPoly.extent,
			scale: 200000
		}, {duration: 500} );

		createGeomWhere(buffPoly);
		createWellsGeomWhere(buffPoly);
		createClass1GeomWhere(buffPoly);
	}


	function waitForGeomWheres() {
		if (geomWhere !== "" && wellsGeomWhere !== "" && class1GeomWhere !== "") {
			applyDefExp();
		} else {
			setTimeout(waitForGeomWheres, 100);
		}
	}


	function zoomToState() {
		view.center = [-98, 38];
		view.zoom = 7;
	}


	function openToolsPanel() {
		$(".item").removeClass("item-selected");
		$(".panel").removeClass("panel-selected");
		$(".icon-wrench").closest(".item").addClass("item-selected");
		$("#data-panel").closest(".panel").addClass("panel-selected");
		$("#loader").show();
	}


	function getScaGeometry(scas) {
		var qt = new QueryTask();
		var qry = new Query();
		var geom;

		// Query task to get geometry for selected SCAs:
		if (scas.indexOf("Specified") > -1) {
			// expanded area.
			var serviceLyr = 1;
			qry.where = "objectid = 1";
		} else {
			var serviceLyr = 0;
			qry.where = "area_name in (" + scas + ")";
		}

		qry.returnGeometry = true;
		qt.url = "http://services.kgs.ku.edu/arcgis8/rest/services/tremor/seismic_areas/MapServer/" + serviceLyr;
		qt.execute(qry).then(function(result) {
			var f = result.features;
			geom = (f[0].geometry);
			if (f.length > 1) {
				for (var i = 1; i < f.length; i++) {
					geom = geometryEngine.union( [ geom, f[i].geometry ] );
				}
			}
			geomWhere = createGeomWhere(geom);
			wellsGeomWhere = createWellsGeomWhere(geom);
			class1GeomWhere = createClass1GeomWhere(geom);
		} );
	}


	function createGeomWhere(geom) {
		var qt = new QueryTask();
		var qry = new Query();
		geomWhere = "";

		qt.url = tremorGeneralServiceURL + "/21";	// Note this selects all events so objectids are already in where clause when layer is made visible.
		qry.geometry = geom;
		qt.executeForIds(qry).then(function(ids) {
			var chunk;
			geomWhere = "objectid in";

			while (ids.length > 0) {
				chunk = ids.splice(0,1000);
				chunk = " (" + chunk.join(",") + ") or objectid in";
				geomWhere += chunk;
			}
			if (geomWhere.substr(geomWhere.length - 2) === "in") {
				geomWhere = geomWhere.slice(0,geomWhere.length - 15);
			}
		} );
		return geomWhere;
	}


	function createWellsGeomWhere(geom) {
		var qt = new QueryTask();
		var qry = new Query();
		wellsGeomWhere = "";

		qt.url = tremorGeneralServiceURL + "/19";
		qry.geometry = geom;
		qt.executeForIds(qry).then(function(ids) {
			var chunk;
			wellsGeomWhere = "objectid in";

			while (ids.length > 0) {
				chunk = ids.splice(0,1000);
				chunk = " (" + chunk.join(",") + ") or objectid in";
				wellsGeomWhere += chunk;
			}
			if (wellsGeomWhere.substr(wellsGeomWhere.length - 2) === "in") {
				wellsGeomWhere = wellsGeomWhere.slice(0,wellsGeomWhere.length - 15);
			}
		} );

		return wellsGeomWhere;
	}


	function createClass1GeomWhere(geom) {
		var qt = new QueryTask();
		var qry = new Query();
		class1GeomWhere = "";

		qt.url = tremorGeneralServiceURL + "/18";
		qry.geometry = geom;
		qt.executeForIds(qry).then(function(ids) {
			var chunk;
			class1GeomWhere = "objectid in";

			while (ids.length > 0) {
				chunk = ids.splice(0,1000);
				chunk = " (" + chunk.join(",") + ") or objectid in";
				class1GeomWhere += chunk;
			}
			if (class1GeomWhere.substr(class1GeomWhere.length - 2) === "in") {
				class1GeomWhere = class1GeomWhere.slice(0,class1GeomWhere.length - 15);
			}
		} );

		return class1GeomWhere;
	}


	function applyDefExp() {
		comboWhere = "";
		wellsComboWhere = "";
		class1ComboWhere = "";
		var filterLyrs = $("input:checked[class=filterable]").map(function() {
			return $(this).val();
		} ).get();

		if (geomWhere === "clear") {
			// Means form has been reset to defaults.
			geomWhere = "";
		}
		if (wellsGeomWhere === "clear") {
			// Means form has been reset to defaults.
			wellsGeomWhere = "";
		}
		if (class1GeomWhere === "clear") {
			class1GeomWhere = "";
		}

		if (attrWhere && geomWhere) {
			comboWhere = attrWhere + " and (" + geomWhere + ")";
		}
		if (attrWhere && !geomWhere) {
			comboWhere = attrWhere;
		}
		if (!attrWhere && geomWhere) {
			comboWhere = geomWhere;
		}
		if (!attrWhere && !geomWhere) {
			comboWhere = "";
		}

		kgsCatalogedLayer.findSublayerById(14).definitionExpression = comboWhere;
		kgsPrelimLayer.findSublayerById(15).definitionExpression = comboWhere;
		neicLayer.findSublayerById(16).definitionExpression = comboWhere;
		historicLayer.findSublayerById(20).definitionExpression = comboWhere;
		idDef[14] = comboWhere;
		idDef[15] = comboWhere;
		idDef[16] = comboWhere;
		idDef[20] = comboWhere;

		if (wellsAttrWhere && wellsGeomWhere) {
			wellsComboWhere = wellsAttrWhere + " and (" + wellsGeomWhere + ")";
		}
		if (wellsAttrWhere && !wellsGeomWhere) {
			wellsComboWhere = wellsAttrWhere;
		}
		if (!wellsAttrWhere && wellsGeomWhere) {
			wellsComboWhere = wellsGeomWhere;
		}
		if (!wellsAttrWhere && !wellsGeomWhere) {
			wellsComboWhere = "";
		}

		swdLayer.findSublayerById(19).definitionExpression = wellsComboWhere;
		idDef[19] = wellsComboWhere;

		if (c1WellsAttrWhere && class1GeomWhere) {
			class1ComboWhere = c1WellsAttrWhere + " and (" + class1GeomWhere + ")";
		}
		if (c1WellsAttrWhere && !class1GeomWhere) {
			class1ComboWhere = c1WellsAttrWhere;
		}
		if (!c1WellsAttrWhere && class1GeomWhere) {
			class1ComboWhere = class1GeomWhere;
		}
		if (!c1WellsAttrWhere && !class1GeomWhere) {
			class1ComboWhere = "";
		}

		class1Layer.findSublayerById(18).definitionExpression = class1ComboWhere;
		idDef[18] = class1ComboWhere;
	}


	function earthquakeWhereClause(areaType, lyrID) {
		var theWhere = "";
		var dateWhere = "";
		var magWhere = "";
		var countyWhere = "";
		var stateWhere = "";
		var fromDate = dom.byId('eq-from-date').value;
		var toDate = dom.byId('eq-to-date').value;
		var lMag = dom.byId('low-mag').value;
		var uMag = dom.byId('high-mag').value;
		var county = dom.byId("lstCounty2").value;

		if (fromDate && toDate) {
			dateWhere = "trunc(local_time) >= to_date('" + fromDate + "','mm/dd/yyyy') and trunc(local_time) <= to_date('" + toDate + "','mm/dd/yyyy')";
		} else if (fromDate && !toDate) {
			dateWhere = "trunc(local_time) >= to_date('" + fromDate + "','mm/dd/yyyy')";
		} else if (!fromDate && toDate) {
			dateWhere = "trunc(local_time) <= to_date('" + toDate + "','mm/dd/yyyy')";
		}

		if (lMag && uMag) {
			magWhere = magtype + " >= " + lMag + " and " + magtype + " <= " + uMag;
		} else if (lMag && !uMag) {
			magWhere = magtype + " >= " + lMag;
		} else if (!lMag && uMag) {
			magWhere = magtype + " <= " + uMag;
		}

		if (areaType === "co") {
			countyWhere = "county = '" + dom.byId("lstCounty2").value + "'";
		}

		if (areaType === "state") {
			stateWhere = "latitude >= 37 and latitude <= 40 and longitude >= -102.05 and longitude <= -94.58";
		}

		if (dateWhere !== "") {
			theWhere += dateWhere + " and ";
		}
		if (magWhere !== "") {
			theWhere += magWhere + " and ";
		}
		if (countyWhere !== "") {
			theWhere += countyWhere + " and ";
		}
		if (stateWhere !== "") {
			theWhere += stateWhere + " and ";
		}

		if (theWhere.substr(theWhere.length - 5) === " and ") {
			theWhere = theWhere.slice(0,theWhere.length - 5);
		}

		return theWhere;
	}


    function openPopup(feature) {
		dom.byId("mapDiv").style.cursor = "auto";
		view.popup.features = feature;
		view.popup.dockEnabled = true;
		view.popup.dockOptions = {
			buttonEnabled: false,
			position: "bottom-right"
		};
		view.popup.visible = true;

		$(".esri-icon-checkbox-checked").show();

		// localStorage.setItem("sel-feat-x", view.popup.selectedFeature.geometry.x);
		// localStorage.setItem("sel-feat-y", view.popup.selectedFeature.geometry.y);
    }


    function urlZoom(urlParams) {
        var items = urlParams.split("&");
        if (items.length > 1) {
            var extType = items[0].substring(5);
            var extValue = items[1].substring(3);

            findParams.contains = false;

            switch (extType) {
                case "well":
                    findParams.layerIds = [0];
                    findParams.searchFields = ["kid"];
                    break;
                case "field":
                    findParams.layerIds = [1];
                    findParams.searchFields = ["field_kid"];
					fieldsLayer.visible = true;
	                $("#Oil-and-Gas-Fields input").prop("checked", true);
                    break;
				case "event":
                    findParams.layerIds = [14,15];
                    findParams.searchFields = ["quake_id"];
                    break;
            }

            findParams.searchText = extValue;
            findTask.execute(findParams)
            .then(function(response) {
				return addPopupTemplate(response.results);
            } )
            .then(function(feature) {
				if (feature.length > 0) {


					// Set dashboard time buttons to match origin time:
					var arrOrigTime = feature[0].attributes.local_time.split("/");
					var y = arrOrigTime[2].substring(0,4);
					var m = arrOrigTime[0] - 1;
					var d = arrOrigTime[1];
					var time = arrOrigTime[2].substring(5).replace(" AM", "").replace(" PM", "");
					var arrTime = time.split(":");
					var h = arrTime[0];
					var min = arrTime[1];
					var s = arrTime[2];
					var origTime = new Date(y, m, d, h, min, s);
					var today = new Date();

					var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
					var diffDays = Math.round( Math.abs( (today.getTime() - origTime.getTime()) / (oneDay) ) );

					if (diffDays <= 7) {
						$("#tim-week").prop("checked", true);
					} else if (diffDays > 7 && diffDays <= 30) {
						$("#tim-month").prop("checked", true);
					} else if (diffDays > 30 && y == today.getFullYear()) {
						$("#tim-year").prop("checked", true);
					} else {
						$("#tim-all").prop("checked", true);
					}
				}
				updateMap();
				openPopup(feature);
				zoomToFeature(feature);
            } );
        }
    }


    function zoomToFeature(features) {
        var f = features[0] ? features[0] : features;
		if (f.geometry.type === "point") {
			var p = new Point(f.geometry.x, f.geometry.y, wmSR);
			view.goTo( {
				target: p,
				zoom: 15
			}, {duration: 500} );
		} else {
			var e = f.geometry.extent;
			view.goTo( {
				target: e
			}, {duration: 500} );
		}
		highlightFeature(f);
    }


    function highlightFeature(features) {
		///graphicsLayer.removeAll();
		graphicsLayer.remove(hilite);
        var f = features[0] ? features[0] : features;
        switch (f.geometry.type) {
            case "point":
                var marker = new SimpleMarkerSymbol( {
                    color: [255, 255, 0, 0],
                    size: 20,
                    outline: new SimpleLineSymbol( {
                        color: "yellow",
                        width: 7
                    } )
                } );
				var sym = marker;
                break;
            case "polygon":
				var fill = new SimpleFillSymbol( {
					style: "none",
					outline: new SimpleLineSymbol( {
                        color: "yellow",
                        width: 5
                    } )
				} );
				var sym = fill;
                break;
        }
		hilite = new Graphic( {
			geometry: f.geometry,
			symbol: sym
		} );
		graphicsLayer.add(hilite);
		// $(".esri-icon-erase").show();
    }


    jumpFocus = function(nextField,chars,currField) {
        if (dom.byId(currField).value.length == chars) {
            dom.byId(nextField).focus();
        }
    }


    findIt = function(what) {
		searchWidget.clear();
		graphicsLayer.removeAll();

        switch (what) {
            case "plss":
                var plssText;

                if (dom.byId('rngdir-e').checked == true) {
                    var dir = 'E';
                }
                else {
                    var dir = 'W';
                }

                if (dom.byId('sec').value !== "") {
                    plssText = 'S' + dom.byId('sec').value + '-T' + dom.byId('twn').value + 'S-R' + dom.byId('rng').value + dir;
                    findParams.layerIds = [3];
                    findParams.searchFields = ["s_r_t"];
                }
                else {
                    plssText = 'T' + dom.byId('twn').value + 'S-R' + dom.byId('rng').value + dir;
                    findParams.layerIds = [4];
                    findParams.searchFields = ["t_r"];
                }
                findParams.searchText = plssText;
                break;
            case "api":
                var apiText = dom.byId('api_state').value + "-" + dom.byId('api_county').value + "-" + dom.byId('api_number').value;

                if (dom.byId('api_extension').value != "") {
                    apiText = apiText + "-" + dom.byId('api_extension').value;
                }
                findParams.layerIds = [19];
                findParams.searchFields = ["api_number"];
                findParams.searchText = apiText;
				findParams.contains = false;
				swdLayer.visible = true;
                $("#Salt-Water-Disposal-Wells input").prop("checked", true);
                break;
            case "county":
                findParams.layerIds = [2];
                findParams.searchFields = ["county"];
                findParams.searchText = dom.byId("lstCounty").value;
                break;
            case "field":
                findParams.layerIds = [1];
                findParams.searchFields = ["field_name"];
                findParams.contains = false;
                findParams.searchText = dom.byId("field-select").value;
                fieldsLayer.visible = true;
                $("#Oil-and-Gas-Fields input").prop("checked", true);
				break;
			case "event":
				findParams.layerIds = [14, 15, 16, 17];
				findParams.searchFields = ["event_id"];
				findParams.contains = false;
				findParams.returnGeometry = true;
				findParams.searchText = parseInt(dom.byId("eventid").value);
				break;
			case "facility":
				findParams.layerIds = [18];
				findParams.searchFields = ["facility_name"];
				findParams.contains = false;
				findParams.returnGeometry = true;
				findParams.searchText = dom.byId("fac-wells").value
				break;
        }
        findTask.execute(findParams).then(function(response) {
			if (what === "event" && response.results.length > 0) {
				switch (response.results[0].layerName) {
					case "KGS Cataloged Events":
						kgsCatalogedLayer.visible = true;
						$("#KGS-Cataloged-Events input").prop("checked", true);
						break;
					case "KGS Preliminary Events":
						kgsPrelimLayer.visible = true;
						$("#KGS-Preliminary-Events input").prop("checked", true);
						break;
					case "NEIC Cataloged Events":
						neicLayer.visible = true;
						$("#NEIC-Cataloged-Events input").prop("checked", true);
						break;
					case "OGS Cataloged Events":
						ogsLayer.visible = true;
						$("#OGS-Cataloged-Events input").prop("checked", true);
						break;
				}
			}

            zoomToFeature(response.results[0].feature);

			var query = new Query();
			query.returnGeometry = true;
			var selectWellType = $("input:radio[name=welltype]:checked").val();

			if (what === "plss") {
				if (selectWellType !== "none") {
					if (selectWellType === "Oil and Gas") {
						var lyrID = "/0";
						// Attributes to be included in download file:
						query.outFields = ["KID","API_NUMBER","LEASE_NAME","WELL_NAME","STATE_CODE","COUNTY","FIELD_NAME","FIELD_KID","TOWNSHIP","TOWNSHIP_DIRECTION","RANGE","RANGE_DIRECTION","SECTION","SUBDIVISION_1_LARGEST","SUBDIVISION_2","SUBDIVISION_3","SUBDIVISION_4_SMALLEST","SPOT","FEET_NORTH_FROM_REFERENCE","FEET_EAST_FROM_REFERENCE","REFERENCE_CORNER","ROTARY_TOTAL_DEPTH","ELEVATION_KB","ELEVATION_GL","ELEVATION_DF","PRODUCING_FORMATION","NAD27_LATITUDE","NAD27_LONGITUDE","OPERATOR_NAME","CURR_OPERATOR","PERMIT_DATE_TXT","SPUD_DATE_TXT","COMPLETION_DATE_TXT","PLUG_DATE_TXT","STATUS_TXT"];
						wellsLayer.visible = true;
	                    $("#Oil-and-Gas-Wells input").prop("checked", true);
					} else {
						// water.
						var lyrID = "/8";
						query.outFields = ["INPUT_SEQ_NUMBER","OWNER_NAME","USE_DESC","DWR_APPROPRIATION_NUMBER","MONITORING_NUMBER","COUNTY","TOWNSHIP","TOWNSHIP_DIRECTION","RANGE","RANGE_DIRECTION","SECTION","QUARTER_CALL_1_LARGEST","QUARTER_CALL_2","QUARTER_CALL_3","NAD27_LATITUDE","NAD27_LONGITUDE","DEPTH_TXT","ELEV_TXT","STATIC_LEVEL_TXT","YIELD_TXT","STATUS","COMP_DATE_TXT","CONTRACTOR"];
						wwc5Layer.visible = true;
	                    $("#WWC5-Water-Wells input").prop("checked", true);
					}

					query.where = "township="+dom.byId('twn').value+" and township_direction='S' and range="+dom.byId('rng').value+" and range_direction='"+dir+"'";
					if (dom.byId('sec').value !== "") {
						query.where += " and section=" + dom.byId('sec').value;
					}
				} else {
					$("#wells-tbl").html("");
				}
			} else if (what === "field") {
				if ( $("#field-list-wells").prop("checked") ) {
					query.where = "FIELD_KID = " + response.results[0].feature.attributes.FIELD_KID;
					query.outFields = ["KID","API_NUMBER","LEASE_NAME","WELL_NAME","STATE_CODE","COUNTY","FIELD_NAME","FIELD_KID","TOWNSHIP","TOWNSHIP_DIRECTION","RANGE","RANGE_DIRECTION","SECTION","SUBDIVISION_1_LARGEST","SUBDIVISION_2","SUBDIVISION_3","SUBDIVISION_4_SMALLEST","SPOT","FEET_NORTH_FROM_REFERENCE","FEET_EAST_FROM_REFERENCE","REFERENCE_CORNER","ROTARY_TOTAL_DEPTH","ELEVATION_KB","ELEVATION_GL","ELEVATION_DF","PRODUCING_FORMATION","NAD27_LATITUDE","NAD27_LONGITUDE","OPERATOR_NAME","CURR_OPERATOR","PERMIT_DATE_TXT","SPUD_DATE_TXT","COMPLETION_DATE_TXT","PLUG_DATE_TXT","STATUS_TXT"];
					var lyrID = "/0";
					selectWellType = "Oil and Gas";
				}
			}

			var queryTask = new QueryTask( {
				url: tremorGeneralServiceURL + lyrID
			} );

			queryTask.executeForCount(query).then(function(count) {
				listCount = count;
			} );

			return addPopupTemplate(response.results);
        } ).then(function(feature) {
			if (what === "api" || what === "field" || what === "event" || what === "facility") {
				openPopup(feature);
			}
		} );
    }


	saveSettings = function() {
		var saveEm =$("#save-prefs-chk").is(":checked");
		localStorage.setItem("saved", saveEm);
	}


	saveRadioPrefs = function(name) {
		// Create a storage key for each dashboard group (loc, tim, mag, wel), then set its
		// value to the particular radio button that's checked. Also applies to TOC basemap group:
		var key = name.substring(0,3);
		var val = name.substring(4);
		localStorage.setItem(key, val);
	}


	function setRadioPrefs() {
		var radioGroups = ["loc", "tim", "mag", "wel", "bas"];
		for (var i = 0; i < radioGroups.length; i++) {
			var opt = localStorage.getItem( radioGroups[i] );
			if (radioGroups[i] === "bas") {
				$("[value='" + opt + "']").prop("checked", true);
			} else {
				$("#" + radioGroups[i] + "-" + opt).prop("checked", true);
			}
		}
	}


	saveTextboxPrefs = function(name) {
		var key = name;
		var val = $("#" + name).val();
		localStorage.setItem(key, val);
	}


	function setTextboxPrefs() {
		$("#loc-buff").val( localStorage.getItem("loc-buff") );

		var selectedCounties = localStorage.getItem("lstCounty2").split(",");
		$("#lstCounty2").val(selectedCounties).trigger("chosen:updated");
		var selectedSca = localStorage.getItem("sca").split(",");
		$("#sca").val(selectedSca).trigger("chosen:updated");

		$("#from-date").val( localStorage.getItem("from-date") );
		$("#to-date").val( localStorage.getItem("to-date") );

		$("#low-mag").val( localStorage.getItem("low-mag") );
		$("#high-mag").val( localStorage.getItem("high-mag") );

		$("#bbls").val( localStorage.getItem("bbls") );

		$("#inj-year").val( localStorage.getItem("inj-year") );
	}


	saveTocPrefs = function(tocItem) {
		var chkd = $("#"+tocItem).prop("checked");
		localStorage.setItem(tocItem, chkd);
	}


	function setTocPrefs () {
		$.each(localStorage, function(key, val) {
			if ( key.startsWith("tcb-") ) {
				// Layer checkbox prefs.
				if (val === "true") {
					$("#" + key).prop("checked", true);
				} else {
					$("#" + key).prop("checked", false);
				}

				var j = key.substr(key.indexOf("-") + 1);
				var l = map.findLayerById(map.layers._items[j].id);
				if (l.id !== "Topo") {
					l.visible = $("#tcb-" + j).is(":checked") ? true : false;
				}
			}

			if ( key.startsWith("bas") ) {
				// Basemap radio pref.
				if (val === "none") {
					val = "Topo";
				}
				var l = map.findLayerById(val);
				l.visible = true;
			}
		} );
	}


	function sortList(a, b) {
		if (a.feature.attributes.API_NUMBER) {
			// oil wells.
			var att = "API_NUMBER";
		} else if (a.feature.attributes.OWNER_NAME) {
			// water wells.
			var att = "OWNER_NAME";
		} else if (a.feature.attributes.LAYER) {
			// sort earthquakes by source ("layer") first, then date:
			if (a.feature.attributes["LAYER"] < b.feature.attributes["LAYER"]) { return -1; }
			if (a.feature.attributes["LAYER"] > b.feature.attributes["LAYER"]) { return 1; }
			if (a.feature.attributes["LAYER"] === b.feature.attributes["LAYER"]) {
				var aDate = new Date(a.feature.attributes["local_time"]);
				var bDate = new Date(b.feature.attributes["local_time"]);
				if (aDate < bDate) { return -1; }
				if (aDate > bDate) { return 1; }
				return 0;
			}
			return 0;
		}

		// sorting for og/water wells:
        var numA = a.feature.attributes[att];
        var numB = b.feature.attributes[att];
        if (numA < numB) { return -1 }
        if (numA > numB) { return 1 }
        return 0;
    }


	function opengraphDia() {
		$("#graph-type-dia").dialog("open");
	}


	makeChart = function() {
		var fromDate = dom.byId('from-date').value;
		var toDate = dom.byId('to-date').value;

		var puTitle = $(".esri-popup__header-title").html();

		var filterLyrs = $("input:checked[class=filterable]").map(function() {
			return $(this).val();
		} ).get();

		if (filterLyrs.length === 0) {
			alert("At least one earthquake or well layer must be visible.")
		} else {
			var graphLayers = filterLyrs.join(",");

			var graphType = $('input[name=graph-type]:checked').val();
			switch (graphType) {
				case "count":
					var graphTitle = "Count";
					var yAxisText = "Count";
					var pointFormatText = "Count: <b>{point.y}</b>";
					var showDecimals = false;
					var graphWhere = comboWhere;
					var chartType = "scatter";
					break;
				case "mag":
					var graphTitle = "Magnitude";
					var yAxisText = "Magnitude";
					var pointFormatText = "Magnitude: <b>{point.y}</b>";
					var showDecimals = true;
					var graphWhere = comboWhere;
					var chartType = "scatter";
					break;
				case "cumulative":
					var graphTitle = "Cumulative Total";
					var yAxisText = "Total";
					var pointFormatText = "Total: <b>{point.y}</b>";
					var showDecimals = true;
					var graphWhere = comboWhere;
					var chartType = "line";
					break;
				case "injvol":
					var yAxisText = "BBLS";
					var pointFormatText = "Total: <b>{point.y}</b>";
					var showDecimals = false;
					var graphWhere = wellsComboWhere;
					var chartType = "column";
					// If just a single well is selected, use that:
					if (view.popup.selectedFeature && puTitle.indexOf("Well:") > -1) {
						if (graphWhere.indexOf("objectid") === -1) {
							// Crude test to make sure selected well is not being used as a buffer point.
							// If not, just graph data for the one selected point.
							graphWhere = "objectid = " + view.popup.selectedFeature.attributes.OBJECTID;
						}
					}
					break;
				case "jointcount":
					var graphWhere = wellsComboWhere;
					var jointEqWhere = comboWhere;
					// If just a single well is selected, use that:
					if (view.popup.selectedFeature && puTitle.indexOf("Well:") > -1) {
						if (graphWhere.indexOf("objectid") === -1) {
							// Crude test to make sure selected well is not being used as a buffer point.
							// If not, just graph data for the one selected point.
							graphWhere = "objectid = " + view.popup.selectedFeature.attributes.OBJECTID;
						}
					}
					var titleText = 'Event Counts & Total Injection Volumes For Selected Wells';
					var yText = 'Count';
					break;
				case "joint":
					var graphWhere = wellsComboWhere;
					var jointEqWhere = comboWhere;
					// If just a single well is selected, use that:
					if (view.popup.selectedFeature && puTitle.indexOf("Well:") > -1) {
						if (graphWhere.indexOf("objectid") === -1) {
							// Crude test to make sure selected well is not being used as a buffer point.
							// If not, just graph data for the one selected point.
							graphWhere = "objectid = " + view.popup.selectedFeature.attributes.OBJECTID;
						}
					}
					var titleText = 'Event Magnitudes & Total Injection Volumes For Selected Wells';
					var yText = 'Magnitude';
					break;
			}

			Highcharts.setOptions( {
			    lang: {
			        thousandsSep: ','
			    }
			} );

			if ( $("#chart").highcharts() ) {
				$("#chart").highcharts().destroy();
				$("#chart").hide();
			}

			// Set size of chart container as a percentage of window size:
			var wWidth = $(window).width();
			var dWidth = wWidth * 0.75;
			$("#chart-container").dialog("option", "width", dWidth);

			var bbl = "";
			var w = $("input[name=well-type]:checked").val();
			if (w !== "all") {
				bbl = $("#bbls").val().replace(/,/g, "");
			}

			var injvolWhere = "";
			if (locWhere) {
				injvolWhere = locWhere;
			}
			if (wellsGeomWhere) {
				injvolWhere = wellsGeomWhere;
			}

			var timeOption = $("input[name=time-type]:checked").val();

			// Note, everything in packet might not be used in each cfm, but keeping it all is easiest:
			var packet = { "type": graphType, "where": graphWhere, "includelayers": graphLayers, "jointeqwhere": jointEqWhere, "fromdate": fromDate, "todate": toDate, "injvolwhere": injvolWhere, "bbl": bbl, "time": timeOption  };

			$("#loader").show();

			if (fromYear < 2015 || toYear < 2015) {
				var xDate = "{value:%Y}";
				var volTitle = "Annual Total Injection Volume";
			} else {
				var xDate = "{value:%b %Y}";
				var volTitle = "Monthy Total Injection Volume";
			}

			if (graphType === "injvol") {
				$.post("createInjectionChartData.cfm", packet, function(response) {
					var volData = JSON.parse(response);
					if (volData[0].data.length !== 0) {
						$('#chart').highcharts( {
							chart: {
						        zoomType: 'xy',
								events: {
									load: function() {
										$("#loader").hide();
									}
								}
						    },
						    title: {
						        text: volTitle
						    },
							xAxis: {
						        type: 'datetime',
						        labels: {
						            // format: '{value:%Y-%m}',
									format: xDate,
						            rotation: 45,
						            align: 'left'
						        }
						    },
							yAxis: [ { // Primary yAxis
								title: ""
						    }, { // Secondary yAxi
						        title: {
						            text: 'Total Injection (bbls)',
						        },
						        labels: {
									format: '{value:,.0f}'
						        },
						        opposite: false
						    } ],
							tooltip: {
								crosshairs: {
							        color: 'green',
							        dashStyle: 'solid'
							    }
					        	// enabled: false
					        },
						    series: volData
						} );
					} else {
						$(".ui-dialog").hide();
						alert("No data returned for these search criteria and/or dates.");
						$("#loader").hide();
					}
				} );
			} else if (graphType === "joint" || graphType === "jointcount") {
				$.post("createJointPlotData.cfm", packet, function(response) {
					var jointData = JSON.parse(response);

					$('#chart').highcharts( {
						chart: {
					        zoomType: 'xy',
							events: {
								load: function() {
									$("#loader").hide();
								}
							}
					    },
					    title: {
					        text: titleText
					    },
						xAxis: {
					        type: 'datetime',
					        labels: {
					            format: xDate,
					            rotation: 45,
					            align: 'left'
					        }
					    },
					    yAxis: [ { // Primary yAxis
					        title: {
					            text: yText
					        }
					    }, { // Secondary yAxis
					        title: {
					            text: 'Total Injection (bbls)',
					        },
					        labels: {
								format: '{value:,.0f}'
					        },
					        opposite: true
					    } ],
						tooltip: {
							crosshairs: {
						        color: 'green',
						        dashStyle: 'solid'
						    }
				        	// enabled: false
				        },
					    series: jointData
					} );
				} );
			} else {
				$.post("createChartData.cfm", packet, function(response) {
					var data = JSON.parse(response);

				    $('#chart').highcharts( {
				        chart: {
				            type: chartType,
							borderColor: '#A9A9A9',
		            		borderWidth: 3,
							borderRadius: 8,
							zoomType: 'xy',
							events: {
								load: function() {
									$("#loader").hide();
								}
							}
				        },
						title: {
							text: graphTitle
						},
						// subtitle: {
						// 	text: graphSubTitle
						// },
						tooltip: {
							crosshairs: {
						        color: 'green',
						        dashStyle: 'solid'
						    },
				        	// enabled: false
							headerFormat: '<b>{point.key}</b><br/>',
							pointFormat: pointFormatText,
							xDateFormat: '%b %e, %Y'
				        },
						xAxis: {
				            type: 'datetime',
							endOnTick: true,
							startOnTick: true,
							labels: {
								format: xDate,
								rotation: 45,
								align: 'left'
							}
				        },
						yAxis: {
							allowDecimals: showDecimals,
							title: {
								text: yAxisText
							}
						},
						series: data
				    } );
				} );
			}

			if (graphWhere !== "") {
				$(".ui-dialog").show();
				$("#chart-container").dialog("open");
				$("#chart").show();
			} else {
				$("#chart").hide();
				$(".ui-dialog").hide();
				alert("Select a location other than 'Statewide'.");
			}
			$("#loader").hide();
		}
	}


    zoomToLatLong = function() {
		graphicsLayer.removeAll();

        var lat = dom.byId("lat").value;
        var lon = dom.byId("lon").value;
        var datum = dom.byId("datum").value;

        var gsvc = new GeometryService("http://services.kgs.ku.edu/arcgis8/rest/services/Utilities/Geometry/GeometryServer");
        var params = new ProjectParameters();
        var wgs84Sr = new SpatialReference( { wkid: 4326 } );

        if (lon > 0) {
            lon = 0 - lon;
        }

		switch (datum) {
			case "nad27":
				var srId = 4267;
				break;
			case "nad83":
				var srId = 4269;
				break;
			case "wgs84":
				var srId = 4326;
				break;
		}

        var p = new Point(lon, lat, new SpatialReference( { wkid: srId } ) );
        params.geometries = [p];
        params.outSR = wgs84Sr;

        gsvc.project(params).then( function(features) {
            var pt84 = new Point(features[0].x, features[0].y, wgs84Sr);
            var wmPt = webMercatorUtils.geographicToWebMercator(pt84);

            var ptSymbol = new SimpleMarkerSymbol( {
                style: "cross",
                size: 18,
                outline: new SimpleLineSymbol( {
                  color: [255, 0, 0],
                  width: 2
                } )
            } );

			userDefinedPoint = new Graphic ( {
				geometry: wmPt,
				symbol: new SimpleMarkerSymbol( {
					size: 18,
    				style: "cross",
					outline: new SimpleLineSymbol ( {
						color: [230, 0, 0, 0.7],
						width: 2
					} )
				} )
			} );

			view.goTo( {
				target: wmPt,
				zoom: 14
			}, {duration: 750} ).then(function() {
				graphicsLayer.add(userDefinedPoint);
			} );
        } );
    }


	resetFinds = function() {
		searchWidget.clear();
		$("#twn, #rng, #sec, #datum, #lstCounty").prop("selectedIndex", 0);
		$("#rngdir-w").prop("checked", "checked");
		$("[name=welltype]").filter("[value='none']").prop("checked",true);
		$("#api_state, #api_county, #api_number, #api_extension, #lat, #lon, #field-select, #eventid").val("");
	}


    function createMenus() {
    	var drawerMenus = [];
        var content, menuObj;

		// Display (layers) panel:
        content = '';
        content += '<div class="panel-container">';
        // content += '<div class="panel-header">Display <span id="clear-filters"><span class="esri-icon-erase" title="Clear Filter & Graphics"></span><span class="esri-icon-filter" title="Filter Features"></span></div>';
		content += '<div class="panel-header">Display</div>';
        content += '<div id="lyrs-toc"></div>';
        content += '</div>';

        menuObj = {
            label: '<div class="icon-layers"></div><div class="icon-text">Display</div>',
            content: content
        };
        drawerMenus.push(menuObj);

        // Data (tools) panel:
        content = '';
        content += '<div class="panel-container">';
		content += '<div class="panel-header">Data<img id="loader" class="hide" src="images/ajax-loader.gif"></div>';

		content += '<div class="data-header esri-icon-right-triangle-arrow" id="dwnload"><span class="find-hdr-txt"> Download</span></div>';
		content += '<div class="data-body hide" id="data-dwnload">';
		content += "<table><tr><td></td><td><label><input type='checkbox' class='dwnld-type' value='events' id='chk-dwn-evts'> Earthquakes</label></td></tr>";
		content += "<tr><td></td><td><label><input type='checkbox' class='dwnld-type' id='chk-dwn-c1s' value='wells'> Class 1 Wells & Injection Data</label></td></tr>";
		content += "<tr><td></td><td><label><input type='checkbox' class='dwnld-type' id='chk-dwn-c2s' value='wells'> Class 2 Wells & Injection Data</label></td></tr>";
		content += "<tr><td></td><td><button class='find-button' onclick='dataDownload()'> Create File</button></td></tr></table>";
		content += "<div class='download-link' id='wells-link'></div>";
		content += '</div>';	// end download div.

		content += '<div class="data-header esri-icon-right-triangle-arrow" id="grph"><span class="find-hdr-txt"> Plots</span></div>';
		content += '<div class="data-body hide" id="data-grph">';
		content += "<table><tr><td></td><td><label><input type='radio' name='graph-type' value='mag' checked> Magnitude</label></td></tr>";
		content += "<tr><td></td><td><label><input type='radio' name='graph-type' value='count'> Count</label></td></tr>";
		content += "<tr><td></td><td><label><input type='radio' name='graph-type' value='cumulative'> Cumulative</label></td></tr>";
		content += "<tr><td></td><td><label><input type='radio' name='graph-type' class='inj-graph' value='injvol' disabled> <span class='inj-graph-text'>Injection Volume</span></label></td></tr>";
		content += "<tr><td></td><td><label><input type='radio' name='graph-type' class='inj-graph' value='joint' disabled> <span class='inj-graph-text'>Joint Magnitude/Volume Plot</span></label></td></tr>";
		content += "<tr><td></td><td><label><input type='radio' name='graph-type' class='inj-graph' value='jointcount' disabled> <span class='inj-graph-text'>Joint Count/Volume Plot</span></label></td></tr>";
		content += "<tr><td></td><td><button class='find-button' id='chart-btn' onclick='makeChart()'>Create Plot</button></td></tr></table>";
		content += '</div>';	// end graph div.

        content += '</div>';	// end data panel div.

		// Initialize chart:
		$("#chart-container").dialog( {
            autoOpen: false,
            dialogClass: "dialog",
			resizable: false,
			title: ""
        } );

        menuObj = {
            label: '<div class="esri-icon-table"></div><div class="icon-text">Data</div>',
            content: content
        };
        drawerMenus.push(menuObj);

        // Find panel:
        content = '';
        content += '<div class="panel-container">';
        content += '<div class="panel-header">Locate</div>';
        content += '<div class="panel-padding">';

		// well (api and c1 facility):
        content += '<div class="find-header esri-icon-right-triangle-arrow" id="api"><span class="find-hdr-txt"> Well</span></div>';
        content += '<div class="find-body hide" id="find-api">';
        content += 'API Number (extension optional):<br>';
        content += '<input type="text" id="api_state" size="2" onKeyUp="jumpFocus(api_county, 2, this.id)"/>-';
        content += '<input type="text" id="api_county" size="3" onKeyUp="jumpFocus(api_number, 3, this.id)"/>-';
        content += '<input type="text" id="api_number" size="5" onKeyUp="jumpFocus(api_extension, 5, this.id)"/>-';
        content += '<input type="text" id="api_extension" size="4"/>';
        content += '<button class=find-button onclick=findIt("api")>Find API</button>';
		content += '<span id="facs"></span>';
        content += '</div>';

		// county:
        content += '<div class="find-header esri-icon-right-triangle-arrow" id="county"><span class="find-hdr-txt"> County</span></div>';
        content += '<div class="find-body hide" id="find-county">';
        content += '<table><tr><td class="find-label">County:</td><td><select id="lstCounty"></select></td><td><button class=find-button onclick=findIt("county")>Find</button></td></tr></table>';
        content += '</div>';

		// plss:
        content += '<div class="find-header esri-icon-right-triangle-arrow" id="plss"><span class="find-hdr-txt"> Section-Township-Range</span></div>';
        content += '<div class="find-body hide" id="find-plss">';
        content += '<table><tr><td class="find-label">Township:</td><td><select id="twn"><option value=""></option>';
        for (var i=1; i<36; i++) {
            content += '<option value="' + i + '"">' + i + '</option>';
        }
        content += '</select> South</td></tr>';
        content += '<tr><td class="find-label">Range:</td><td style="white-space: nowrap"><select id="rng"><option value=""></option>';
        for (var i=1; i<44; i++) {
            content += '<option value="' + i + '"">' + i + '</option>';
        }
        content += '</select> East: <input type="radio" name="rngdir" id="rngdir-e" value="e"> West: <input type="radio" name="rngdir" id="rngdir-w" value="w" checked></td></tr>';
        content += '<tr><td class="find-label">Section:</td><td><select id="sec"><option value=""></option>';
        for (var i=1; i<37; i++) {
            content += '<option value="' + i + '"">' + i + '</option>';
        }
        content += '</select><span class="toc-note">(optional)</td></tr>';
        content += '<tr><td></td><td><button class="find-button" onclick=findIt("plss")>Find</button></td></tr>';
        content += '</table></div>';

        // address:
        content += '<div class="find-header esri-icon-right-triangle-arrow" id="address"><span class="find-hdr-txt"> Address or Place<span></div>';
        content += '<div class="find-body hide" id="find-address">';
        content += '<div id="srch"></div>';
        content += '</div>';

		// lat-lon:
        content += '<div class="find-header esri-icon-right-triangle-arrow" id="latlon"><span class="find-hdr-txt"> Latitude-Longitude</span></div>';
        content += '<div class="find-body hide" id="find-latlon">';
        content += '<table><tr><td class="find-label">Latitude:</td><td><input type="text" id="lat" placeholder="e.g. 38.12345"></td></tr>';
        content += '<tr><td class="find-label">Longitude:</td><td><input type="text" id="lon" placeholder="e.g. -98.12345"></td></tr>';
        content += '<tr><td class="find-label">Datum:</td><td><select id="datum"><option value="wgs84">WGS84</option><option value="nad83">NAD83</option><option value="nad27">NAD27</option><td></td></tr>';
        content += '<tr><td></td><td><button class="find-button" onclick="zoomToLatLong();">Find</button></td></tr>';
        content += '</table><hr></div>';

		// earthquake event id:
		// content += '<div class="find-header esri-icon-right-triangle-arrow" id="event"><span class="find-hdr-txt"> Event ID</span></div>';
        // content += '<div class="find-body hide" id="find-event">';
        // content += '<table><tr><td class="find-label">Event ID:</td><td><input id="eventid" size="14"></td><td><button class=find-button onclick=findIt("event")>Find</button></td></tr></table>';
        // content += '</div>';

        // field:
        // content += '<div class="find-header esri-icon-right-triangle-arrow" id="field"><span class="find-hdr-txt"> Oil-Gas Field</span></div>';
        // content += '<div class="find-body hide" id="find-field">';
        // content += '<table><tr><td class="find-label">Name:</td><td><input id="field-select"></td></tr>';
		// content += '<tr><td colspan="2"><input type="checkbox" id="field-list-wells">List wells assigned to this field</td></tr>';
		// content += '<tr><td></td><td><button class=find-button onclick=findIt("field")>Find</button></td></tr></table>';
        // content += '</div>';

		// bookmarks
		// content += '<div class="panel-sub-txt">Bookmarks <span class="esri-icon-plus-circled" id="add-bookmark" title="Add Bookmark" onclick="addBookmark()"></span></div>';
		// content += '<div class="bookmark-link"><span onclick="originalLocation()">Original Location</div>';
        // content += '</div>';
        // content += '</div>';
		content += '<span id="reset-finds"><button onclick="resetFinds()">Reset</button></span>';

        menuObj = {
            label: '<div class="icon-zoom-in"></div><div class="icon-text">Locate</div>',
            content: content
        };
        drawerMenus.push(menuObj);

		// Legend panel:
        content = '';
        content += '<div class="panel-container">';
        content += '<div class="panel-header">Legend</div>';
		content += '<div class="note">Preliminary earthquakes are auto-located using the KGS Earthworm detection system and have not undergone final review by an analyst. Cataloged earthquakes are manually located by an analyst. All earthquakes are subject to revision.</div>';
        content += '<div class="panel-padding">';
        content += '<div id="legend-content"></div>';
		// content += '<div class="panel-header">Links</div>';
        content += '</div>';
        content += '</div>';

        menuObj = {
            label: '<div class="icon-list"></div><div class="icon-text">Legend</div>',
            content: content
        };
        drawerMenus.push(menuObj);

        var drawerMenu = new DrawerMenu({
            menus: drawerMenus
        }, dom.byId("drawer_menus"));
        drawerMenu.startup();

		$("#chart-btn").click(function() {
			$("#loader").show();
		} );

		// Facilities select box for Locate panel. Putting it down here because of loading order issues.
		$.get("getFacilities.cfm", function(response) {
			facilities = response.split('","');
			var con = "<p>Facility-Well<br><select id='fac-wells'>";
			for (var y = 0; y < facilities.length; y++) {
			 	con += "<option value='" + facilities[y].replace('"','') + "'>" + facilities[y].replace('"','') + "</option>";
			}
			con += "</select><p><button class=find-button onclick=findIt('facility')>Find Facility-Well</button>";
			$("#facs").html(con);
		} );
    }


	dataDownload = function() {
		// Which download options are checked:
		var downloadOptions = [];
		if ( $("#chk-dwn-evts").is(":checked") ) {
			downloadOptions.push("events");
		}
		if ( $("#chk-dwn-c2s").is(":checked") ) {
			downloadOptions.push("wells");
		}
		if ( $("#chk-dwn-c1s").is(":checked") ) {
			downloadOptions.push("c1wells");
		}
		var downloadOptions = downloadOptions.join(",");

		var timeOption = $("input[name=time-type]:checked").val();

		var fromDate = dom.byId('from-date').value;
		var toDate = dom.byId('to-date').value;

		var bbl = "";
		var w = $("input[name=well-type]:checked").val();
		if (w !== "all") {
			bbl = $("#bbls").val().replace(/,/g, "");
		}

		var injvolWhere = "";
		if (locWhere) {
			injvolWhere = locWhere;
		}
		if (wellsGeomWhere) {
			injvolWhere = wellsGeomWhere;
		}

		var filterLyrs = $("input:checked[class=filterable]").map(function() {
			return $(this).val();
		} ).get();

		if (filterLyrs.length === 0) {
			alert("At least one earthquake or well layer must be visible.")
		} else {
			var graphLayers = filterLyrs.join(",");

			var packet = { "what": downloadOptions, "includelayers": graphLayers, "evtwhere": comboWhere, "wellwhere": wellsComboWhere, "fromdate": fromDate, "todate": toDate, "injvolwhere": injvolWhere, "bbl": bbl, "time": timeOption };

			$("#loader").show();
			$.post( "downloadPoints.cfm", packet, function(response) {
				$("#wells-link").html(response);
				$("#loader").hide();
			} );
		}
	}


    function showFullInfo() {
        var popupTitle = $(".esri-popup__header-title").html();
        if (popupTitle.indexOf("Field:") > -1) {
			var url = "http://chasm.kgs.ku.edu/apex/oil.ogf4.IDProdQuery?FieldNumber=" + $("#field-kid").html();
        } else if (popupTitle.indexOf("Well:") > -1) {
            var url = "http://chasm.kgs.ku.edu/apex/qualified.well_page.DisplayWell?f_kid=" + $("#well-kid").html();
        } else if (popupTitle.indexOf("Earthquake") > -1) {
            var url = "http://earthquake.usgs.gov/earthquakes/eventpage/" + $("#usgs-id").html();
        } else if (popupTitle.indexOf("(WWC5)") > -1) {
            var url = "http://chasm.kgs.ku.edu/ords/wwc5.wwc5d2.well_details?well_id=" + $("#seq-num").html();
        }
		var win = window.open(url, "target='_blank'");
    }


	function createDashboard() {
		// var units = ["miles","kilometers","meters","yards","feet"];
		var seismicAreas = ["Anthony","Bluff City","Caldwell","Freeport","Milan","2016 Specified Area"];

		dbCon = "<div class='dashboard'>";
		// dbCon += "<div id='db-ctrls'><span class='esri-icon-close' id='close-db'></span><button id='update-btn' class='find-button' onclick='updateMap()'>Apply Changes</button><span class='esri-icon-refresh' id='reset-db' title='Reset defaults'></span><span class='esri-icon-checkbox-checked hide' id='deselect-icon' onclick='deselectPoint()' title='Deselect feature'></span><span class='esri-icon-erase hide' id='erase-graphics' title='Erase graphics'></span><span class='note' id='save-prefs'><input type='checkbox' id='save-prefs-chk' onclick='saveSettings()'>Save Settings</span></div>";
		dbCon += "<div id='db-ctrls'><span class='esri-icon-close' id='close-db'></span><button id='update-btn' class='find-button' onclick='updateMap()'>Apply Changes</button><span class='esri-icon-refresh' id='reset-db' title='Reset defaults'></span><span class='esri-icon-checkbox-checked hide' id='deselect-icon' onclick='deselectPoint()' title='Deselect feature'></span><span class='esri-icon-erase hide' id='erase-graphics' title='Erase graphics'></span></div>";
		// dbCon += '<div class="note">Preliminary earthquakes are auto-located using the KGS Earthworm automatic earthquake detection system and have not undergone final review by an analyst. Cataloged earthquakes are manually located by an analyst. All earthquakes are subject to revision.</div><p>';

		// Location:
		dbCon += "<div class='db-sub-div'><span class='sub-div-hdr' id='location'>Location</span>";
		dbCon += "<table class='db-sub-table' id='location-body'>";
		dbCon += "<tr><td><input type='radio' name='loc-type' id='loc-state' value='state' checked onchange='saveRadioPrefs(&quot;loc-state&quot;)'></td><td>Statewide</td></tr>";
		dbCon += "<tr><td class='sel-rad'><input type='radio' name='loc-type' id='loc-buf' value='buf' onchange='saveRadioPrefs(&quot;loc-buf&quot;)' onclick='checkLocRadio()'></td><td> Within <input type='text' class='txt-input' id='loc-buff' value='6' oninput='checkLocRadio()' onchange='saveTextboxPrefs(&quot;loc-buff&quot;)' onfocus='saveRadioPrefs(&quot;loc-buf&quot;)'> mi of selected feature</td></tr>";
		dbCon += "<tr><td></td><td><span class='note'>or double-click map to define a point</tr>";
		dbCon += "<tr><td class='sel-rad'><input type='radio' name='loc-type' id='loc-co' value='co' onchange='saveRadioPrefs(&quot;loc-co&quot;)'></td><td> <select class='loc-select' id='lstCounty2' multiple>";
		for (var k = 0; k < cntyArr.length; k++) {
		 	dbCon += "<option value='" + cntyArr[k] + "'>" + cntyArr[k] + "</option>";
		}
		dbCon += "</select></td></tr>";
		dbCon += "<tr><td class='sel-rad'><input type='radio' name='loc-type' id='loc-sca' value='sca'  onchange='saveRadioPrefs(&quot;loc-sca&quot;)'></td><td> <select class='loc-select' id='sca' multiple>";
		for (var j = 0; j < seismicAreas.length; j++) {
		 	dbCon += "<option value='" + seismicAreas[j] + "'>" + seismicAreas[j] + "</option>";
		}
		dbCon += "</select></td></tr>";
		dbCon += "</table></div>";
		dbCon += "<div class='vertical-line'></div>";

		// Time:
		dbCon += "<div class='db-sub-div'><span class='sub-div-hdr' id='time'>Time</span>";
		dbCon += "<table class='db-sub-table' id='time-body'>";
		dbCon += "<tr><td><input type='radio' name='time-type' id='tim-week' value='week' checked onchange='saveRadioPrefs(&quot;tim-week&quot;)'></td><td> Past 7 days</td></tr>";
		dbCon += "<tr><td><input type='radio' name='time-type' id='tim-month' value='month' onchange='saveRadioPrefs(&quot;tim-month&quot;)'></td><td> Past 30 days</td></tr>";
		dbCon += "<tr><td><input type='radio' name='time-type' id='tim-year' value='year' onchange='saveRadioPrefs(&quot;tim-year&quot;)'></td><td> This year</td></tr>";
		dbCon += "<tr><td><input type='radio' name='time-type' id='tim-date' value='date' onchange='saveRadioPrefs(&quot;tim-date&quot;)'></td><td> <input type='text' size='10' id='from-date' onchange='checkTimeRadio(); saveTextboxPrefs(&quot;from-date&quot;)' onfocus='saveRadioPrefs(&quot;tim-date&quot;)' placeholder='mm/dd/yyyy'> to <input type='text' size='10' id='to-date' onchange='checkTimeRadio(); saveTextboxPrefs(&quot;to-date&quot;)' onfocus='saveRadioPrefs(&quot;tim-date&quot;)' placeholder='mm/dd/yyyy'></td></tr>";
		// dbCon += "<tr><td><input type='radio' name='time-type' id='tim-all' value='all' onchange='saveRadioPrefs(&quot;tim-year&quot;)'></td><td> All</td></tr>";
		dbCon += "</table></div>";
		dbCon += "<div class='vertical-line'></div>";

		// Mag-SAS:
		dbCon += "<div class='db-sub-div'><span class='sub-div-hdr' id='magsas'>Magnitude/SAS</span>";
		dbCon += "<table class='db-sub-table' id='magsas-body'>";
		dbCon += "<tr><td><input type='radio' name='mag-type' id='mag-all' value='all' checked onchange='saveRadioPrefs(&quot;mag-all&quot;)'></td><td> All</td></tr>";
		dbCon += "<tr><td><input type='radio' name='mag-type' id='mag-range' value='magrange' onchange='saveRadioPrefs(&quot;mag-range&quot;)'></td><td> M <input type='text' class='txt-input' id='low-mag' oninput='checkMagRadio(); saveTextboxPrefs(&quot;low-mag&quot;)' onfocus='saveRadioPrefs(&quot;mag-range&quot;)'> to <input type='text'  class='txt-input' id='high-mag' oninput='checkMagRadio(); saveTextboxPrefs(&quot;high-mag&quot;)' onfocus='saveRadioPrefs(&quot;mag-range&quot;)'></td></tr>";
		dbCon += "<tr><td><input type='radio' name='mag-type' id='mag-sas' value='gt3517' onchange='saveRadioPrefs(&quot;mag-sas&quot;)'></td><td> M &ge; 3.5 or SAS &ge; 17</td></tr>";
		dbCon += "</table></div>";
		dbCon += "<div class='vertical-line'></div>";

		// Wells:
		dbCon += "<div class='db-sub-div'><span class='sub-div-hdr' id='wells'>Wells</span>";
		dbCon += "<table class='db-sub-table' id='wells-body'>";
		dbCon += "<tr><td><input type='radio' name='well-type' id='wel-all' value='all' onchange='saveRadioPrefs(&quot;wel-all&quot;)'></td><td> All</td></tr>";
		dbCon += "<tr><td><input type='radio' name='well-type' id='wel-bbl' value='bbls' checked onchange='saveRadioPrefs(&quot;wel-bbl&quot;)'></td><td>Any Monthly Volume &ge; <input type='text' size='8' value='150,000' id='bbls' oninput='checkWellRadio(&quot;bbls&quot;); saveTextboxPrefs(&quot;bbls&quot;)' onfocus='saveRadioPrefs(&quot;wel-bbl&quot;)'> bbls";
		// dbCon += "<tr><td></td><td>Injection Zone: <select name='injzone' id='inj-zone'><option value=''></option>";
		// dbCon += "<option value='Arbuckle'>Arbuckle</option>";
		// dbCon += "</select></td></tr>";
		dbCon += "<tr><td><input type='checkbox' id='chkArb'></td><td>Injects into Arbuckle</td></tr>";
		dbCon += "</table></div>";

		dbCon += "</div>";	// end main dashboard div.

		$("#dashboard").html(dbCon);

		$("#from-date").datepicker();
        $("#to-date").datepicker();

		$("#close-db").click(function() {
			$(".dashboard").hide();
			$("#dashboard-btn").show();
		} );

		$("#reset-db").click(function() {
			resetDefaults();
		} );

		// $("#deselect-icon").click(function() {
		// 	$(".esri-icon-checkbox-checked").hide();
		// 	graphicsLayer.remove(hilite);
		// 	view.popup.clear();
		// 	view.popup.visible = false;
		// } );

		$("#erase-graphics").click(function() {

			graphicsLayer.removeAll();
			$(".esri-icon-erase").hide();
	    } );

		$("#lstCounty2").chosen( {
			width: "150px",
			// max_selected_options: 4,
			placeholder_text_multiple: "Counties"
		} );
		$("#lstCounty2").on("change", function(evt, params) {
			$('[name=loc-type][value="co"]').prop('checked',true);
			saveRadioPrefs("loc-co");
			saveTextboxPrefs("lstCounty2");
		 } );

		$("#sca").chosen( {
			width: "150px",
			placeholder_text_multiple: "Seismic Areas"
		} );
		$("#sca").on("change", function(evt, params) {
			$('[name=loc-type][value="sca"]').prop('checked',true);
			saveRadioPrefs("loc-sca");
			saveTextboxPrefs("sca");
		 } );

		 $("[name=time-type]").click(function() {
			 if (this.id !== "tim-date") {
				// Disable injection graphs:
 				$(".inj-graph-text").css("color", "#808080");
 				$(".inj-graph").attr("disabled", true);
			} else {
				$(".inj-graph-text").css("color", "#000");
				$(".inj-graph").attr("disabled", false);
			}
			if (this.id === "tim-all") {
				$(".inj-graph-text").css("color", "#000");
				$(".inj-graph").attr("disabled", false);
			}
		 } );
	}


	deselectPoint = function() {
		$(".esri-icon-checkbox-checked").hide();
		graphicsLayer.remove(hilite);
		view.popup.clear();
		view.popup.visible = false;
		userDefinedPoint = new Graphic();
	}


    function createTOC() {
        var lyrs = map.layers;
        var chkd, tocContent = "";
		// var eqTocContent = '<div class="note">Preliminary earthquakes are auto-located using the KGS Earthworm automatic earthquake detection system and have not undergone final review by an analyst. Cataloged earthquakes are manually located by an analyst. All earthquakes are subject to revision.</div><p>';
		var eqTocContent = "";
		var wellsTocContent = "";
		var boundariesTocContent = "";
		var basemapTocContent = "";
		var otherEqContent = '<div class="toc-sub-item esri-icon-right-triangle-arrow group-hdr" id="other-group"><span class="find-hdr-txt">&nbsp;&nbsp;Other</span></div>';
		otherEqContent += '<div class="find-body hide" id="other-group-body">';

        // var transparentLayers = ["Oil and Gas Fields","Topography","Aerial Imagery","2002 Aerials","1991 Aerials"];
		var earthquakeGroup = ["KGS-Cataloged-Events","KGS-Preliminary-Events"];
		var otherEarthquakeGroup = ["NEIC-Cataloged-Events","Historic-Events"];
		var wellsGroup = ["Class-2-Wells","Class-1-Wells"];
		var boundariesGroup = ["2015-Areas-of-Seismic-Concern","2016-Specified-Area","Section-Township-Range","Counties"];
		var basemapGroup = ["Base-Map","Topo","Aerial-Imagery","Basement-Structures","Precambrian-Arbuckle-Faults"];

		tocContent += '<div class="find-header esri-icon-right-triangle-arrow group-hdr" id="eq-group"><span class="find-hdr-txt"> Earthquakes</div>';
		tocContent += '<div class="find-body hide" id="eq-group-body"></div>';

		tocContent += '<div class="find-header esri-icon-right-triangle-arrow group-hdr" id="wells-group"><span class="find-hdr-txt"> Wells</span></div>';
		tocContent += '<div class="find-body hide" id="wells-group-body"></div>';

		tocContent += '<div class="find-header esri-icon-right-triangle-arrow group-hdr" id="boundaries-group"><span class="find-hdr-txt"> Boundaries</span></div>';
		tocContent += '<div class="find-body hide" id="boundaries-group-body"></div>';

		tocContent += '<div class="find-header esri-icon-right-triangle-arrow group-hdr" id="basemap-group"><span class="find-hdr-txt"> Geology and Base Maps</span></div>';
		tocContent += '<div class="find-body hide" id="basemap-group-body"></div>';

        for (var j=lyrs.length - 1; j>-1; j--) {
            var layerID = lyrs._items[j].id;
            chkd = map.findLayerById(layerID).visible ? "checked" : "";
			var htmlID = layerID.replace(/ /g, "-");

			if (earthquakeGroup.indexOf(htmlID) > -1) {
				eqTocContent += "<div class='toc-sub-item dwnld' id='" + htmlID + "'><label><input type='checkbox' class='filterable' value='" + layerID + "' id='tcb-" + j + "' onclick='toggleLayer(" + j + ");'" + chkd + ">" + layerID + "</label></div>";
			}

			if (otherEarthquakeGroup.indexOf(htmlID) > -1) {
				otherEqContent += "<div class='toc-sub-item dwnld' id='" + htmlID + "'><label><input type='checkbox' class='filterable' value='" + layerID + "' id='tcb-" + j + "' onclick='toggleLayer(" + j + ");'" + chkd + ">" + layerID + "</label></div>";
			}

			if (wellsGroup.indexOf(htmlID) > -1) {
				wellsTocContent += "<div class='toc-sub-item dwnld' id='" + htmlID + "'><label><input type='checkbox' class='filterable' value='" + layerID + "' id='tcb-" + j + "' onclick='toggleLayer(" + j + ");'" + chkd + ">" + layerID + "</label></div>";
			}

			if (boundariesGroup.indexOf(htmlID) > -1) {
				boundariesTocContent += "<div class='toc-sub-item' id='" + htmlID + "'><label><input type='checkbox' value='" + layerID + "' id='tcb-" + j + "' onclick='toggleLayer(" + j + ");'" + chkd + ">" + layerID + "</label></div>";
			}

			if (basemapGroup.indexOf(htmlID) > -1) {
				if (htmlID === "Basement-Structures" || htmlID === "Precambrian-Arbuckle-Faults") {
					basemapTocContent += "<div class='toc-sub-item' id='" + htmlID + "'><label><input type='checkbox' value='" + layerID + "' id='tcb-" + j + "' onclick='toggleLayer(" + j + ");'" + chkd + ">" + layerID + "</label></div>";
				} else {
					basemapTocContent += "<div class='toc-sub-item' id='" + htmlID + "'><label><input type='radio' name='bm' value='" + layerID + "' onclick='toggleBasemapLayer();'" + chkd + "> " + layerID + "</label></div>";
				}
			}
        }

		eqTocContent += otherEqContent;

        // tocContent += "<span class='toc-note'>* Some layers only visible when zoomed in</span>";
        $("#lyrs-toc").html(tocContent);
		$("#eq-group-body").html(eqTocContent);
		$("#wells-group-body").html(wellsTocContent);
		$("#boundaries-group-body").html(boundariesTocContent);
		basemapTocContent += "<div class='toc-sub-item' id='" + htmlID + "'><label><input type='radio' name='bm' value='none' onclick='toggleBasemapLayer();'> None</label></div>";
		$("#basemap-group-body").html(basemapTocContent);

		// Click handlers for TOC groups:
		$(".group-hdr").click(function() {
			var group = $(this).attr("id");
			if ( $(this).hasClass("esri-icon-down-arrow") ) {
				$("#" + group + "-body").fadeOut("fast");
			} else {
				$("#" + group + "-body").fadeIn("fast");
			}
			$(this).toggleClass("esri-icon-down-arrow esri-icon-right-triangle-arrow no-border");
		} );

		// Click handler for TOC checkboxes:
		$("[id^='tcb-']").change(function() {
			saveTocPrefs(this.id);
		} );

		// Click handler for TOC basemap radios:
		$("[name='bm']").change(function() {
			saveRadioPrefs("bas-" + this.value);
		} );
    }


    changeOpacity = function(id, dir) {
        var lyr = map.findLayerById(id);
        var incr = (dir === "down") ? -0.2 : 0.2;
        lyr.opacity = lyr.opacity + incr;
    }


    function executeIdTask(event) {
		graphicsLayer.remove(userDefinedPoint);
		userDefinedPoint = new Graphic();

		var idLayers = [];
		var visLayers = $(".toc-sub-item :checked").map(function() {
			return $(this).val();
		} ).get();

		for (var i = 0; i < visLayers.length; i++) {
			switch (visLayers[i]) {
				case "KGS Cataloged Events":
					idLayers.push(14);
					break;
				case "KGS Preliminary Events":
					idLayers.push(15);
					break;
				case "Historic Events":
					idLayers.push(20);
					break;
				case "NEIC Cataloged Events":
					idLayers.push(16);
					break;
				case "Class 2 Wells":
					idLayers.push(19);
					break;
				case "Class 1 Wells":
					idLayers.push(18);
					break;
			}
		}
		var layerids = idLayers.join(",");

		identifyParams.layerIds = [layerids];
        identifyParams.geometry = event.mapPoint;
        identifyParams.mapExtent = view.extent;
		identifyParams.layerDefinitions = idDef;
        dom.byId("mapDiv").style.cursor = "wait";

        identifyTask.execute(identifyParams).then(function(response) {
			return addPopupTemplate(response.results);
        } ).then(function(feature) {
			if (feature.length > 0) {
            	openPopup(feature);
            	highlightFeature(feature);
			} else {
				dom.byId("mapDiv").style.cursor = "auto";
			}
        } );
    }


	function addPopupTemplate(response) {
		return arrayUtils.map(response, function(result) {
			var feature = result.feature;
			var layerName = result.layerName;

			if (layerName === 'OG_WELLS' || layerName === 'Salt Water Disposal Wells') {
				var ogWellsTemplate = new PopupTemplate( {
					title: "<span class='pu-title'>Well: {WELL_LABEL} </span><span class='pu-note'>{API_NUMBER}</span>",
					content: wellContent(feature)
				} );
				feature.popupTemplate = ogWellsTemplate;
			}
			else if (layerName === 'Class 1 Wells') {
				var class1Template = new PopupTemplate( {
					title: "UIC-ID: {UIC_ID}",
					content: class1Content(feature)
					} );
				feature.popupTemplate = class1Template;
			}
			else if (layerName === 'OG_FIELDS') {
				var ogFieldsTemplate = new PopupTemplate( {
					title: "Field: {FIELD_NAME}",
					content: fieldContent(feature)
					} );
				feature.popupTemplate = ogFieldsTemplate;
			}
			else if (layerName === 'WWC5_WELLS') {
				var wwc5Template = new PopupTemplate( {
					title: "Water Well (WWC5): ",
					content: wwc5Content(feature)
				} );
				feature.popupTemplate = wwc5Template;
			}
			else if (layerName.indexOf("Events") > -1) {
				var earthquakeTemplate = new PopupTemplate( {
					title: layerName.replace("Events", "Event"),
					content: earthquakeContent(feature)
				} );
				feature.popupTemplate = earthquakeTemplate;
			}
			return feature;
		} );
	}


    function earthquakeContent(feature) {
		var f = feature.attributes;
		var ag = f.AGENCY !== "Null" ? f.AGENCY : "";
		var ote = f.ORIGIN_TIME_ERR !== "Null" ? f.ORIGIN_TIME_ERR + " seconds" : "";
		var lat = f.LATITUDE !== "Null" ? f.LATITUDE : "";
		var latErr = f.LATITUDE_ERR !== "Null" ? f.LATITUDE_ERR : "";
		var lon = f.LONGITUDE !== "Null" ? f.LONGITUDE : "";
		var lonErr = f.LONGITUDE_ERR !== "Null" ? f.LONGITUDE_ERR : "";
		var dep = f.DEPTH !== "Null" ? f.DEPTH : "";
		var de = f.DEPTH_ERR !== "Null" ? f.DEPTH_ERR : "";
		var m = f.MAGNITUDE !== "Null" ? f.MAGNITUDE : "";
		var mt = f.MAGNITUDE_TYPE !== "Null" ? f.MAGNITUDE_TYPE : "";
		var sas = f.SAS !== "Null" ? f.SAS : "";
		var co = f.COUNTY_NAME !== "Null" ? f.COUNTY_NAME : "";

		if (f.LAYER === 'USGS') {
			var m = f.ML !== "Null" ? parseFloat(f.ML).toFixed(1) + " ml" : "";
		}

		if (dep) { dep = parseFloat(dep).toFixed(1) + " km"; }
		if (de) {
			if (de === "0") {
				de = "0 (fixed)";
			} else {
				de = parseFloat(de).toFixed(1) + " km";
			}
		}
		var hu = "";
		if (latErr && lonErr) {
			var horizontalUncertainty = Math.sqrt( Math.pow(latErr,2) + Math.pow(lonErr,2) );
			hu = horizontalUncertainty.toFixed(1) + " km";
		}

		var content = "<table id='popup-tbl'><tr><td>Event ID: </td><td>{EVENT_ID}</td></tr>";
		content += "<tr><td>Reporting Agency: </td><td>" + ag + "</td></tr>";
		content += "<tr><td>Origin Time (CST): </td><td>{local_time}</td></tr>";
		content += "<tr><td>Origin Time Error: </td><td>" + ote + "</td></tr>";
		content += "<tr><td>Latitude: </td><td>" + lat + "&deg;</td></tr>";
        content += "<tr><td>Longitude: </td><td>" + lon + "&deg;</td></tr>";
		content += "<tr><td>Horizontal Uncertainty: </td><td>" + hu + "</td></tr>";
		content += "<tr><td>Depth: </td><td>" + dep + "</td></tr>";
		content += "<tr><td>Vertical Uncertainty: </td><td>" + de + "</td></tr>";
        content += "<tr><td>Magnitude (" + mt + "): </td><td>" + m + "</td></tr>";
		content += "<tr><td>Seismic Action Score: </td><td>" + sas + "</td></tr>";
		content += "<tr><td>County: </td><td>" + co + "</td></tr>";
        content += "<span id='event-id' class='hide'>{EVENT_ID}</span></table>";

        return content;
    }


	function class1Content(feature) {
		var content = "<table id='popup-tbl'><tr><td>Facility-Well:</td><td>{FACILITY_NAME}</td></tr>";
        content += "<tr><td>County:</td><td>{COUNTY_NAME}</td></tr></table>";

        return content;
	}


    function wwc5Content(feature) {
        var content = "<table id='popup-tbl'><tr><td>County:</td><td>{COUNTY}</td></tr>";
        content += "<tr><td>Section:</td><td>T{TOWNSHIP}S&nbsp;&nbsp;R{RANGE}{RANGE_DIRECTION}&nbsp;&nbsp;Sec {SECTION}</td></tr>";
        content += "<tr><td>Quarter Section:</td><td>{QUARTER_CALL_3}&nbsp;&nbsp;{QUARTER_CALL_2}&nbsp;&nbsp;{QUARTER_CALL_1_LARGEST}</td></tr>";
		content += "<tr><td>Latitude, Longitude (NAD27):</td><td>{NAD27_LATITUDE},&nbsp;&nbsp;{NAD27_LONGITUDE}</td></tr>";
		content += "<tr><td>Owner:</td><td>{OWNER_NAME}</td></tr>";
        content += "<tr><td>Status:</td><td>{STATUS}</td></tr>";
        content += "<tr><td>Depth (ft):</td><td>{DEPTH_TXT}</td></tr>";
        content += "<tr><td>Static Water Level (ft):</td><td>{STATIC_LEVEL_TXT}</td></tr>";
        content += "<tr><td>Estimated Yield (gpm):</td><td>{YIELD_TXT}</td></tr>";
        content += "<tr><td>Elevation (ft):</td><td>{ELEV_TXT}</td></tr>";
        content += "<tr><td>Use:</td><td style='white-space:normal'>{USE_DESC}</td></tr>";
        content += "<tr><td>Completion Date:</td><td>{COMP_DATE_TXT}</td></tr>";
        content += "<tr><td>Driller:</td><td style='white-space:normal'>{CONTRACTOR}</td></tr>";
        content += "<tr><td>DWR Application Number:</td><td>{DWR_APPROPRIATION_NUMBER}</td></tr>";
        content += "<tr><td>Other ID:</td><td>{MONITORING_NUMBER}</td></tr>";
        content += "<tr><td>KGS Record Number:</td><td id='seq-num'>{INPUT_SEQ_NUMBER}</td></tr></table>";

        return content;
    }


    function fieldContent(feature) {
        var f = feature.attributes;
        var po = f.PROD_OIL !== "Null" ? f.PROD_OIL : "";
        var co = f.CUMM_OIL !== "Null" ? f.CUMM_OIL.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
        var pg = f.PROD_GAS !== "Null" ? f.PROD_GAS : "";
        var cg = f.CUMM_GAS !== "Null" ? f.CUMM_GAS.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
        var ac = f.APPROXACRE !== "Null" ? f.APPROXACRE.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
        var frm = f.FORMATIONS.split(",");
        var pf = "";
        for (var i=0; i<frm.length; i++) {
            pf += frm[i] + "<br>";
        }

        var content = "<table id='popup-tbl'><tr><td>Type of Field:</td><td>{FIELD_TYPE}</td></tr>";
        content += "<tr><td>Status:</td><td>{STATUS}</td></tr>";
        content += "<tr><td>Produces Oil:</td><td>" + po + "</td></tr>";
        content += "<tr><td>Cumulative Oil (bbls):</td><td>" + co + "</td></tr>";
        content += "<tr><td>Produces Gas:</td><td>" + pg + "</td></tr>";
        content += "<tr><td>Cumulative Gas (mcf):</td><td>" + cg + "</td></tr>";
        content += "<tr><td>Approximate Acres:</td><td>" + ac + "</td></tr>";
        content += "<tr><td>Producing Formations:</td><td>" + pf + "</td></tr>";
        content += "<span id='field-kid' class='hide'>{FIELD_KID}</span></table>";

        return content;
    }


    function wellContent(feature) {
		var f = feature.attributes;
        var dpth = f.ROTARY_TOTAL_DEPTH !== "Null" ? f.ROTARY_TOTAL_DEPTH.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
        var elev = f.ELEVATION_KB !== "Null" ? f.ELEVATION_KB.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : "";
		// var avgVol = f.MOST_RECENT_TOTAL_FLUID !== "Null" ? f.MOST_RECENT_TOTAL_FLUID : "";
		// avgVol = avgVol.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		if (f.MOST_RECENT_TOTAL_FLUID !== "Null") {
			var avg = parseInt(f.MOST_RECENT_TOTAL_FLUID/12);
			var avgVol = avg.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		} else {
			var avgVol = "";
		}

        var content = "<table id='popup-tbl'><tr><td>Most Recent Average Monthly Injection (bbls):</td><td>" + avgVol + "</td></tr>";
		content += "<tr><td>API:</td><td>{API_NUMBER}</td></tr>";
		content += "<tr><td>Original Operator:</td><td>{OPERATOR_NAME}</td></tr>";
        content += "<tr><td>Current Operator:</td><td>{CURR_OPERATOR}</td></tr>";
        content += "<tr><td>Well Type:</td><td>{STATUS_TXT}</td></tr>";
        content += "<tr><td>Status:</td><td>{WELL_CLASS}</td></tr>";
        content += "<tr><td>Lease:</td><td>{LEASE_NAME}</td></tr>";
        content += "<tr><td>Well:</td><td>{WELL_NAME}</td></tr>";
        content += "<tr><td>Field:</td><td>{FIELD_NAME}</td></tr>";
        content += "<tr><td>Location:</td><td>T{TOWNSHIP}S&nbsp;&nbsp;R{RANGE}{RANGE_DIRECTION}&nbsp;&nbsp;Sec {SECTION}<br>{SPOT}&nbsp;{SUBDIVISION_4_SMALLEST}&nbsp;{SUBDIVISION_3}&nbsp;{SUBDIVISION_2}&nbsp;{SUBDIVISION_1_LARGEST}</td></tr>";
        content += "<tr><td>Latitude, Longitude (NAD27):</td><td>{NAD27_LATITUDE},&nbsp;&nbsp;{NAD27_LONGITUDE}</td></tr>";
        content += "<tr><td>County:</td><td>{COUNTY}</td></tr>";
        content += "<tr><td>Permit Date:</td><td>{PERMIT_DATE_TXT}</td></tr>";
        content += "<tr><td>Spud Date:</td><td>{SPUD_DATE_TXT}</td></tr>";
        content += "<tr><td>Completion Date:</td><td>{COMPLETION_DATE_TXT}</td></tr>";
        content += "<tr><td>Plug Date:</td><td>{PLUG_DATE_TXT}</td></tr>";
        content += "<tr><td>Total Depth (ft):</td><td>" + dpth + "</td></tr>";
        content += "<tr><td>Elevation (KB, ft):</td><td>" + elev + "</td></tr>";
        // content += "<tr><td>Producing Formation:</td><td>{PRODUCING_FORMATION}</td></tr>";
        content += "<span id='well-kid' class='hide'>{KID}</span></table>";

        return content;
    }


    toggleLayer = function(j) {
        var l = map.findLayerById(map.layers._items[j].id);
        l.visible = $("#tcb-" + j).is(":checked") ? true : false;
    }

	toggleBasemapLayer = function() {
		var chkdLyr = $("input[name=bm]:checked").val();
		switch (chkdLyr) {
			case "Topo":
				usgsTopoLayer.visible = true;
				latestAerialsLayer.visible = false;
				basemapLayer.visible = false;
				break;
			case "Base Map":
				basemapLayer.visible = true;
				usgsTopoLayer.visible = false;
				latestAerialsLayer.visible = false;
				break;
			case "Aerial Imagery":
				latestAerialsLayer.visible = true;
				basemapLayer.visible = false;
				usgsTopoLayer.visible = false;
				break;
			case "none":
				basemapLayer.visible = false;
				latestAerialsLayer.visible = false;
				usgsTopoLayer.visible = false;
				break;
		}
	}

} );
