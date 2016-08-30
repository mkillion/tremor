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
	Query
) {
    var isMobile = WURFL.is_mobile;
	var idDef = [];
	var wmSR = new SpatialReference(3857);
	var urlParams, hilite, bufferGraphic;
	var listCount = 0;
	var sharedCfTable;


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

	// $.get("operators_json.txt", function(response) {
	// 	// operators_json.txt is updated as part of the monthly maintenance tasks.
    //     var ops = JSON.parse(response).items;
    //     var opsStore = new Memory( {data: ops} );
    //     var comboBox = new ComboBox( {
    //         id: "operators",
    //         store: opsStore,
    //         searchAttr: "name",
    //         autoComplete: autocomplete
    //     }, "operators").startup();
    // } );

    // End framework.

    // Create map and map widgets:
    var tremorGeneralServiceURL = "http://services.kgs.ku.edu/arcgis1/rest/services/tremor/tremor_general/MapServer";
    var identifyTask, identifyParams;
    var findTask = new FindTask(tremorGeneralServiceURL);
    var findParams = new FindParameters();
	findParams.returnGeometry = true;

    var basemapLayer = new TileLayer( {url:"http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer", id:"Base Map"} );
    // var fieldsLayer = new TileLayer( {url:"http://services.kgs.ku.edu/arcgis8/rest/services/oilgas/oilgas_fields/MapServer", id:"Oil and Gas Fields", visible:false} );
    var wellsLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:0}], id:"Oil and Gas Wells",  visible:false} );
    var plssLayer = new TileLayer( {url:"http://services.kgs.ku.edu/arcgis8/rest/services/plss/plss/MapServer", id:"Section-Township-Range"} );
    // var wwc5Layer = new MapImageLayer( {url:"http://services.kgs.ku.edu/arcgis8/rest/services/wwc5/wwc5_general/MapServer", sublayers:[{id:8}], id:"WWC5 Water Wells", visible:false} );
    // var usgsEventsLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:13}], id:"Earthquakes", visible:false} );
    // var lepcLayer = new MapImageLayer( {url:"http://kars.ku.edu/arcgis/rest/services/Sgpchat2013/SouthernGreatPlainsCrucialHabitatAssessmentTool2LEPCCrucialHabitat/MapServer", id:"LEPC Crucial Habitat", visible: false} );
    // var topoLayer = new ImageryLayer( {url:"http://services.kgs.ku.edu/arcgis7/rest/services/USGS_Topo/USGStopo_DRG/ImageServer", id:"Topography", visible:false} );
	var naip2014Layer = new ImageryLayer( {url:"http://services.kgs.ku.edu/arcgis7/rest/services/IMAGERY_STATEWIDE/FSA_NAIP_2014_Color/ImageServer", id:"2014 Aerials", visible:false} );
    // var doqq2002Layer = new ImageryLayer( {url:"http://services.kgs.ku.edu/arcgis7/rest/services/IMAGERY_STATEWIDE/Kansas_DOQQ_2002/ImageServer", id:"2002 Aerials", visible:false} );
    // var doqq1991Layer = new ImageryLayer( {url:"http://services.kgs.ku.edu/arcgis7/rest/services/IMAGERY_STATEWIDE/Kansas_DOQQ_1991/ImageServer", id:"1991 Aerials", visible:false} );
	var kgsCatalogedLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:14}], id:"KGS Cataloged Events", visible:false} );
	var kgsPrelimLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:15}], id:"KGS Preliminary Events", visible:false} );
	var neicLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:16}], id:"NEIC Cataloged Events", visible:false} );
	var ogsLayer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:17}], id:"OGS Cataloged Events", visible:false} );
	var seismicConcernLayer = new MapImageLayer( {url:"http://services.kgs.ku.edu/arcgis1/rest/services/tremor/seismic_areas/MapServer", sublayers:[{id:0}], id:"Areas of Seismic Concern", visible:false} );
	var seismicConcernExpandedLayer = new MapImageLayer( {url:"http://services.kgs.ku.edu/arcgis1/rest/services/tremor/seismic_areas/MapServer", sublayers:[{id:1}], id:"Expanded Area of Seismic Concern", visible:false} );
	var class1Layer = new MapImageLayer( {url:tremorGeneralServiceURL, sublayers:[{id:18}], id:"Class I Injection Wells", visible:false} );

    var map = new Map( {
		layers: [basemapLayer, naip2014Layer, plssLayer, wellsLayer, class1Layer, ogsLayer, neicLayer, kgsPrelimLayer, kgsCatalogedLayer, seismicConcernExpandedLayer, seismicConcernLayer]
    } );

    var graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    var view = new MapView( {
        map: map,
        container: "mapDiv",
        center: [-98, 38],
        zoom: 7,
        ui: { components: ["zoom"] },
		constraints: { rotationEnabled: false }
    } );

    view.then(function() {
		createTOC();
		createDialogs();
		popCountyDropdown();

        on(view, "click", executeIdTask);

        identifyTask = new IdentifyTask(tremorGeneralServiceURL);
        identifyParams = new IdentifyParameters();
		identifyParams.returnGeometry = true;
        identifyParams.tolerance = (isMobile) ? 9 : 3;
        identifyParams.layerIds = [0, 14, 15, 16, 17, 18];
        identifyParams.layerOption = "visible";
        identifyParams.width = view.width;
        identifyParams.height = view.height;

        // Define additional popup actions:
        var fullInfoAction = {
            title: "Full Report",
            id: "full-report",
            className: "esri-icon-documentation pu-icon"
        };
        view.popup.actions.push(fullInfoAction);

        var bufferFeatureAction = {
            title: "Filter Features",
            id: "filter-buffer-feature",
            className: "esri-icon-filter pu-icon"
        };
        view.popup.actions.push(bufferFeatureAction);

        // var reportErrorAction = {
        //     title: "Report a Location or Data Problem",
        //     id: "report-error",
        //     className: "esri-icon-contact pu-icon"
        // };
        // view.popup.actions.push(reportErrorAction);

        view.popup.on("trigger-action", function(evt) {
            if(evt.action.id === "full-report") {
                showFullInfo();
            } else if (evt.action.id === "filter-buffer-feature") {
				$("#filter-buff-dia").dialog("open");
            } else if (evt.action.id === "report-error") {
                $("#prob-dia").dialog("open");
            }
        } );
    } );

	var searchWidget = new Search({
		view: view,
		popupEnabled: false
	}, "srch" );

    /*$("#mobileGeocoderIconContainer").click(function() {
        $("#lb").toggleClass("small-search");
    } );*/

	var homeBtn = new Home({
        view: view
	} );
    homeBtn.startup();
	view.ui.add(homeBtn, {
    	position: "top-left",
        index: 1
     } );

	var locateBtn = new Locate( {
        view: view
	}, "LocateButton" );
    locateBtn.startup();
	view.ui.add(locateBtn, {
    	position: "top-left",
        index: 2
     } );

    // End map and map widgets.

	urlParams = location.search.substr(1);
    urlZoom(urlParams);

    // Miscellaneous click handlers:
    $(".find-header").click(function() {
        $("[id^=find]").fadeOut("fast");
        $(".find-header").removeClass("esri-icon-down-arrow");
        $(this).addClass("esri-icon-down-arrow");
        var findBody = $(this).attr("id");
        $("#find-"+findBody).fadeIn("fast");
    } );

    $(".esri-icon-erase").click(function() {
		graphicsLayer.removeAll();
		clearFilter();
    } );

	$(".esri-icon-filter").click(function() {
		$("#filter-buff-dia").dialog("open");
	} );

	$("#buff-opts-btn").click(function() {
		$("#buff-opts").toggleClass("show");
	} );

	$("#chart-x").click(function() {
		$("#chart").highcharts().destroy();
		$("#chart-x").hide();
	} );


    function popCountyDropdown() {
        var cntyArr = new Array("Allen", "Anderson", "Atchison", "Barber", "Barton", "Bourbon", "Brown", "Butler", "Chase", "Chautauqua", "Cherokee", "Cheyenne", "Clark", "Clay", "Cloud", "Coffey", "Comanche", "Cowley", "Crawford", "Decatur", "Dickinson", "Doniphan", "Douglas", "Edwards", "Elk", "Ellis", "Ellsworth", "Finney", "Ford", "Franklin", "Geary", "Gove", "Graham", "Grant", "Gray", "Greeley", "Greenwood", "Hamilton", "Harper", "Harvey", "Haskell", "Hodgeman", "Jackson", "Jefferson", "Jewell", "Johnson", "Kearny", "Kingman", "Kiowa", "Labette", "Lane", "Leavenworth", "Lincoln", "Linn", "Logan", "Lyon", "McPherson", "Marion", "Marshall", "Meade", "Miami", "Mitchell", "Montgomery", "Morris", "Morton", "Nemaha", "Neosho", "Ness", "Norton", "Osage", "Osborne", "Ottawa", "Pawnee", "Phillips", "Pottawatomie", "Pratt", "Rawlins", "Reno", "Republic", "Rice", "Riley", "Rooks", "Rush", "Russell", "Saline", "Scott", "Sedgwick", "Seward", "Shawnee", "Sheridan", "Sherman", "Smith", "Stafford", "Stanton", "Stevens", "Sumner", "Thomas", "Trego", "Wabaunsee", "Wallace", "Washington", "Wichita", "Wilson", "Woodson", "Wyandotte");
		$('#evt-county').html('<option value="all">All</option>');
        for(var i=0; i<cntyArr.length; i++) {
            theCnty = cntyArr[i];
            $('#lstCounty').append('<option value="' + theCnty + '">' + theCnty + '</option>');
			$('#lstCounty2').append('<option value="' + theCnty + '">' + theCnty + '</option>');
			$('#evt-county').append('<option value="' + theCnty + '">' + theCnty + '</option>');
        }
    }


    function createDialogs() {
        // OG wells filter:
		var wellType = ["Coal Bed Methane","Coal Bed Methane, Plugged","Dry and Abandoned","Enhanced Oil Recovery","Enhanced Oil Recovery, Plugged","Gas","Gas, Plugged","Injection","Injection, Plugged","Intent","Location","Oil","Oil and Gas","Oil and Gas, Plugged","Oil, Plugged","Other","Other, Plugged","Salt Water Disposal","Salt Water Disposal, Plugged"];
		var ogF = "<span class='filter-hdr'>Well Type:</span><br>";
		ogF += "<table><tr><td><select id='og-well-type' class='og-select' multiple size='4'>";
		if (!isMobile) {
			ogF += "<option value='' class='opt-note'>select one or many (ctrl or cmd)</option>";
		}
		for (var j = 0; j < wellType.length; j++) {
			ogF += "<option value='" + wellType[j] + "'>" + wellType[j] + "</option>";
		}
		ogF += "</select></td></tr></table>";
		ogF += "<span class='filter-hdr'>Completion Date:</span><br>";
		ogF += "<table><tr><td class='find-label'>From:</td><td><input type='text' size='12' id='og-from-date' class='og-input' placeholder='mm/dd/yyyy'></td></tr>";
        ogF += "<tr><td class='find-label'>To:</td><td><input type='text' size='12' id='og-to-date' class='og-input' placeholder='mm/dd/yyyy'></td></tr></table>";
		ogF += "<table><tr><td class='filter-hdr' style='padding-left:0'>Operator:</td><td><input id='operators'></td></tr></table>";
		ogF += "<table><tr><td class='filter-hdr' style='padding-left:0'>Has:</td><td><input type='checkbox' name='og-has' value='paper-log'>Paper Logs</td></tr>";
		ogF += "<tr><td></td><td><input type='checkbox' name='og-has' value='scan-log'>Scanned Logs</td></tr>";
		ogF += "<tr><td></td><td><input type='checkbox' name='og-has' value='las'>LAS File</td></tr>";
		ogF += "<tr><td></td><td><input type='checkbox' name='og-has' value='core'>Core</td></tr>";
		ogF += "<tr><td></td><td><input type='checkbox' name='og-has' value='cuttings'>Cuttings</td></tr></table>";
		ogF += "<table><tr><td class='filter-hdr' style='padding-left:0'>Injection Wells:</td>";
		ogF += "<td><select id='inj' class='og-select'><option value=''></option><option value='inj-1'>Class I</option><option value='inj-2'>Class II</option></select></td></tr>";
		ogF += "<tr><td class='filter-hdr'style='padding-left:0'>Horizontal Wells:</td><td><input type='checkbox' id='hrz'></td></tr></table>";
		ogF += "<span class='filter-hdr'>Total Depth (ft):</span><br>";
		ogF += "<table><tr><td>Greater Than or Equal:</td><td><input type='text' size='4' id='og-gt-depth' class='og-input'></td></tr>";
        ogF += "<tr><td>Less Than or Equal:</td><td><input type='text' size='4' id='og-lt-depth' class='og-input'></td></tr></table>";
		ogF += "<hr><button class='find-button' id='wwc5-go-btn' onclick='filterOG();'>Apply Filter</button>&nbsp;&nbsp;&nbsp;";
		ogF += "<button class='find-button' onclick='clearOgFilter();' autofocus>Clear Filter</button>";

		var ogN = domConstruct.create("div", { id: "og-filter", class: "filter-dialog", innerHTML: ogF } );
        $("body").append(ogN);

        $("#og-filter").dialog( {
            autoOpen: false,
            dialogClass: "dialog",
			title: "Filter Oil and Gas Wells",
            width: 320
        } );

		//$("#og-from-date").datepicker();
        //$("#og-to-date").datepicker();

		// Buffer dialog:
		var units = ["miles","kilometers","meters","yards","feet"];
		var seismicAreas = ["Anthony","Freeport","Bluff City","Milan","Caldwell","Expanded Area"];


		var buffDia = '<table><tr><td style="font-weight:bold;">Find These Features:</td></tr>';
		buffDia += '<tr><td><input type="radio" name="return-type" value="Class I Injection" onchange="resetEvtChk()"> Class I Injection Wells</td></tr>';
		buffDia += '<tr><td><input type="radio" name="return-type" value="Oil and Gas" onchange="resetEvtChk();checkOgState();"> Oil and Gas Wells</td></tr>';
		buffDia += '<tr><td><input type="radio" name="return-type" value="Earthquakes"> Earthquakes</td></tr>';
		buffDia += '<tr><td><input type="checkbox" class="evt-chk" name="evt-lay" value="14" onchange="changeEvtChk()">KGS Cataloged</td></tr>';
		buffDia += '<tr><td><input type="checkbox" class="evt-chk" name="evt-lay" value="15" onchange="changeEvtChk()">KGS Preliminary</td></tr>';
		buffDia += '<tr><td><input type="checkbox" class="evt-chk" name="evt-lay" value="16" onchange="changeEvtChk()">NEIC Cataloged</td></tr>';
		buffDia += '<tr><td><input type="checkbox" class="evt-chk" name="evt-lay" value="17" onchange="changeEvtChk()">OGS Cataloged</td></tr>';
		buffDia += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Mag. >=&nbsp;<input class="eqf" type="text" size="8" id="low-mag" oninput="changeEvtChk()"></td></tr>';
		buffDia += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Mag. <=&nbsp;<input class="eqf" type="text" size="8" id="high-mag" oninput="changeEvtChk()"></td></tr>';
		buffDia += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Date >=&nbsp;<input class="eqf" type="text" size="12" id="eq-from-date" onchange="changeEvtChk()" placeholder="mm/dd/yyyy"></td></tr>';
		buffDia += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Date <=&nbsp;<input class="eqf" type="text" size="12" id="eq-to-date" onchange="changeEvtChk()" placeholder="mm/dd/yyyy"></td></tr>';
		buffDia += '</table>';

		buffDia += '<table><tr><td colspan="2" style="font-weight:bold;">Within This Area:</td><td></td></tr>';
		buffDia += '<tr><td><input type="radio" name="area-type" value="state" onchange="checkOgState()"> Statewide</td></tr>';
		buffDia += '<tr><td><input type="radio" name="area-type" value="co"> County:</td></tr>';
		buffDia += '<tr><td style="text-align:right"><select id="lstCounty2" onchange="changeSelect(&quot;co&quot;)"></select></td></tr>';
		buffDia += '<tr><td><input type="radio" name="area-type" value="sca"> Seismic Concern Area:</td></tr>';
		buffDia += '<tr><td style="text-align:right"><select id="sca" onchange="changeSelect(&quot;sca&quot;)">';
		for (var j = 0; j < seismicAreas.length; j++) {
			buffDia += "<option value='" + seismicAreas[j] + "'>" + seismicAreas[j] + "</option>";
		}
		buffDia += '</select></td></tr>';
		buffDia += '<tr><td><input type="radio" name="area-type" value="buff" onchange="changeSelect(&quot;buff&quot;)"> Buffer Around Feature:</td></tr>';
		buffDia += '<tr><td style="text-align:right">Distance:&nbsp;<input type="text" size="4" id="buff-dist" oninput="changeSelect(&quot;buff&quot;)"></td></tr>';
		buffDia += '<tr><td style="text-align:right">Units:&nbsp;<select id="buff-units" onchange="changeSelect(&quot;buff&quot;)">';
		for (var i = 0; i < units.length; i++) {
			buffDia += "<option value='" + units[i] + "'>" + units[i] + "</option>";
		}
		buffDia += '</select></td></tr></table>';

		buffDia += '<hr>';
		buffDia += '<table><tr><td><button class="find-button" onclick="filterSwitch()">Apply</button></td>';
		buffDia += '<td><button class="find-button" onclick="clearFilter()" autofocus>Clear</button></td></tr></table>'

		var buffN = domConstruct.create("div", { id: "filter-buff-dia", class: "filter-dialog", innerHTML: buffDia } );
        $("body").append(buffN);

        $("#filter-buff-dia").dialog( {
            autoOpen: false,
            dialogClass: "dialog",
			title: "Filter/Select Features"
        } );

		$("#eq-from-date").datepicker();
        $("#eq-to-date").datepicker();

		// Report problem dialog:
		var probDia = "<table><tr><td class='find-label'>Message:</td><td><textarea rows='4' cols='25' id='prob-msg' placeholder='Feature ID is automatically appended. Messages are anonymous unless contact info is included.'></textarea></td></tr>";
		probDia += "<tr><td></td><td><button class='find-button' onclick='sendProblem()'>Send</button></td></tr>";
		probDia += "<tr><td colspan='2'><span class='toc-note'>(report website problems <a href='mailto:killion@kgs.ku.edu'>here)</a></span></td></tr></table>";

		var problemN = domConstruct.create("div", { id: "prob-dia", class: "filter-dialog", innerHTML: probDia } );
        $("body").append(problemN);

        $("#prob-dia").dialog( {
            autoOpen: false,
            dialogClass: "dialog",
			title: "Report a location or data error",
			width: 375
        } );
    }


	checkOgState = function() {
		if ( $("[name=area-type]").filter("[value='state']").prop("checked") && $("[name=return-type]").filter("[value='Oil and Gas']").prop("checked") ) {
			alert("Oil wells cannot be selected statewide. Please select a smaller area.");
			$("[name=area-type]").filter("[value='state']").prop("checked", false);
		}
	}


	changeSelect = function(what) {
		$("[name=area-type]").prop("checked", false);
		$("[name=area-type]").filter("[value='" + what + "']").prop("checked", true);
		if (what === "buff" && !view.popup.selectedFeature) {
			alert("Please select a feature to buffer.")
		}
	}


	clearFilter = function() {
		// Reset inputs:
		$("[name=area-type]").prop("checked", false);
		$("[name=return-type]").prop("checked", false);
		$("[name=evt-lay]").prop("checked", false);
		$(".eqf").val("");
		$("#buff-dist").val("");
		$("#lstCounty2,#sca,#buff-units").prop("selectedIndex", 0);

		// Clear layer definitionExpressions:
		wellsLayer.sublayers[0].definitionExpression = "";
		kgsCatalogedLayer.sublayers[14].definitionExpression = "";
		kgsPrelimLayer.sublayers[15].definitionExpression = "";
		neicLayer.sublayers[16].definitionExpression = "";
		ogsLayer.sublayers[17].definitionExpression = "";
		class1Layer.sublayers[18].definitionExpression = "";

		// Clear ID layer definition:
		idDef[0] = "";
		idDef[14] = "";
		idDef[15] = "";
		idDef[16] = "";
		idDef[17] = "";
		idDef[18] = "";
	}


	changeEvtChk = function() {
		$("[name=return-type]").prop("checked", false);
		$("[name=return-type]").filter("[value='Earthquakes']").prop("checked", true);
	}


	resetEvtChk = function() {
		$(".evt-chk").prop("checked", false);
		$(".eqf").val("");
	}


	sendProblem = function() {
		var sfa = view.popup.selectedFeature.attributes;
		if (sfa.hasOwnProperty('INPUT_SEQ_NUMBER')) {
			var fId = sfa.INPUT_SEQ_NUMBER;
			var fName = sfa.OWNER_NAME;
			var fType = "wwc5";
			var otherId = "";
		} else if (sfa.hasOwnProperty('API_NUMBER')) {
			var fId = sfa.KID;
			var fName = sfa.LEASE_NAME + " " + sfa.WELL_NAME;
			var fType = "ogwell";
			var otherId = sfa.API_NUMBER;
		} else if (sfa.hasOwnProperty('MAG')) {
			var fId = sfa.ID;
			var fName = "";
			var fType = "earthquake";
			var otherId = "";
		} else if (sfa.hasOwnProperty('FIELD_KID')) {
			var fId = sfa.FIELD_KID;
			var fName = sfa.FIELD_NAME;
			var fType = "field";
			var otherId = "";
		}

		$.ajax( {
		  type: "post",
		  url: "reportProblem.cfm",
		  data: {
			  "id": fId,
			  "name": fName,
			  "type": fType,
			  "otherId": otherId,
			  "msg": $("#prob-msg").val()
		  }
		} );
		$("#prob-dia").dialog("close");
	}


	filterOG = function() {
		var def = [];
		var theWhere = "";
		var typeWhere = "";
		var dateWhere = "";
		var opWhere = "";
		var injWhere = "";
		var hrzWhere = "";
		var depthWhere = "";
		var paperLogWhere = "";
		var scanLogWhere = "";
		var lasWhere = "";
		var coreWhere = "";
		var cuttingsWhere = "";
		var ogType = $("#og-well-type").val();
		var fromDate = dom.byId("og-from-date").value;
		var toDate = dom.byId("og-to-date").value;
		var op = dom.byId(operators).value;
		var ogHas = $('input[name="og-has"]:checked').map(function() {
		    return this.value;
		} ).get();
		var inj = dom.byId("inj").value;
		var depthGT = dom.byId("og-gt-depth").value;
		var depthLT = dom.byId("og-lt-depth").value;

		if (ogType) {
			var typeList = "'" + ogType.join("','") + "'";
			typeWhere = "status_txt in (" + typeList +")";
		}

		if (fromDate && toDate) {
			dateWhere = "completion_date >= to_date('" + fromDate + "','mm/dd/yyyy') and completion_date < to_date('" + toDate + "','mm/dd/yyyy') + 1";
		} else if (fromDate && !toDate) {
			dateWhere = "completion_date >= to_date('" + fromDate + "','mm/dd/yyyy')";
		} else if (!fromDate && toDate) {
			dateWhere = "completion_date < to_date('" + toDate + "','mm/dd/yyyy') + 1";
		}

		if (op) {
			opWhere = "curr_operator = '" + op + "'";
		}

		if (inj) {
			if (inj === "inj-1") {
				injWhere = "well_type = 'CLASS1'";
			} else {
				injWhere = "status in ('SWD','EOR','INJ')";
			}
		}

		if (dom.byId(hrz).checked) {
			hrzWhere = "substr(api_workovers, 1, 2) <> '00'";
		}

		if (depthGT && depthLT) {
			if (parseInt(depthLT) < parseInt(depthGT)) {
				alert("Invalid depth values: less-than value must be larger than greater-than value.");
			} else {
				depthWhere = "rotary_total_depth >= " + depthGT + " and rotary_total_depth <= " + depthLT;
			}
		} else if (depthGT && !depthLT) {
			depthWhere = "rotary_total_depth >= " + depthGT;
		} else if (!depthGT && depthLT) {
			depthWhere = "rotary_total_depth <= " + depthLT;
		}

		for (var y=0; y<ogHas.length; y++) {
			switch (ogHas[y]) {
				case "paper-log":
					paperLogWhere = "kid in (select well_header_kid from elog.log_headers)";
					break;
				case "scan-log":
					scanLogWhere = "kid in (select well_header_kid from elog.scan_urls)";
					break;
				case "las":
					lasWhere = "kid in (select well_header_kid from las.well_headers where proprietary = 0)";
					break;
				case "core":
					coreWhere = "kid in (select well_header_kid from core.core_headers)";
					break;
				case "cuttings":
					cuttingsWhere = "kid in (select well_header_kid from cuttings.boxes)";
					break;
			}
		}

		if (typeWhere !== "") {
			theWhere += typeWhere + " and ";
		}
		if (dateWhere !== "") {
			theWhere += dateWhere + " and ";
		}
		if (opWhere !== "") {
			theWhere += opWhere + " and ";
		}
		if (injWhere !== "") {
			theWhere += injWhere + " and ";
		}
		if (hrzWhere !== "") {
			theWhere += hrzWhere + " and ";
		}
		if (depthWhere !== "") {
			theWhere += depthWhere + " and ";
		}
		if (paperLogWhere !== "") {
			theWhere += paperLogWhere + " and ";
		}
		if (scanLogWhere !== "") {
			theWhere += scanLogWhere + " and ";
		}
		if (lasWhere !== "") {
			theWhere += lasWhere + " and ";
		}
		if (coreWhere !== "") {
			theWhere += coreWhere + " and ";
		}
		if (cuttingsWhere !== "") {
			theWhere += cuttingsWhere + " and ";
		}
		if (theWhere.substr(theWhere.length - 5) === " and ") {
			theWhere = theWhere.slice(0,theWhere.length - 5);
		}

		def[0] = theWhere;
		idDef[0] = def[0];
		wellsLayer.sublayers[0].definitionExpression = def[0];
	}


	clearOgFilter = function() {
		dom.byId("operators").value = "";
		$(".og-input").val("");
		$('input[name="og-has"]').removeAttr("checked");
		$('select.og-select option').removeAttr("selected");
		dom.byId("hrz").checked = false;
		wellsLayer.sublayers[0].definitionExpression = null;
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
			} else {
				theWhere += "county = '" + dom.byId("lstCounty2").value + "'";
				class1Layer.sublayers[18].definitionExpression = "county = '" + dom.byId("lstCounty2").value + "'";
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

		if ( returnType === "Oil and Gas" && areaType === "co") {
			theWhere += "county = '" + dom.byId("lstCounty2").value + "'";

			qt.url = tremorGeneralServiceURL + "/0";
			qry.where = theWhere;

			wellsLayer.sublayers[0].definitionExpression = "county = '" + dom.byId("lstCounty2").value + "'";
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
				alert("Please select at least one earthquake category.");
				return;
			}

			// Create where clause and get objectids:
			theWhere = earthquakeWhereClause(areaType);
			if (theWhere !== "") {
				qry.where = theWhere;
			} else {
				// Dummy clause to select all:
				qry.where = "event_id > 0";
			}

			$.each(lIDs, function(idx, val) {
				qt.url = tremorGeneralServiceURL + "/" + [val];
				qt.executeForIds(qry).then(function(ids) {
					if (ids) {
						oids = oids.concat(ids);
					}
				} );
			} );
			setTimeout(function() {
				createWellsList(oids, returnType, areaType);
			}, 1500);

			// Turn on selected layers and filter features w/ a definitionExpression:
			applyDefExp(lIDs, theWhere);
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


	function openToolsPanel() {
		$(".item").removeClass("item-selected");
		$(".panel").removeClass("panel-selected");
		$(".icon-wrench").closest(".item").addClass("item-selected");
		$("#tools-panel").closest(".panel").addClass("panel-selected");
		$("#loader").show();
	}


	function filterSca() {
		graphicsLayer.removeAll();
		openToolsPanel();

		var returnType = $('input[name=return-type]:checked').val();
		var areaType = $('input[name=area-type]:checked').val();
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
		if (dom.byId("sca").value === "Expanded Area") {
			fp.layerIds = [1];
			fp.searchFields = ["OBJECTID"];
			fp.searchText = "1";
			seismicConcernExpandedLayer.visible = true;
			$("#Expanded-Area-of-Seismic-Concern input").prop("checked", true);
		} else {
			fp.layerIds = [0];
			fp.searchFields = ["AREA_NAME"];
			fp.searchText = dom.byId("sca").value;
			seismicConcernLayer.visible = true;
			$("#Areas-of-Seismic-Concern input").prop("checked", true);
		}
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
					alert("Please select at least one earthquake category.");
					return;
				}

				// Create where clause and get objectids:
				theWhere = earthquakeWhereClause(areaType);
				if (theWhere !== "") {
					qry.where = theWhere;
				} else {
					// Dummy clause to select all:
					qry.where = "event_id > 0";
				}

				qry.geometry = result.results[0].feature.geometry;

				$.each(lIDs, function(idx, val) {
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
						applyDefExp(lIDs, theWhere, tempTable);
					} );
				}, 1500 );
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
					class1Layer.sublayers[18].definitionExpression = "objectid in (" + oidList + ")";
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
						wellsLayer.sublayers[0].definitionExpression = "objectid in (select oid from " + tempTable + ")";
						idDef[0] = "kid in (select kid from " + tempTable + ")";
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
			color: [102, 205, 170, 0.4],
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
				alert("Please select at least one earthquake category.");
				return;
			}

			// Create where clause and get objectids:
			theWhere = earthquakeWhereClause(areaType);
			if (theWhere !== "") {
				qry.where = theWhere;
			} else {
				// Dummy clause to select all:
				qry.where = "event_id > 0";
			}

			qry.geometry = buffPoly;

			$.each(lIDs, function(idx, val) {
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
					applyDefExp(lIDs, theWhere, tempTable);
				} );
			}, 1500 );
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
				class1Layer.sublayers[18].definitionExpression = "objectid in (" + oidList + ")";
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
					wellsLayer.sublayers[0].definitionExpression = "objectid in (select oid from " + tempTable + ")";
					idDef[0] = "kid in (select kid from " + tempTable + ")";
				} );
			} );
		}
		$("#filter-buff-dia").dialog("close");
	}


	function applyDefExp(lIDs, theWhere, tempTable) {
		// Turn all event layers off:
		kgsCatalogedLayer.visible = false;
		$("#KGS-Cataloged-Events input").prop("checked", false);
		kgsPrelimLayer.visible = false;
		$("#KGS-Preliminary-Events input").prop("checked", false);
		neicLayer.visible = false;
		$("#NEIC-Cataloged-Events input").prop("checked", false);
		ogsLayer.visible = false;
		$("#OGS-Cataloged-Events input").prop("checked", false);

		if ( tempTable && theWhere ) {
			theWhere += " and objectid in (select oid from " + tempTable +" )";
		}
		if (tempTable && !theWhere) {
			theWhere += "objectid in (select oid from " + tempTable + ")";
		}

		// Apply definitionExpression to filter which features are visible; turn layer on:
		for (var i = 0; i < lIDs.length; i++) {
			switch (lIDs[i]) {
				case 14:
					kgsCatalogedLayer.sublayers[14].definitionExpression = theWhere;
					kgsCatalogedLayer.visible = true;
					idDef[14] = theWhere;
					$("#KGS-Cataloged-Events input").prop("checked", true);
					break;
				case 15:
					kgsPrelimLayer.sublayers[15].definitionExpression = theWhere;
					kgsPrelimLayer.visible = true;
					idDef[15] = theWhere;
					$("#KGS-Preliminary-Events input").prop("checked", true);
					break;
				case 16:
					neicLayer.sublayers[16].definitionExpression = theWhere;
					neicLayer.visible = true;
					idDef[16] = theWhere;
					$("#NEIC-Cataloged-Events input").prop("checked", true);
					break;
				case 17:
					ogsLayer.sublayers[17].definitionExpression = theWhere;
					ogsLayer.visible = true;
					idDef[17] = theWhere;
					$("#OGS-Cataloged-Events input").prop("checked", true);
					break;
			}
		}
	}


	function earthquakeWhereClause(areaType) {
		var theWhere = "";
		var dateWhere = "";
		var magWhere = "";
		var countyWhere = "";
		var fromDate = dom.byId('eq-from-date').value;
		var toDate = dom.byId('eq-to-date').value;
		var lMag = dom.byId('low-mag').value;
		var uMag = dom.byId('high-mag').value;
		var county = dom.byId("lstCounty2").value;

		if (fromDate && toDate) {
			dateWhere = "origin_time >= to_date('" + fromDate + "','mm/dd/yyyy') and origin_time <= to_date('" + toDate + "','mm/dd/yyyy')";
		} else if (fromDate && !toDate) {
			dateWhere = "origin_time >= to_date('" + fromDate + "','mm/dd/yyyy')";
		} else if (!fromDate && toDate) {
			dateWhere = "origin_time <= to_date('" + toDate + "','mm/dd/yyyy')";
		}

		if (lMag && uMag) {
			magWhere = "mc >= " + lMag + " and mc <= " + uMag;
		} else if (lMag && !uMag) {
			magWhere = "mc >= " + lMag;
		} else if (!lMag && uMag) {
			magWhere = "mc <= " + uMag;
		}

		if (areaType === "co") {
			countyWhere = "county = '" + dom.byId("lstCounty2").value + "'";
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
            view.center = new Point(f.geometry.x, f.geometry.y, wmSR);;
            view.scale = 24000;
		} else {
			view.extent = f.geometry.extent;
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
                findParams.layerIds = [0];
                findParams.searchFields = ["api_number"];
                findParams.searchText = apiText;
				findParams.contains = false;
				wellsLayer.visible = true;
                $("#Oil-and-Gas-Wells input").prop("checked", true);
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
					case "KGS Cataloged":
						kgsCatalogedLayer.visible = true;
						$("#KGS-Cataloged-Events input").prop("checked", true);
						break;
					case "KGS Preliminary":
						kgsPrelimLayer.visible = true;
						$("#KGS-Preliminary-Events input").prop("checked", true);
						break;
					case "NEIC Cataloged":
						neicLayer.visible = true;
						$("#NEIC-Cataloged-Events input").prop("checked", true);
						break;
					case "OGS Cataloged":
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

			// queryTask.execute(query).then(function(results) {
			// 	createWellsList(results, selectWellType, dom.byId('twn').value, dom.byId('rng').value, dir, dom.byId('sec').value, listCount, what);
			// } );

			return addPopupTemplate(response.results);
        } ).then(function(feature) {
			if (what === "api" || what === "field") {
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
				var aDate = new Date(a.feature.attributes["ORIGIN_TIME"]);
				var bDate = new Date(b.feature.attributes["ORIGIN_TIME"]);
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
			eqType = eqType.replace(17, "OGS");
			eqType = " (" + eqType + ") ";
			var typeString = "earthquakes ";
		}
		if (returnType === "Class I Injection") {
			var typeString = "class I injection wells ";
		}
		if (returnType === "Oil and Gas") {
			var typeString = "oil and gas wells ";
		}

		var wellsLst = "<div class='panel-sub-txt' id='list-txt'></div><div class='download-link'></div><div class='toc-note' id='sect-desc'>" + count + " " + typeString + eqType + areaString + "</div>";
		$("#wells-tbl").html(wellsLst);
		$("#dwnld").html("<a class='esri-icon-download' title='Download List to CSV File'></a><a class='esri-icon-line-chart'></a>");

		var lstIds = arrIds.join(",");
		data = { "type": returnType, "lstIds": lstIds };

		$(".esri-icon-download").click( data, downloadList) ;
		$(".esri-icon-line-chart").click( makeChart );

		if (count > 500) {
			$("#wells-tbl").append("&nbsp;&nbsp;&nbsp;(listing 500 records - download csv file to see all)");
		}

		if (count > 0) {
			$.post( "createFeatureList.cfm?type=" + returnType, data, function(response) {
				sharedCfTable = response.substr(0,31);

				$("#wells-tbl").append(response.replace(sharedCfTable,''));
				$("#loader").hide();
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


	function makeChart() {
		if ( $('#chart').highcharts() ) {
			$('#chart').highcharts().destroy();
			$("#chart-x").hide();
		}

		$.get('chartData.cfm?tbl=' + sharedCfTable, function(response) {
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
					text: ""
				},
				xAxis: {
		            type: 'datetime',
		            dateTimeLabelFormats: {
		                day: '%e %b %Y'
		            },
					endOnTick: true,
					startOnTick: true
		        },
				yAxis: {
					title: {
						text: "Magnitude (MC)"
					}
				},
				series: data
		    } );
		} );
		$("#chart-x").show();
	}


	downloadList = function(evt) {
		$("#loader").show();

		$.post( "downloadPointsInPoly.cfm", data, function(response) {
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


	originalLocation = function() {
		urlZoom(urlParams);
	}


	addBookmark = function() {

	}


    function createMenus() {
    	var drawerMenus = [];
        var content, menuObj;

        // Find panel:
        content = '';
        content += '<div class="panel-container">';
        content += '<div class="panel-header">Find <span class="esri-icon-erase" title="Clear Filter & Graphics"></span><span class="esri-icon-filter" title="Filter Features"></span></div>';
        content += '<div class="panel-padding">';
        // address:
        content += '<div class="find-header esri-icon-right-triangle-arrow" id="address"><span class="find-hdr-txt"> Address or Place<span></div>';
        content += '<div class="find-body hide" id="find-address">';
        content += '<div id="srch"></div>';
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
		// content += '<tr><td></td><td><button class="find-button" onclick=$(".list-opts").toggleClass("hide")>Options</button>';
		// content += '<tr class="list-opts hide"><td colspan="2">List wells in this section:</td></tr>';
		// content += '<tr class="list-opts hide"><td></td><td><input type="radio" name="welltype" value="Oil and Gas"> Oil and Gas</td></tr>';
		// content += '<tr class="list-opts hide"><td></td><td><input type="radio" name="welltype" value="Water"> Water (WWC5)</td></tr>';
		// content += '<tr class="list-opts hide"><td></td><td><input type="radio" name="welltype" value="none" checked> Don&#39;t List</td></tr>';
        content += '<tr><td></td><td><button class="find-button" onclick=findIt("plss")>Find</button></td></tr>';
        content += '</table></div>';
		// earthquake event id:
		content += '<div class="find-header esri-icon-right-triangle-arrow" id="event"><span class="find-hdr-txt"> Event ID</span></div>';
        content += '<div class="find-body hide" id="find-event">';
        content += '<table><tr><td class="find-label">Event ID:</td><td><input id="eventid" size="14"></td><td><button class=find-button onclick=findIt("event")>Find</button></td></tr></table>';
        content += '</div>';
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
        // lat-lon:
        content += '<div class="find-header esri-icon-right-triangle-arrow" id="latlon"><span class="find-hdr-txt"> Latitude-Longitude</span></div>';
        content += '<div class="find-body hide" id="find-latlon">';
        content += '<table><tr><td class="find-label">Latitude:</td><td><input type="text" id="lat" placeholder="e.g. 38.12345"></td></tr>';
        content += '<tr><td class="find-label">Longitude:</td><td><input type="text" id="lon" placeholder="e.g. -98.12345"></td></tr>';
        content += '<tr><td class="find-label">Datum:</td><td><select id="datum"><option value="nad27">NAD27</option><option value="nad83">NAD83</option><option value="wgs84">WGS84</option><td></td></tr>';
        content += '<tr><td></td><td><button class="find-button" onclick="zoomToLatLong();">Find</button></td></tr>';
        content += '</table></div>';
        // field:
        // content += '<div class="find-header esri-icon-right-triangle-arrow" id="field"><span class="find-hdr-txt"> Oil-Gas Field</span></div>';
        // content += '<div class="find-body hide" id="find-field">';
        // content += '<table><tr><td class="find-label">Name:</td><td><input id="field-select"></td></tr>';
		// content += '<tr><td colspan="2"><input type="checkbox" id="field-list-wells">List wells assigned to this field</td></tr>';
		// content += '<tr><td></td><td><button class=find-button onclick=findIt("field")>Find</button></td></tr></table>';
        // content += '</div>';
        // county:
        content += '<div class="find-header esri-icon-right-triangle-arrow" id="county"><span class="find-hdr-txt"> County</span></div>';
        content += '<div class="find-body hide" id="find-county">';
        content += '<table><tr><td class="find-label">County:</td><td><select id="lstCounty"></select></td><td><button class=find-button onclick=findIt("county")>Find</button></td></tr></table>';
        content += '<hr></div>';
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

        // Layers panel:
        content = '';
        content += '<div class="panel-container">';
        content += '<div class="panel-header">Layers* <span id="clear-filters"><span class="esri-icon-erase" title="Clear Filter & Graphics"></span><span class="esri-icon-filter" title="Filter Features"></span></div>';
        content += '<div id="lyrs-toc"></div>';
        content += '</div>';

        menuObj = {
            label: '<div class="icon-layers"></div><div class="icon-text">Layers</div>',
            content: content
        };
        drawerMenus.push(menuObj);

        // Tools panel:
        content = '';
        content += '<div class="panel-container" id="tools-panel">';
        content += '<div class="panel-header">List <span id="dwnld"></span><img id="loader" class="hide" src="images/ajax-loader.gif"><span class="esri-icon-erase" title="Clear Filter & Graphics"></span><span class="esri-icon-filter" title="Filter Features"></span></div>';
        content += '<div class="panel-padding">';
		content += '</div>';
		content += '<div id="wells-tbl"></div>';
        content += '</div>';

        menuObj = {
            label: '<div class="icon-wrench"></div><div class="icon-text">Lists</div>',
            content: content
        };
        drawerMenus.push(menuObj);

		// Legend panel:
        content = '';
        content += '<div class="panel-container">';
        content += '<div class="panel-header">Legend <span class="esri-icon-erase" title="Clear Filter & Graphics"></span><span class="esri-icon-filter" title="Filter Features"></span></div>';
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


    function showFullInfo() {
        var popupTitle = $(".esri-title").html();
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


    function createTOC() {
        var lyrs = map.layers;
        var chkd, tocContent = "";
        var transparentLayers = ["Oil and Gas Fields","Topography","2014 Aerials","2002 Aerials","1991 Aerials"];

        for (var j=lyrs.length - 1; j>-1; j--) {
            var layerID = lyrs._items[j].id;
            chkd = map.findLayerById(layerID).visible ? "checked" : "";
            if (layerID.indexOf("-layer-") === -1) {
                // ^ Excludes default graphics layer from the TOC.
                var htmlID = layerID.replace(/ /g, "-");
                tocContent += "<div class='toc-item' id='" + htmlID + "'><label><input type='checkbox' id='tcb-" + j + "' onclick='toggleLayer(" + j + ");'" + chkd + ">" + layerID + "</label>";

                if ($.inArray(layerID, transparentLayers) !== -1) {
                    // Add transparency control buttons to specified layers.
                    tocContent += "</span><span class='esri-icon-forward toc-icon' title='Make Layer Opaque' onclick='changeOpacity(&quot;" + layerID + "&quot;,&quot;up&quot;);'></span><span class='esri-icon-reverse toc-icon' title='Make Layer Transparent' onclick='changeOpacity(&quot;" + layerID + "&quot;,&quot;down&quot;);'>";
                }
                tocContent += "</div>";
            }
        }
        tocContent += "<span class='toc-note'>* Some layers only visible when zoomed in</span>";
        $("#lyrs-toc").html(tocContent);

        // Add addtional layer-specific controls and content (reference by hyphenated layer id):

        // var eventDesc = "Data for all events occurring between 1/9/2013 and 3/7/2014 was provided by the Oklahoma Geological Survey - all other data is from the USGS.</p>";
        // eventDesc += "<p>Earthquake data for Oklahoma is incomplete and only extends back to 12/2/2014. Only events occurring in northern Oklahoma<br>(north of Medford) are included on the mapper.</p>";
        // $("#Earthquakes").append("<span class='esri-icon-filter toc-icon' onclick='$( &quot;#eq-filter&quot; ).dialog( &quot;open&quot; );' title='Filter Earthquakes'></span><span class='esri-icon-description toc-icon' id='event-desc-icon'></span><span class='tooltip hide' id='event-desc'>" + eventDesc + "</span>");
        // $("#event-desc-icon").click(function() {
        //     $("#event-desc").toggleClass("show");
        // } );
    }


    labelWells = function(type) {
        // TODO:
    }


    changeOpacity = function(id, dir) {
        var lyr = map.findLayerById(id);
        var incr = (dir === "down") ? -0.2 : 0.2;
        lyr.opacity = lyr.opacity + incr;
    }


    function executeIdTask(event) {
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
				var fAtts = feature[0].attributes;
				if (fAtts.hasOwnProperty('INPUT_SEQ_NUMBER')) {
					var ptID = fAtts.INPUT_SEQ_NUMBER;
				} else if (fAtts.hasOwnProperty('KID')) {
					var ptID = fAtts.KID;
				} else if (fAtts.hasOwnProperty('EVENT_ID')) {
					var ptID = fAtts.EVENT_ID;
				}
				$(".well-list-tbl tr").removeClass("highlighted");
				$(".well-list-tbl tr:contains(" + ptID + ")").toggleClass("highlighted");

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

			if (layerName === 'OG_WELLS' || layerName === 'CLASS1 WELLS') {
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
			else if (layerName === 'KGS Cataloged' || layerName === 'KGS Preliminary' || layerName === 'NEIC Cataloged' || layerName === 'OGS Cataloged') {
				var earthquakeTemplate = new PopupTemplate( {
					title: layerName + " Event: ",
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
		var m = f.MC !== "Null" ? f.MC : "";
		var sas = f.SAS !== "Null" ? f.SAS : "";
		var co = f.COUNTY !== "Null" ? f.COUNTY : "";

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
		content += "<tr><td>Origin Time (UTC): </td><td>{ORIGIN_TIME}</td></tr>";
		content += "<tr><td>Origin Time Error: </td><td>" + ote + "</td></tr>";
		content += "<tr><td>Latitude: </td><td>" + lat + "&deg;</td></tr>";
        content += "<tr><td>Longitude: </td><td>" + lon + "&deg;</td></tr>";
		content += "<tr><td>Horizontal Uncertainty: </td><td>" + hu + "</td></tr>";
		content += "<tr><td>Depth: </td><td>" + dep + "</td></tr>";
		content += "<tr><td>Vertical Uncertainty: </td><td>" + de + "</td></tr>";
        content += "<tr><td>Magnitude (MC): </td><td>" + m + "</td></tr>";
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

} );
