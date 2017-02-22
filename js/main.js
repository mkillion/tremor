
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
	Legend
) {
    var isMobile = WURFL.is_mobile;
	var idDef = [];
	var wmSR = new SpatialReference(3857);
	var urlParams, hilite, bufferGraphic;
	var geomWhere;
	var comboWhere = "";
	var wellsComboWhere = "";
	var wellsGeomWhere;
	var attrWhere = "";
	var wellsAttrWhere = "";
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

    // Combo boxes:
    var autocomplete =  (isMobile) ? false : true; // auto-complete doesn't work properly on mobile (gets stuck on a name and won't allow further typing), so turn it off.
    $.get("fields_json.txt", function(response) {
		// fields_json.txt is updated as part of the og fields update process.
        var fieldNames = JSON.parse(response).items;
        var fieldStore = new Memory( {data: fieldNames} );
        var comboBox = new ComboBox( {
            id: "field-select",
            store: fieldStore,
            searchAttr: "name",
            autoComplete: autocomplete
        }, "field-select").startup();
    } );

    // Create map, layers, and widgets:
    var tremorGeneralServiceURL = "http://services.kgs.ku.edu/arcgis1/rest/services/tremor/tremor_general/MapServer";
    var identifyTask, identifyParams;
    var findTask = new FindTask(tremorGeneralServiceURL);
    var findParams = new FindParameters();
	findParams.returnGeometry = true;

    var basemapLayer = new TileLayer( {url:"http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer", id:"Topo", visible:true} );
    // var fieldsLayer = new TileLayer( {url:"http://services.kgs.ku.edu/arcgis8/rest/services/oilgas/oilgas_fields/MapServer", id:"Oil and Gas Fields", visible:false} );
    // var wellsLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:0}], id:"Oil and Gas Wells",  visible:false} );
    var plssLayer = new TileLayer( {url:"http://services.kgs.ku.edu/arcgis8/rest/services/plss/plss/MapServer", id:"Section-Township-Range", visible:false} );
    // var usgsEventsLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:13}], id:"Earthquakes", visible:false} );
	var latestAerialsLayer = new ImageryLayer( {url:"http://services.kgs.ku.edu/arcgis7/rest/services/IMAGERY_STATEWIDE/FSA_NAIP_2015_Color/ImageServer", id:"Aerial Imagery", visible:false} );
	var kgsCatalogedLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:14}], id:"KGS Cataloged Events", visible:true} );
	var kgsPrelimLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:15}], id:"KGS Preliminary Events", visible:true} );
	var neicLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:16}], id:"NEIC Cataloged Events", visible:false} );
	// var ogsLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:17}], id:"OGS Cataloged Events", visible:false} );
	var seismicConcernLayer = new MapImageLayer( {url:"http://services.kgs.ku.edu/arcgis1/rest/services/tremor/seismic_areas/MapServer", sublayers:[{id:0}], id:"2015 Areas of Seismic Concern", visible:false} );
	var seismicConcernExpandedLayer = new MapImageLayer( {url:"http://services.kgs.ku.edu/arcgis1/rest/services/tremor/seismic_areas/MapServer", sublayers:[{id:1}], id:"2016 Specified Area", visible:false} );
	// var class1Layer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:18}], id:"Class I Injection Wells", visible:false} );
	var swdLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:19}], id:"Salt Water Disposal Wells", visible:false} );
	// var countiesLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:2}], id:"Counties", visible:true} );
	var countiesLayer = new MapImageLayer( {url:"http://services.kgs.ku.edu/arcgis5/rest/services/admin_boundaries/KS_County_Boundaries/MapServer", id:"Counties", visible:true} );
	var historicLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:20}], id:"Historic Events", visible:false} );

    var map = new Map( {
		layers: [basemapLayer, latestAerialsLayer, plssLayer, countiesLayer, swdLayer, seismicConcernExpandedLayer, seismicConcernLayer, neicLayer, kgsPrelimLayer, kgsCatalogedLayer, historicLayer]
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

        on(view, "click", executeIdTask);

        identifyTask = new IdentifyTask(tremorGeneralServiceURL);
        identifyParams = new IdentifyParameters();
		identifyParams.returnGeometry = true;
        identifyParams.tolerance = (isMobile) ? 9 : 4;
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
            }
        } );
		updateMap();
    } );

	var searchWidget = new Search( {
		view: view,
		popupEnabled: false
	}, "srch" );

	var homeBtn = new Home({
        view: view
	} );
    homeBtn.startup();
	view.ui.add(homeBtn, {
    	position: "top-left",
        index: 1
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
		}
		// {
		// 	layer: class1Layer,
		// 	title: " "
		// }
		]
	}, "legend-content" );

    // End map and map widgets.

	urlParams = location.search.substr(1);
    urlZoom(urlParams);

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

	$("#chart-x").click(function() {
		$("#chart").highcharts().destroy();
		$("#chart-x, #chart").hide();
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
			alert("Please select an event or well to buffer.")
		}
		$("[name=loc-type]").filter("[value='buf']").prop("checked", true);
	}


	checkTimeRadio = function() {
		$("[name=time-type]").prop("checked", false);
		$("[name=time-type]").filter("[value='date']").prop("checked", true);
	}


	checkMagRadio = function() {
		$("[name=mag-type]").prop("checked", false);
		$("[name=mag-type]").filter("[value='magrange']").prop("checked", true);
	}

	checkWellRadio = function(box) {
		if (box === 'bbls') {
			$("#chk-bbls").prop("checked", true);
		} else {
			$("[name=well-type]").prop("checked", false);
			if (box === 'buff-disp') {
				$("[name=well-type]").filter("[value='buff-disp']").prop("checked", true);
			} else {
				if (!view.popup.selectedFeature) {
					alert("Please select a feature to buffer.")
				}
				$("[name=well-type]").filter("[value='buff-feat']").prop("checked", true);
			}
		}
	}


	resetDefaults = function() {
		graphicsLayer.removeAll();
		view.popup.clear();
		view.popup.visible = false;

		$("[name=loc-type]").filter("[value='state']").prop("checked", true);
		$("[name=time-type]").filter("[value='week']").prop("checked", true);
		// TODO: reset next 2 lines when done testing:
		// $("[name=mag-type]").filter("[value='gt3517']").prop("checked", true);
		$("[name=mag-type]").filter("[value='all']").prop("checked", true)
		$('select[multiple]').multiselect("reset");
		$("#from-date, #to-date, #low-mag, #high-mag").val("");
		$("#loc-buff").val("6");
		$("[name=well-type]").filter("[value='bbls']").prop("checked", false);
		$("#bbls").val("5000");
		$(".esri-icon-checkbox-checked").hide();
		$(".esri-icon-erase").hide();

		swdLayer.findSublayerById(19).definitionExpression = "";
		kgsCatalogedLayer.findSublayerById(14).definitionExpression = "";
		kgsPrelimLayer.findSublayerById(15).definitionExpression = "";
		neicLayer.findSublayerById(16).definitionExpression = "";
		historicLayer.findSublayerById(20).definitionExpression = "";
		swdLayer.findSublayerById(19).definitionExpression = "";
		idDef[19] = "";
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


	// sendProblem = function() {
	// 	var sfa = view.popup.selectedFeature.attributes;
	// 	if (sfa.hasOwnProperty('INPUT_SEQ_NUMBER')) {
	// 		var fId = sfa.INPUT_SEQ_NUMBER;
	// 		var fName = sfa.OWNER_NAME;
	// 		var fType = "wwc5";
	// 		var otherId = "";
	// 	} else if (sfa.hasOwnProperty('API_NUMBER')) {
	// 		var fId = sfa.KID;
	// 		var fName = sfa.LEASE_NAME + " " + sfa.WELL_NAME;
	// 		var fType = "ogwell";
	// 		var otherId = sfa.API_NUMBER;
	// 	} else if (sfa.hasOwnProperty('MAG')) {
	// 		var fId = sfa.ID;
	// 		var fName = "";
	// 		var fType = "earthquake";
	// 		var otherId = "";
	// 	} else if (sfa.hasOwnProperty('FIELD_KID')) {
	// 		var fId = sfa.FIELD_KID;
	// 		var fName = sfa.FIELD_NAME;
	// 		var fType = "field";
	// 		var otherId = "";
	// 	}
	//
	// 	$.ajax( {
	// 	  type: "post",
	// 	  url: "reportProblem.cfm",
	// 	  data: {
	// 		  "id": fId,
	// 		  "name": fName,
	// 		  "type": fType,
	// 		  "otherId": otherId,
	// 		  "msg": $("#prob-msg").val()
	// 	  }
	// 	} );
	// 	$("#prob-dia").dialog("close");
	// }


	// filterOG = function() {
	// 	var def = [];
	// 	var theWhere = "";
	// 	var typeWhere = "";
	// 	var dateWhere = "";
	// 	var opWhere = "";
	// 	var injWhere = "";
	// 	var hrzWhere = "";
	// 	var depthWhere = "";
	// 	var paperLogWhere = "";
	// 	var scanLogWhere = "";
	// 	var lasWhere = "";
	// 	var coreWhere = "";
	// 	var cuttingsWhere = "";
	// 	var ogType = $("#og-well-type").val();
	// 	var fromDate = dom.byId("og-from-date").value;
	// 	var toDate = dom.byId("og-to-date").value;
	// 	var op = dom.byId(operators).value;
	// 	var ogHas = $('input[name="og-has"]:checked').map(function() {
	// 	    return this.value;
	// 	} ).get();
	// 	var inj = dom.byId("inj").value;
	// 	var depthGT = dom.byId("og-gt-depth").value;
	// 	var depthLT = dom.byId("og-lt-depth").value;
	//
	// 	if (ogType) {
	// 		var typeList = "'" + ogType.join("','") + "'";
	// 		typeWhere = "status_txt in (" + typeList +")";
	// 	}
	//
	// 	if (fromDate && toDate) {
	// 		dateWhere = "completion_date >= to_date('" + fromDate + "','mm/dd/yyyy') and completion_date < to_date('" + toDate + "','mm/dd/yyyy') + 1";
	// 	} else if (fromDate && !toDate) {
	// 		dateWhere = "completion_date >= to_date('" + fromDate + "','mm/dd/yyyy')";
	// 	} else if (!fromDate && toDate) {
	// 		dateWhere = "completion_date < to_date('" + toDate + "','mm/dd/yyyy') + 1";
	// 	}
	//
	// 	if (op) {
	// 		opWhere = "curr_operator = '" + op + "'";
	// 	}
	//
	// 	if (inj) {
	// 		if (inj === "inj-1") {
	// 			injWhere = "well_type = 'CLASS1'";
	// 		} else {
	// 			injWhere = "status in ('SWD','EOR','INJ')";
	// 		}
	// 	}
	//
	// 	if (dom.byId(hrz).checked) {
	// 		hrzWhere = "substr(api_workovers, 1, 2) <> '00'";
	// 	}
	//
	// 	if (depthGT && depthLT) {
	// 		if (parseInt(depthLT) < parseInt(depthGT)) {
	// 			alert("Invalid depth values: less-than value must be larger than greater-than value.");
	// 		} else {
	// 			depthWhere = "rotary_total_depth >= " + depthGT + " and rotary_total_depth <= " + depthLT;
	// 		}
	// 	} else if (depthGT && !depthLT) {
	// 		depthWhere = "rotary_total_depth >= " + depthGT;
	// 	} else if (!depthGT && depthLT) {
	// 		depthWhere = "rotary_total_depth <= " + depthLT;
	// 	}
	//
	// 	for (var y=0; y<ogHas.length; y++) {
	// 		switch (ogHas[y]) {
	// 			case "paper-log":
	// 				paperLogWhere = "kid in (select well_header_kid from elog.log_headers)";
	// 				break;
	// 			case "scan-log":
	// 				scanLogWhere = "kid in (select well_header_kid from elog.scan_urls)";
	// 				break;
	// 			case "las":
	// 				lasWhere = "kid in (select well_header_kid from las.well_headers where proprietary = 0)";
	// 				break;
	// 			case "core":
	// 				coreWhere = "kid in (select well_header_kid from core.core_headers)";
	// 				break;
	// 			case "cuttings":
	// 				cuttingsWhere = "kid in (select well_header_kid from cuttings.boxes)";
	// 				break;
	// 		}
	// 	}
	//
	// 	if (typeWhere !== "") {
	// 		theWhere += typeWhere + " and ";
	// 	}
	// 	if (dateWhere !== "") {
	// 		theWhere += dateWhere + " and ";
	// 	}
	// 	if (opWhere !== "") {
	// 		theWhere += opWhere + " and ";
	// 	}
	// 	if (injWhere !== "") {
	// 		theWhere += injWhere + " and ";
	// 	}
	// 	if (hrzWhere !== "") {
	// 		theWhere += hrzWhere + " and ";
	// 	}
	// 	if (depthWhere !== "") {
	// 		theWhere += depthWhere + " and ";
	// 	}
	// 	if (paperLogWhere !== "") {
	// 		theWhere += paperLogWhere + " and ";
	// 	}
	// 	if (scanLogWhere !== "") {
	// 		theWhere += scanLogWhere + " and ";
	// 	}
	// 	if (lasWhere !== "") {
	// 		theWhere += lasWhere + " and ";
	// 	}
	// 	if (coreWhere !== "") {
	// 		theWhere += coreWhere + " and ";
	// 	}
	// 	if (cuttingsWhere !== "") {
	// 		theWhere += cuttingsWhere + " and ";
	// 	}
	// 	if (theWhere.substr(theWhere.length - 5) === " and ") {
	// 		theWhere = theWhere.slice(0,theWhere.length - 5);
	// 	}
	//
	// 	def[0] = theWhere;
	// 	idDef[0] = def[0];
	// 	wellsLayer.findSublayerById(0).definitionExpression = def[0];
	// }


	clearOgFilter = function() {
		dom.byId("operators").value = "";
		$(".og-input").val("");
		$('input[name="og-has"]').removeAttr("checked");
		$('select.og-select option').removeAttr("selected");
		dom.byId("hrz").checked = false;
		wellsLayer.findSublayerById(0).definitionExpression = null;
		idDef[0] = "";
	}


	filterSwitch = function() {
		if ( !$('input[name=area-type]:checked').val() ) {
			alert("Please select an area.");
			return;
		}
		if ( !$('input[name=return-type]:checked').val() ) {
			alert("Please select a feature type.");
			return;
		}
		if ( $('input[name=return-type]:checked').val() === "Oil and Gas" && ( $('input[name=area-type]:checked').val() === "sca" || $('input[name=area-type]:checked').val() === "buff" ) ) {
			if (view.zoom < 10) {
				alert("To select oil wells within this area you must zoom in until the wells are visible.");
				return;
			}
		}

		switch ( $('input[name=area-type]:checked').val() ) {
			case "state":
			case "co":
				filterStateCounty();
				break;
			case "sca":
				filterSca();
				break;
			case "buff":
				filterBuff();
				break;
		}
		// Clear list, close chart if open, remove download and chart icons until the list loads:
		$("#wells-tbl").html("");
		if ( $("#chart").highcharts() ) {
			$("#chart").highcharts().destroy();
			$("#chart-x, #chart").hide();
		}
		$(".esri-icon-line-chart").hide();
		$(".esri-icon-download").hide();
	}


	updateMap = function() {
		var locWhere = "";
		var timeWhere = "";
		var magWhere = "";
		wellsWhere = "";
		attrWhere = "";
		geomWhere = "";
		wellsGeomWhere = "";
		wellsAttrWhere = "";

		// Remove download links and clear graphics:
		$(".download-link").html("");
		graphicsLayer.removeAll();

		// Create location clause:
		var location = $("input[name=loc-type]:checked").val();
		switch (location) {
			case "state":
				// blank in this case, events already limited by definition query in mxd.
				break;
			case "buf":
				locBuff = $("#loc-buff").val();
				if (view.popup.selectedFeature) {
					createBufferGeom(locBuff);
				} else {
					alert("Please select an event or well to buffer.");
				}
				break;
			case "co":
				var counties = "'" + $("#lstCounty2").val().join("','") + "'";
				if (counties !== 'Counties') {
					locWhere = "county_name in (" + counties + ")";
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
		var time = $("input[name=time-type]:checked").val();
		switch (time) {
			case "week":
				timeWhere = "sysdate - cast(origin_time_cst as date) <= 6";
				break;
			case "month":
				timeWhere = "sysdate - cast(origin_time_cst as date) <= 29";
				break
			case "year":
				timeWhere = "to_char(origin_time_cst,'YYYY') = to_char(sysdate, 'YYYY')";
				break;
			case "date":
				var fromDate = dom.byId('from-date').value;
				var toDate = dom.byId('to-date').value;
				if (fromDate && toDate) {
					timeWhere = "trunc(origin_time_cst) >= to_date('" + fromDate + "','mm/dd/yyyy') and trunc(origin_time_cst) <= to_date('" + toDate + "','mm/dd/yyyy')";
				} else if (fromDate && !toDate) {
					timeWhere = "trunc(origin_time_cst) >= to_date('" + fromDate + "','mm/dd/yyyy')";
				} else if (!fromDate && toDate) {
					timeWhere = "trunc(origin_time_cst) <= to_date('" + toDate + "','mm/dd/yyyy')";
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
					magWhere = "mc >= " + lMag + " and mc <= " + uMag;
				} else if (lMag && !uMag) {
					magWhere = "mc >= " + lMag;
				} else if (!lMag && uMag) {
					magWhere = "mc <= " + uMag;
				}
				break
			case "gt3517":
				magWhere = "(mc >= 3.5 or sas >= 17)";
				break;
		}

		// Create wells clause:
		var well = $("input[name=well-type]:checked").val();
		switch (well) {
			case "all":
				// blank in this case.
				break;
			case "bbls":
				var bbls = $("#bbls").val();
				// TODO: rework when real injection wishes are know:
				wellsWhere = "has_injection_data = 1";
				break
		}

		// Put where clauses together (excluding wells clause which is created separately):
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

		// Put wells clause together w/ location where:
		if (wellsWhere !== "") {
			wellsAttrWhere += wellsWhere + " and ";
		}
		if (locWhere !== "") {
			wellsAttrWhere += locWhere + " and ";
		}
		// Strip off final "and":
		if (wellsAttrWhere.substr(wellsAttrWhere.length - 5) === " and ") {
			wellsAttrWhere = wellsAttrWhere.slice(0,wellsAttrWhere.length - 5);
		}

		if ( (location === "buf" || location === "sca") && (geomWhere == "" || wellsGeomWhere == "") ) {
			setTimeout(waitForGeomWheres(), 100);
		} else {
			applyDefExp();
		}
	}	// end updateMap().


	function createBufferGeom(buffDist) {
		graphicsLayer.remove(bufferGraphic);

		if (view.popup.selectedFeature) {
			var f = view.popup.selectedFeature;
			if (f.geometry.type === "point") {
				var buffFeature = new Point( {
				    x: f.geometry.x,
				    y: f.geometry.y,
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
				target: buffPoly.extent
			}, {duration: 500} );

			createGeomWhere(buffPoly);
			createwellsGeomWhere(buffPoly);
		} else {
			alert("Please select a feature to buffer");
		}
	}


	function waitForGeomWheres() {
		if (geomWhere !== "" && wellsGeomWhere !== "") {
			applyDefExp();
		} else {
			setTimeout(waitForGeomWheres, 100);
		}
	}


	function filterStateCounty() {
		openToolsPanel();

		var oids = [];
		var theWhere = "";
		var returnType = $('input[name=return-type]:checked').val();
		var areaType = $('input[name=area-type]:checked').val();

		var qt = new QueryTask();
		var qry = new Query();

		if ( returnType === "Class I Injection" ) {
			if (areaType === "state") {
				theWhere += "well_type = 'CLASS1'";
				zoomToState();
			} else {
				theWhere += "county = '" + dom.byId("lstCounty2").value + "'";
				class1Layer.findSublayerById(18).definitionExpression = "county = '" + dom.byId("lstCounty2").value + "'";
			}
			qt.url = tremorGeneralServiceURL + "/18";
			qry.where = theWhere;

			class1Layer.visible = true;
			idDef[18] = theWhere;
			// idDef[0] = theWhere;	// prevents the well underneath the class1 layer point from being ID'd.
			$("#Class-I-Injection-Wells input").prop("checked", true);

			qt.executeForIds(qry).then(function(ids) {
				if (ids) {
					oids = oids.concat(ids);
				}
				createWellsList(oids, returnType, areaType);
			} );
		}

		if ( returnType === "Salt Water Disposal" ) {
			if (areaType === "state") {
				theWhere += "well_type = 'SWD'";
				zoomToState();
			} else {
				theWhere += "county = '" + dom.byId("lstCounty2").value + "'";
				swdLayer.findSublayerById(19).definitionExpression = "county = '" + dom.byId("lstCounty2").value + "'";
			}
			qt.url = tremorGeneralServiceURL + "/19";
			qry.where = theWhere;

			swdLayer.visible = true;
			idDef[19] = theWhere;
			$("#Salt-Water-Disposal-Wells input").prop("checked", true);

			qt.executeForIds(qry).then(function(ids) {
				if (ids) {
					oids = oids.concat(ids);
				}
				createWellsList(oids, returnType, areaType);
			} );
		}

		if ( returnType === "Oil and Gas" && areaType === "co") {
			theWhere += "county = '" + dom.byId("lstCounty2").value + "'";

			qt.url = tremorGeneralServiceURL + "/0";
			qry.where = theWhere;

			wellsLayer.findSublayerById(0).definitionExpression = "county = '" + dom.byId("lstCounty2").value + "'";
			wellsLayer.visible = true;
			idDef[0] = theWhere;
			// idDef[18] = theWhere;	// prevents the class1 well on top of the og layer from being ID'd.
			$("#Oil-and-Gas-Wells input").prop("checked", true);

			qt.executeForIds(qry).then(function(ids) {
				if (ids) {
					oids = oids.concat(ids);
				}
				createWellsList(oids, returnType, areaType);
			} );
		}

		if ( returnType === "Earthquakes" ) {
			// Get checked earthquake layers:
			var lIDs = [];
			var chkdIDs = $("input:checked[name=evt-lay]").map(function() {
				return $(this).val();
			} ).get();
			$.each(chkdIDs, function(idx, val) {
				lIDs.push(parseInt(val));
			} );

			if (lIDs.length === 0) {
				alert("Please select at least one earthquake type.");
				return;
			}

			$.each(lIDs, function(idx, val) {
				theWhere = earthquakeWhereClause(areaType, [val]);

				if (theWhere !== "") {
					qry.where = theWhere;
				} else {
					// Dummy clause to select all:
					qry.where = "event_id > 0";
				}

				qt.url = tremorGeneralServiceURL + "/" + [val];
				qt.executeForIds(qry).then(function(ids) {
					if (ids) {
						oids = oids.concat(ids);
					}
				} );
			} );
			setTimeout(function() {
				createWellsList(oids, returnType, areaType);
			}, 3000);

			// Turn on selected layers and filter features w/ a definitionExpression:
			// applyDefExp(lIDs, theWhere);

			if (areaType === "state") {
				zoomToState();
			}
		}

		// Highlight county:
		if (areaType === "co") {
			var ft2 = new FindTask(tremorGeneralServiceURL);
			var fp2 = new FindParameters();
			fp2.returnGeometry = true;
			fp2.layerIds = [2];
			fp2.searchFields = ["COUNTY"];
			fp2.searchText = dom.byId("lstCounty2").value;
			ft2.execute(fp2).then(function(result) {
				// highlightFeature(result.results[0].feature);
				zoomToFeature(result.results[0].feature);
			} );
		}
		$("#filter-buff-dia").dialog("close");
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
		qt.url = "http://services.kgs.ku.edu/arcgis1/rest/services/tremor/seismic_areas/MapServer/" + serviceLyr;
		qt.execute(qry).then(function(result) {
			var f = result.features;
			geom = (f[0].geometry);
			if (f.length > 1) {
				for (var i = 1; i < f.length; i++) {
					geom = geometryEngine.union( [ geom, f[i].geometry ] );
				}
			}
			geomWhere = createGeomWhere(geom);
			wellsGeomWhere = createwellsGeomWhere(geom);
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


	function createwellsGeomWhere(geom) {
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


	function filterSca(scas) {
		graphicsLayer.removeAll();
		// openToolsPanel();

		// var returnType = $('input[name=return-type]:checked').val();
		// var areaType = $('input[name=area-type]:checked').val();
		var ft = new FindTask("http://services.kgs.ku.edu/arcgis1/rest/services/tremor/seismic_areas/MapServer");
		var fp = new FindParameters();
		var qt = new QueryTask();
		var qry = new Query();
		var oids = [];
		var objIds;
		var cfData;

		fp.returnGeometry = true;
		fp.layerDefinitions = [];

		// Find task to get geometry of selected sca:
		// if (dom.byId("sca").value === "Expanded Area") {
		// 	fp.layerIds = [1];
		// 	fp.searchFields = ["OBJECTID"];
		// 	fp.searchText = "1";
		// 	seismicConcernExpandedLayer.visible = true;
		// 	$("#Expanded-Area-of-Seismic-Concern input").prop("checked", true);
		// } else {
		// 	fp.layerIds = [0];
		// 	fp.searchFields = ["AREA_NAME"];
		// 	fp.searchText = dom.byId("sca").value;
		// 	seismicConcernLayer.visible = true;
		// 	$("#Areas-of-Seismic-Concern input").prop("checked", true);
		// }
		fp.layerIds = [0];
		fp.searchFields = ["AREA_NAME"];
		fp.searchText = dom.byId("sca").value;
		ft.execute(fp).then(function(result) {
			// highlightFeature(result.results[0].feature);
			zoomToFeature(result.results[0].feature);

			// Query task to get feature objectids within sca geometry:
			if ( returnType === "Earthquakes" ) {
				// Get checked earthquake layers:
				var lIDs = [];
				var chkdIDs = $("input:checked[name=evt-lay]").map(function() {
					return $(this).val();
				} ).get();
				$.each(chkdIDs, function(idx, val) {
					lIDs.push(parseInt(val));
				} );
				if (lIDs.length === 0) {
					alert("Please select at least one earthquake type.");
					return;
				}

				qry.geometry = result.results[0].feature.geometry;

				$.each(lIDs, function(idx, val) {
					theWhere = earthquakeWhereClause(areaType, [val]);

					if (theWhere !== "") {
						qry.where = theWhere;
					} else {
						// Dummy clause to select all:
						qry.where = "event_id > 0";
					}

					qt.url = tremorGeneralServiceURL + "/" + [val];
					qt.executeForIds(qry).then(function(ids) {
						if (ids) {
							oids = oids.concat(ids);
						}
					} );
				} );
				setTimeout(function() {
					objIds = oids.join(",");
					cfData = { "type": returnType, "objIds": objIds };

					$.post( "createDefExpTable.cfm", cfData, function(response) {
						var tempTable = response;
						createWellsList(oids, returnType, areaType);
						// applyDefExp(lIDs, theWhere, tempTable);
					} );
				}, 3000 );
			}

			if ( returnType === "Class I Injection" ) {
				qt.url = tremorGeneralServiceURL + "/18";
				qry.geometry = result.results[0].feature.geometry;
				class1Layer.visible = true;
				$("#Class-I-Injection-Wells input").prop("checked", true);

				qt.executeForIds(qry).then(function(ids) {
					if (ids) {
						oids = oids.concat(ids);
					}

					createWellsList(oids, returnType, areaType);

					var oidList = oids.join(",");
					class1Layer.findSublayerById(18).definitionExpression = "objectid in (" + oidList + ")";
					idDef[18] = "objectid in (" + oidList + ")";
				} );
			}

			if ( returnType === "Oil and Gas" ) {
				qt.url = tremorGeneralServiceURL + "/0";
				qry.geometry = result.results[0].feature.geometry;
				wellsLayer.visible = true;
				$("#Oil-and-Gas-Wells input").prop("checked", true);

				qt.executeForIds(qry).then(function(ids) {
					if (ids) {
						oids = oids.concat(ids);
					}

					createWellsList(oids, returnType, areaType);

					objIds = oids.join(",");
					cfData = { "type": returnType, "objIds": objIds };

					$.post( "createDefExpTable.cfm", cfData, function(response) {
						var tempTable = response;
						wellsLayer.findSublayerById(0).definitionExpression = "objectid in (select oid from " + tempTable + ")";
						idDef[0] = "kid in (select kid from " + tempTable + ")";
					} );
				} );
			}

			if ( returnType === "Salt Water Disposal" ) {
				qt.url = tremorGeneralServiceURL + "/19";
				qry.geometry = result.results[0].feature.geometry;
				swdLayer.visible = true;
				$("#Salt-Water-Disposal-Wells input").prop("checked", true);

				qt.executeForIds(qry).then(function(ids) {
					if (ids) {
						oids = oids.concat(ids);
					}

					createWellsList(oids, returnType, areaType);

					objIds = oids.join(",");
					cfData = { "type": returnType, "objIds": objIds };

					$.post( "createDefExpTable.cfm", cfData, function(response) {
						var whr = "objectid in (select oid from " + response + ")";
						swdLayer.findSublayerById(19).definitionExpression = whr;
						idDef[19] = whr;
					} );
				} );
			}
		} );
		$("#filter-buff-dia").dialog("close");
	}


	function filterBuff() {
		graphicsLayer.removeAll();
		openToolsPanel();

		var returnType = $('input[name=return-type]:checked').val();
		var areaType = $('input[name=area-type]:checked').val();
		var qt = new QueryTask();
		var qry = new Query();
		var oids = [];
		var objIds;
		var cfData;

		// Create buffer and display graphic:
		graphicsLayer.remove(bufferGraphic);

		var f = view.popup.selectedFeature;
		if (f.geometry.type === "point") {
			var buffFeature = new Point( {
			    x: f.geometry.x,
			    y: f.geometry.y,
			    spatialReference: wmSR
			 } );
		} else {
			var buffFeature = new Polygon( {
			    rings: f.geometry.rings,
			    spatialReference: wmSR
			 } );
		}

		var buffPoly = geometryEngine.geodesicBuffer(buffFeature, dom.byId('buff-dist').value, dom.byId('buff-units').value);
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
		//view.extent = buffPoly.extent;
		view.goTo( {
			target: buffPoly.extent
		}, {duration: 500} );

		if ( returnType === "Earthquakes" ) {
			// Get checked earthquake layers:
			var lIDs = [];
			var chkdIDs = $("input:checked[name=evt-lay]").map(function() {
				return $(this).val();
			} ).get();
			$.each(chkdIDs, function(idx, val) {
				lIDs.push(parseInt(val));
			} );
			if (lIDs.length === 0) {
				alert("Please select at least one earthquake type.");
				return;
			}

			qry.geometry = buffPoly;

			$.each(lIDs, function(idx, val) {
				theWhere = earthquakeWhereClause(areaType, [val]);

				if (theWhere !== "") {
					qry.where = theWhere;
				} else {
					// Dummy clause to select all:
					qry.where = "event_id > 0";
				}

				qt.url = tremorGeneralServiceURL + "/" + [val];
				qt.executeForIds(qry).then(function(ids) {
					if (ids) {
						oids = oids.concat(ids);
					}
				} );
			} );
			setTimeout(function() {
				objIds = oids.join(",");
				cfData = { "type": returnType, "objIds": objIds };

				$.post( "createDefExpTable.cfm", cfData, function(response) {
					var tempTable = response;
					createWellsList(oids, returnType, areaType);
					// applyDefExp(lIDs, theWhere, tempTable);
				} );
			}, 3000 );
		}

		if ( returnType === "Class I Injection" ) {
			qt.url = tremorGeneralServiceURL + "/18";
			qry.geometry = buffPoly;
			class1Layer.visible = true;
			$("#Class-I-Injection-Wells input").prop("checked", true);

			qt.executeForIds(qry).then(function(ids) {
				if (ids) {
					oids = oids.concat(ids);
				}

				createWellsList(oids, returnType, areaType);

				var oidList = oids.join(",");
				class1Layer.findSublayerById(18).definitionExpression = "objectid in (" + oidList + ")";
				idDef[18] = "objectid in (" + oidList + ")";
			} );
		}

		if ( returnType === "Oil and Gas" ) {
			qt.url = tremorGeneralServiceURL + "/0";
			qry.geometry = buffPoly;
			wellsLayer.visible = true;
			$("#Oil-and-Gas-Wells input").prop("checked", true);

			qt.executeForIds(qry).then(function(ids) {
				if (ids) {
					oids = oids.concat(ids);
				}

				createWellsList(oids, returnType, areaType);

				objIds = oids.join(",");
				cfData = { "type": returnType, "objIds": objIds };

				$.post( "createDefExpTable.cfm", cfData, function(response) {
					var tempTable = response;
					wellsLayer.findSublayerById(0).definitionExpression = "objectid in (select oid from " + tempTable + ")";
					idDef[0] = "kid in (select kid from " + tempTable + ")";
				} );
			} );
		}

		if ( returnType === "Salt Water Disposal" ) {
			qt.url = tremorGeneralServiceURL + "/19";
			qry.geometry = buffPoly;
			swdLayer.visible = true;
			$("#Salt-Water-Disposal-Wells input").prop("checked", true);

			qt.executeForIds(qry).then(function(ids) {
				if (ids) {
					oids = oids.concat(ids);
				}

				createWellsList(oids, returnType, areaType);

				objIds = oids.join(",");
				cfData = { "type": returnType, "objIds": objIds };

				$.post( "createDefExpTable.cfm", cfData, function(response) {
					var whr = "objectid in (select oid from " + response + ")";
					swdLayer.findSublayerById(19).definitionExpression = whr;
					idDef[19] = whr;
				} );
			} );
		}
		$("#filter-buff-dia").dialog("close");
	}


	function applyDefExp() {
		comboWhere = "";
		wellsComboWhere = "";
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
		var magtype = "mc";

		if (lyrID[0] == 16) {
			magtype = "ml";
		}

		if (fromDate && toDate) {
			dateWhere = "trunc(origin_time_cst) >= to_date('" + fromDate + "','mm/dd/yyyy') and trunc(origin_time_cst) <= to_date('" + toDate + "','mm/dd/yyyy')";
		} else if (fromDate && !toDate) {
			dateWhere = "trunc(origin_time_cst) >= to_date('" + fromDate + "','mm/dd/yyyy')";
		} else if (!fromDate && toDate) {
			dateWhere = "trunc(origin_time_cst) <= to_date('" + toDate + "','mm/dd/yyyy')";
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
    }


    function urlZoom(urlParams) {
        var items = urlParams.split("&");
        if (items.length > 1) {
            var extType = items[0].substring(11);
            var extValue = items[1].substring(12);

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
            }

            findParams.searchText = extValue;
            findTask.execute(findParams)
            .then(function(response) {
				return addPopupTemplate(response.results);
            } )
            .then(function(feature) {
				if (feature.length > 0) {
					openPopup(feature);
	                zoomToFeature(feature);
				}
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
			if (what === "api" || what === "field" || what === "event") {
				openPopup(feature);
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
				var aDate = new Date(a.feature.attributes["origin_time_cst"]);
				var bDate = new Date(b.feature.attributes["origin_time_cst"]);
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


	function createWellsList(arrIds, returnType, areaType) {
		var eqType = "";
		var count = arrIds.length;

		switch (areaType) {
			case "state":
				var areaString = "in the state:";
				break;
			case "co":
				var areaString = "in " + dom.byId("lstCounty2").value + " county:";
				break;
			case "sca":
				var areaString = "in the " + dom.byId("sca").value + " area:";
				break;
			case "buff":
				var areaString = "in the buffer:";
				break;
		}

		if (returnType === "Earthquakes") {
			var chkdIDs = $("input:checked[name=evt-lay]").map(function() {
				return $(this).val();
			} ).get();
			eqType = chkdIDs.join(", ");
			eqType = eqType.replace(14, "KGS");
			eqType = eqType.replace(15, "KGS Prelim");
			eqType = eqType.replace(16, "NEIC");
			// eqType = eqType.replace(17, "OGS");
			eqType = " (" + eqType + ") ";
			var typeString = "earthquakes ";
		}
		if (returnType === "Class I Injection") {
			var typeString = "class I injection wells ";
		}
		if (returnType === "Oil and Gas") {
			var typeString = "oil and gas wells ";
		}
		if (returnType === "Salt Water Disposal") {
			var typeString = "salt water disposal wells ";
		}

		var wellsLst = "<div class='panel-sub-txt' id='list-txt'></div><div class='download-link'></div><div class='toc-note' id='sect-desc'>" + count + " " + typeString + eqType + areaString + "</div>";
		$("#wells-tbl").html(wellsLst);

		var lstIds = arrIds.join(",");
		data = { "type": returnType, "lstIds": lstIds };

		if (count > 500) {
			$("#wells-tbl").append("&nbsp;&nbsp;&nbsp;(listing 500 records - download csv file to see all)");
		}

		if (count > 0) {
			$.post( "createFeatureList.cfm?type=" + returnType, data, function(response) {
				sharedCfTable = response.substr(0,31);

				if (returnType === "Earthquakes") {
					graphIcon = "<a class='esri-icon-line-chart' title='Graph earthquakes'></a>";
				} else {
					graphIcon = "";
				}

				$("#wells-tbl").append(response.replace(sharedCfTable,''));
				$("#loader").hide();
				$("#dwnld").html("<a class='esri-icon-download' title='Download List to CSV File'></a>" + graphIcon);
				$(".esri-icon-line-chart").click(opengraphDia);
				$(".esri-icon-download").click( data, downloadList);
			} ).then(function() {
				$('.striped-tbl').find('tr').click(function() {
					$(this).closest("tr").siblings().removeClass("highlighted");
		    		$(this).toggleClass("highlighted");

					// Get id for that well from the table cell (KGS id numbers are in a hidden third column referenced by index = 2):
					var kgsID =  $(this).find('td:eq(2)').text();
					var evtID =  $(this).find('td:eq(3)').text();

					if (returnType === "Oil and Gas" || returnType === "Class I Injection") {
						findParams.layerIds = [0];
						findParams.searchFields = ["KID"];
				        findParams.searchText = kgsID;
					} else if (returnType === "Salt Water Disposal") {
						findParams.layerIds = [19];
						findParams.searchFields = ["KID"];
				        findParams.searchText = kgsID;
					} else if (returnType === "Earthquakes") {
						findParams.layerIds = [14,15,16,17];
						findParams.searchFields = ["EVENT_ID"];
				        findParams.searchText = evtID;
					} else {
						findParams.layerIds = [8];
						findParams.searchFields = ["INPUT_SEQ_NUMBER"];
				        findParams.searchText = kgsID;
					}

					findTask.execute(findParams).then(function(response) {
						return addPopupTemplate(response.results);
			        } ).then(function(feature) {
						if (feature.length > 0) {
							view.goTo( {
								target: feature[0].geometry,
								zoom: 14
							}, {duration: 500} ).then(function() {
								highlightFeature(feature[0]);
					            openPopup(feature);
							} );
						}
			        } );
				} );
			} );
		} else {
			$("#loader").hide();
		}
	}


	function opengraphDia() {
		$("#graph-type-dia").dialog("open");
	}


	makeGraph = function() {
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
					var graphTitle = "Count / Date";
					var yAxisText = "Count";
					var pointFormatText = "Count: <b>{point.y}</b>";
					var showDecimals = false;
					var graphWhere = comboWhere;
					break;
				case "mag":
					var graphTitle = "Magnitude / Date";
					var graphSubTitle = "(KGS magnitudes are type MC, USGS NEIC magnitudes are type ML)";
					var yAxisText = "Magnitude";
					var pointFormatText = "Magnitude: <b>{point.y}</b>";
					var showDecimals = true;
					var graphWhere = comboWhere;
					break;
				case "cumulative":
					var graphTitle = "Cumulative Total";
					var yAxisText = "Total";
					var pointFormatText = "Total: <b>{point.y}</b>";
					var showDecimals = true;
					var graphWhere = comboWhere;
					break;
				case "injvol":
					// graphWhere is some kind of attribute where on wells
					break;
				case "joint":
					// have to create some kind of custom where here?
					break;
			}

			if ( $("#chart").highcharts() ) {
				$("#chart").highcharts().destroy();
				$("#chart-x, #chart").hide();
			}
			$("#chart").show();

			var packet = { "type": graphType, "where": graphWhere, "includelayers": graphLayers };

			$.post("createChartData.cfm", packet, function(response) {
				var data = JSON.parse(response);

			    $('#chart').highcharts( {
			        chart: {
			            type: 'scatter',
						borderColor: '#A9A9A9',
	            		borderWidth: 3,
						borderRadius: 8,
						zoomType: 'xy'
			        },
					title: {
						text: graphTitle
					},
					subtitle: {
						text: graphSubTitle
					},
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
						startOnTick: true
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
			$("#chart-x").show();
		}
	}


	downloadList = function(evt) {
		$("#loader").show();
		$.post( "downloadPoints.cfm", data, function(response) {
			$(".download-link").html(response);
			$("#loader").hide();
		} );
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
                style: "x",
                size: 22,
                outline: new SimpleLineSymbol( {
                  color: [255, 0, 0],
                  width: 4
                } )
            } );

            var pointGraphic = new Graphic( {
                geometry: wmPt,
                symbol: ptSymbol
            } );

			view.goTo( {
				target: wmPt,
				zoom: 16
			}, {duration: 750} ).then(function() {
	            graphicsLayer.add(pointGraphic);
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


	// originalLocation = function() {
	// 	urlZoom(urlParams);
	// }


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
		content += "<tr><td></td><td><label><input type='checkbox' class='dwnld-type' id='chk-dwn-wells' value='wells'> Wells</label></td></tr>";
		content += "<tr><td></td><td><button class='find-button' onclick='dataDownload()'> Download</button></td></tr></table>";
		content += "<div class='download-link' id='wells-link'></div>";
		content += '</div>';	// end download div.

		content += '<div class="data-header esri-icon-right-triangle-arrow" id="grph"><span class="find-hdr-txt"> Time Graphs</span></div>';
		content += '<div class="data-body hide" id="data-grph">';
		content += "<table><tr><td></td><td><label><input type='radio' name='graph-type' value='mag' checked> Magnitude</label></td></tr>";
		content += "<tr><td></td><td><label><input type='radio' name='graph-type' value='count'> Count</label></td></tr>";
		content += "<tr><td></td><td><label><input type='radio' name='graph-type' value='cumulative'> Cumulative</label></td></tr>";
		content += "<tr><td></td><td><label><input type='radio' name='graph-type' value='injvol'> Injection Volume</label></td></tr>";
		content += "<tr><td></td><td><label><input type='radio' name='graph-type' value='joint'> Joint Plot</label></td></tr>";
		content += "<tr><td></td><td><button class='find-button' onclick='makeGraph()'>Create Graph</button></td></tr></table>";
		content += '</div>';	// end graph div.

		// content += '<div class="data-header esri-icon-right-triangle-arrow" id="list"><span class="find-hdr-txt"> List</span></div>';
		// content += '<div class="data-body hide" id="data-list">';
		// content += "FooBar";
		// content += '</div>';	// end list div.

        content += '</div>';	// end data panel div.

        menuObj = {
            label: '<div class="esri-icon-table"></div><div class="icon-text">Data</div>',
            content: content
        };
        drawerMenus.push(menuObj);

        // Find panel:
        content = '';
        content += '<div class="panel-container">';
        content += '<div class="panel-header">Find</div>';
        content += '<div class="panel-padding">';

		// api:
        content += '<div class="find-header esri-icon-right-triangle-arrow" id="api"><span class="find-hdr-txt"> Well API</span></div>';
        content += '<div class="find-body hide" id="find-api">';
        content += 'API Number (extension optional):<br>';
        content += '<input type="text" id="api_state" size="2" onKeyUp="jumpFocus(api_county, 2, this.id)"/>-';
        content += '<input type="text" id="api_county" size="3" onKeyUp="jumpFocus(api_number, 3, this.id)"/>-';
        content += '<input type="text" id="api_number" size="5" onKeyUp="jumpFocus(api_extension, 5, this.id)"/>-';
        content += '<input type="text" id="api_extension" size="4"/>';
        content += '<button class=find-button onclick=findIt("api")>Find</button>';
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
            label: '<div class="icon-zoom-in"></div><div class="icon-text">Find</div>',
            content: content
        };
        drawerMenus.push(menuObj);

		// Legend panel:
        content = '';
        content += '<div class="panel-container">';
        content += '<div class="panel-header">Legend</div>';
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
    }


	dataDownload = function() {
		// Which download options are checked:
		var downloadOptions = [];
		if ( $("#chk-dwn-evts").is(":checked") ) {
			downloadOptions.push("events");
		}
		if ( $("#chk-dwn-wells").is(":checked") ) {
			downloadOptions.push("wells");
		}
		var downloadOptions = downloadOptions.join(",");

		var packet = { "what": downloadOptions, "evtwhere": comboWhere, "wellwhere": wellsComboWhere };

		$("#loader").show();
		$.post( "downloadPoints.cfm", packet, function(response) {
			$("#wells-link").html(response);
			$("#loader").hide();
		} );
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
		dbCon += "<div id='db-ctrls'><span class='esri-icon-close' id='close-db'></span><span class='esri-icon-refresh' id='reset-db' title='Reset defaults'></span><button id='update-btn' class='find-button' onclick='updateMap()'>Update Map</button><span class='esri-icon-checkbox-checked hide' id='deselect-icon' title='Deselect feature'></span><span class='esri-icon-erase hide' id='erase-graphics' title='Erase graphics'></span></div>";

		// Location:
		dbCon += "<div class='db-sub-div'><span class='sub-div-hdr' id='location'>Location</span><span class='note'> (events and wells)</span>";
		dbCon += "<table class='db-sub-table' id='location-body'>";
		dbCon += "<tr><td><input type='radio' name='loc-type' value='state' checked></td><td>Statewide</td></tr>";
		dbCon += "<tr><td class='sel-rad'><input type='radio' name='loc-type' value='buf' onclick='checkLocRadio()'></td><td> Within <input type='text' class='txt-input' id='loc-buff' value='6' oninput='checkLocRadio()'> mi of selected feature</td></tr>";
		dbCon += "<tr><td class='sel-rad'><input type='radio' name='loc-type' value='co'></td><td> <select class='loc-select' id='lstCounty2' multiple>";
		for (var k = 0; k < cntyArr.length; k++) {
		 	dbCon += "<option value='" + cntyArr[k] + "'>" + cntyArr[k] + "</option>";
		}
		dbCon += "</select></td></tr>";
		dbCon += "<tr><td class='sel-rad'><input type='radio' name='loc-type' value='sca' ></td><td> <select class='loc-select' id='sca' multiple>";
		for (var j = 0; j < seismicAreas.length; j++) {
		 	dbCon += "<option value='" + seismicAreas[j] + "'>" + seismicAreas[j] + "</option>";
		}
		dbCon += "</select></td></tr>";
		dbCon += "</table></div>";
		dbCon += "<div class='vertical-line'></div>";

		// Time:
		dbCon += "<div class='db-sub-div'><span class='sub-div-hdr' id='time'>Origin Time</span>";
		dbCon += "<table class='db-sub-table' id='time-body'>";
		dbCon += "<tr><td><input type='radio' name='time-type' value='week' checked></td><td> Past 7 days</td></tr>";
		dbCon += "<tr><td><input type='radio' name='time-type' value='month'></td><td> Past 30 days</td></tr>";
		dbCon += "<tr><td><input type='radio' name='time-type' value='year'></td><td> This year</td></tr>";
		dbCon += "<tr><td><input type='radio' name='time-type' value='date'></td><td> <input type='text' size='10' id='from-date' onchange='checkTimeRadio()' placeholder='mm/dd/yyyy'> to <input type='text' size='10' id='to-date' onchange='checkTimeRadio()' placeholder='mm/dd/yyyy'></td></tr>";
		dbCon += "</table></div>";
		dbCon += "<div class='vertical-line'></div>";

		// Mag-SAS:
		dbCon += "<div class='db-sub-div'><span class='sub-div-hdr' id='magsas'>Magnitude/SAS</span>";
		dbCon += "<table class='db-sub-table' id='magsas-body'>";
		dbCon += "<tr><td><input type='radio' name='mag-type' value='all' checked></td><td> All</td></tr>";
		dbCon += "<tr><td><input type='radio' name='mag-type' value='magrange'></td><td> M <input type='text'  class='txt-input' id='low-mag' oninput='checkMagRadio()'> to <input type='text'  class='txt-input' id='high-mag' oninput='checkMagRadio()'></td></tr>";
		dbCon += "<tr><td><input type='radio' name='mag-type' value='gt3517' ></td><td> M &ge; 3.5 or SAS &ge; 17</td></tr>";
		dbCon += "</table></div>";
		dbCon += "<div class='vertical-line'></div>";

		// Wells:
		dbCon += "<div class='db-sub-div'><span class='sub-div-hdr' id='wells'>Wells</span>";
		dbCon += "<table class='db-sub-table' id='wells-body'>";
		dbCon += "<tr><td><input type='radio' name='well-type' value='all' checked></td><td> All</td></tr>";
		dbCon += "<tr><td><input type='radio' name='well-type' value='bbls'></td><td>BBLS/day &ge; <input type='text' size='4' id='bbls' value='5000' oninput='checkWellRadio(&quot;bbls&quot;)'></td></tr>";
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

		$("#deselect-icon").click(function() {
			$(".esri-icon-checkbox-checked").hide();
			graphicsLayer.remove(hilite);
			view.popup.clear();
			view.popup.visible = false;
		} );

		$("#erase-graphics").click(function() {
			graphicsLayer.remove(bufferGraphic);
			$(".esri-icon-erase").hide();
	    } );

		$("#lstCounty2").multiselect( {
			showCheckbox: false,
		    texts: {
		        placeholder: "Counties"
		    },
			onOptionClick: function(e) {
				$('[name=loc-type][value="co"]').prop('checked',true);
			}
		} );
		$("#sca").multiselect( {
			// selectAll: true,
			showCheckbox: false,
		    texts: {
		        placeholder: "Seismic Concern Areas"
		    },
			onOptionClick: function(e) {
				$('[name=loc-type][value="sca"]').prop('checked',true);
			}
		} );
	}


    function createTOC() {
        var lyrs = map.layers;
        var chkd, tocContent = "";
		var eqTocContent = "";
		var wellsTocContent = "";
		var boundariesTocContent = "";
		var basemapTocContent = "";
		var otherEqContent = '<div class="toc-sub-item esri-icon-right-triangle-arrow group-hdr" id="other-group"><span class="find-hdr-txt">&nbsp;&nbsp;Other</span></div>';
		otherEqContent += '<div class="find-body hide" id="other-group-body">';

        // var transparentLayers = ["Oil and Gas Fields","Topography","Aerial Imagery","2002 Aerials","1991 Aerials"];
		var earthquakeGroup = ["KGS-Cataloged-Events","KGS-Preliminary-Events"];
		var otherEarthquakeGroup = ["NEIC-Cataloged-Events","Historic-Events"];
		var wellsGroup = ["Salt-Water-Disposal-Wells"];
		var boundariesGroup = ["2015-Areas-of-Seismic-Concern","2016-Specified-Area","Section-Township-Range","Counties"];
		var basemapGroup = ["Topo","Aerial-Imagery"];

		tocContent += '<div class="find-header esri-icon-right-triangle-arrow group-hdr" id="eq-group"><span class="find-hdr-txt"> Earthquakes</span></div>';
		tocContent += '<div class="find-body hide" id="eq-group-body"></div>';

		tocContent += '<div class="find-header esri-icon-right-triangle-arrow group-hdr" id="wells-group"><span class="find-hdr-txt"> Wells</span></div>';
		tocContent += '<div class="find-body hide" id="wells-group-body"></div>';

		tocContent += '<div class="find-header esri-icon-right-triangle-arrow group-hdr" id="boundaries-group"><span class="find-hdr-txt"> Boundaries</span></div>';
		tocContent += '<div class="find-body hide" id="boundaries-group-body"></div>';

		tocContent += '<div class="find-header esri-icon-right-triangle-arrow group-hdr" id="basemap-group"><span class="find-hdr-txt"> Base Map</span></div>';
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
				boundariesTocContent += "<div class='toc-sub-item' id='" + htmlID + "'><label><input type='checkbox' id='tcb-" + j + "' onclick='toggleLayer(" + j + ");'" + chkd + ">" + layerID + "</label></div>";
			}

			if (basemapGroup.indexOf(htmlID) > -1) {
				basemapTocContent += "<div class='toc-sub-item' id='" + htmlID + "'><label><input type='radio' name='bm' value='" + layerID + "' onclick='toggleBasemapLayer();'" + chkd + "> " + layerID + "</label></div>";
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
    }


    changeOpacity = function(id, dir) {
        var lyr = map.findLayerById(id);
        var incr = (dir === "down") ? -0.2 : 0.2;
        lyr.opacity = lyr.opacity + incr;
    }


    function executeIdTask(event) {
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
				case "Salt Water Disposal Wells":
					idLayers.push(19);
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

				// Highlight row in wells list table:
				// var fAtts = feature[0].attributes;
				// if (fAtts.hasOwnProperty('INPUT_SEQ_NUMBER')) {
				// 	var ptID = fAtts.INPUT_SEQ_NUMBER;
				// } else if (fAtts.hasOwnProperty('KID')) {
				// 	var ptID = fAtts.KID;
				// } else if (fAtts.hasOwnProperty('EVENT_ID')) {
				// 	var ptID = fAtts.EVENT_ID;
				// }
				// $(".well-list-tbl tr").removeClass("highlighted");
				// $(".well-list-tbl tr:contains(" + ptID + ")").toggleClass("highlighted");

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

			if (layerName === 'OG_WELLS' || layerName === 'Class I Wells' || layerName === 'Salt Water Disposal Wells') {
				var ogWellsTemplate = new PopupTemplate( {
					title: "<span class='pu-title'>Well: {WELL_LABEL} </span><span class='pu-note'>{API_NUMBER}</span>",
					content: wellContent(feature)
				} );
				feature.popupTemplate = ogWellsTemplate;
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
		var m = f.MC !== "Null" ? f.MC + " mc" : "";
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
		content += "<tr><td>Origin Time (CST): </td><td>{ORIGIN_TIME_CST}</td></tr>";
		content += "<tr><td>Origin Time Error: </td><td>" + ote + "</td></tr>";
		content += "<tr><td>Latitude: </td><td>" + lat + "&deg;</td></tr>";
        content += "<tr><td>Longitude: </td><td>" + lon + "&deg;</td></tr>";
		content += "<tr><td>Horizontal Uncertainty: </td><td>" + hu + "</td></tr>";
		content += "<tr><td>Depth: </td><td>" + dep + "</td></tr>";
		content += "<tr><td>Vertical Uncertainty: </td><td>" + de + "</td></tr>";
        content += "<tr><td>Magnitude: </td><td>" + m + "</td></tr>";
		content += "<tr><td>Seismic Action Score: </td><td>" + sas + "</td></tr>";
		content += "<tr><td>County: </td><td>" + co + "</td></tr>";
        content += "<span id='event-id' class='hide'>{EVENT_ID}</span></table>";

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

        var content = "<table id='popup-tbl'><tr><td>API:</td><td>{API_NUMBER}</td></tr>";
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
        content += "<tr><td>Producing Formation:</td><td>{PRODUCING_FORMATION}</td></tr>";
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
				basemapLayer.visible = true;
				latestAerialsLayer.visible = false;
				break;
			case "Aerial Imagery":
				basemapLayer.visible = false;
				latestAerialsLayer.visible = true;
				break;
			case "none":
				basemapLayer.visible = false;
				latestAerialsLayer.visible = false;
				break;
		}
	}

} );
