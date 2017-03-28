<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
</head>
<body>
<cfset TimeStamp = "#hour(now())##minute(now())##second(now())#">

<cfset WellFileText = "">
<cfset EventFileText = "">

<cfif ListContains(#form.what#, "wells")>
	<cfset WellsFileName = "KGS-WELLS-#TimeStamp#.csv">
	<cfset WellsOutputFile = "\\vmpyrite\d$\webware\Apache\Apache2\htdocs\kgsmaps\oilgas\output\#WellsFileName#">

	<!--- PREPARE OUTPUT FILE: --->
	<cfset Headers = "KID,API_NUMBER,LEASE_NAME,WELL_NAME,ORIG_OPERATOR,CURR_OPERATOR,FIELD_NAME,TOWNSHIP,TOWNSHIP_DIR,RANGE,RANGE_DIR,SECTION,SPOT,SUBDIVISION_4_SMALLEST,SUBDIVISION_3,SUBDIVISION_2,SUBDIVISION_1_LARGEST,FEET_NORTH,FEET_EAST,REFERENCE_CORNER,NAD27_LONGITUDE,NAD27_LATITUDE,COUNTY,PERMIT_DATE,SPUD_DATE,COMPLETION_DATE,PLUG_DATE,WELL_TYPE,STATUS,TOTAL_DEPTH,ELEVATION_KB,ELEVATION_GL,ELEVATION_DF,PRODUCING_FORMATION,MOST_RECENT_TOTAL_FLUID">
	<cffile action="write" file="#WellsOutputFile#" output="#Headers#" addnewline="yes">

	<!--- GET DATA: --->
	<cfquery name="qWellData" datasource="plss">
		select kid, api_number, lease_name, well_name, operator_name, curr_operator, field_name, township, township_direction, range, range_direction, section, spot, subdivision_4_smallest, subdivision_3, subdivision_2, subdivision_1_largest, feet_north_from_reference, feet_east_from_reference, reference_corner, nad27_longitude, nad27_latitude, county, permit_date_txt, spud_date_txt, completion_date_txt, plug_date_txt, status_txt, well_class, rotary_total_depth, elevation_kb, elevation_gl, elevation_df, producing_formation,most_recent_total_fluid
		from swd_wells
		<cfif #form.wellwhere# neq "">
			where #PreserveSingleQuotes(form.wellwhere)#
		</cfif>
	</cfquery>

	<!--- WRITE FILE: --->
	<cfloop query="qWellData">
		<cfset Data = '"#kid#","#api_number#","#lease_name#","#well_name#","#operator_name#","#curr_operator#","#field_name#","#township#","#township_direction#","#range#","#range_direction#","#section#","#spot#","#subdivision_4_smallest#","#subdivision_3#","#subdivision_2#","#subdivision_1_largest#","#feet_north_from_reference#","#feet_east_from_reference#","#reference_corner#","#nad27_longitude#","#nad27_latitude#","#county#","#permit_date_txt#","#spud_date_txt#","#completion_date_txt#","#plug_date_txt#","#status_txt#","#well_class#","#rotary_total_depth#","#elevation_kb#","#elevation_gl#","#elevation_df#","#producing_formation#","#most_recent_total_fluid#"'>
		<cffile action="append" file="#WellsOutputFile#" output="#Data#" addnewline="yes">
	</cfloop>

	<cfif #qWellData.recordcount# gt 0>
		<cfset WellFileText = "Click for Wells File">
	<cfelse>
		<cfset WellFileText = "No wells match search">
	</cfif>
</cfif>

<cfif ListContains(#form.what#, "events")>
	<cfset EventsFileName = "KGS-QUAKES-#TimeStamp#.csv">
	<cfset EventsOutputFile = "\\vmpyrite\d$\webware\Apache\Apache2\htdocs\kgsmaps\oilgas\output\#EventsFileName#">

	<!--- PREPARE OUTPUT FILE: --->
	<cfset Headers = "QUAKE_ID,EVENTS_RECORDED,EVENT_ID,AGENCY,AGENCY_ID,CATALOG,LAYER,ORIGIN_TIME,LATITUDE,LONGITUDE,DEPTH,DATUM,ORIGIN_TIME_ERR,LATITUDE_ERR,LONGITUDE_ERR,DEPTH_ERR,NST,RMS,GAP,MC,ML,MB,MS,MW,MB_LG,FAULT_SOLUTION,MODEL,UPDATED_TIMESTAMP,WAVEFORM_URL,WAVEFORM_FILE,PLACE,SECONDS,FEET,SAS,COUNTY_CODE,COUNTY_NAME,FELT,SYNCHED,SYNC_ERRORS,ORIGIN_TIME_CST">
	<cffile action="write" file="#EventsOutputFile#" output="#Headers#" addnewline="yes">

	<!--- GET DATA: --->
	<cfquery name="qEventData" datasource="tremor">
		select quake_id,events_recorded,event_id,agency,agency_id,catalog,layer,origin_time,latitude,longitude,depth,datum,origin_time_err,latitude_err,longitude_err,depth_err,nst,rms,gap,mc,ml,mb,ms,mw,mb_lg,fault_solution,model,updated_timestamp,waveform_url,waveform_file,place,seconds,feet,sas,county_code,county_name,felt,synched,sync_errors,origin_time_cst
		from quakes
		<cfif #form.evtwhere# neq "">
			where #PreserveSingleQuotes(form.evtwhere)#
		</cfif>
	</cfquery>

	<!--- WRITE FILE: --->
	<cfloop query="qEventData">
		<cfset Data = '"#quake_id#","#events_recorded#","#event_id#","#agency#","#agency_id#","#catalog#","#layer#","#origin_time#","#latitude#","#longitude#","#depth#","#datum#","#origin_time_err#","#latitude_err#","#longitude_err#","#depth_err#","#nst#","#rms#","#gap#","#mc#","#ml#","#mb#","#ms#","#mw#","#mb_lg#","#fault_solution#","#model#","#updated_timestamp#","#waveform_url#","#waveform_file#","#place#","#seconds#","#feet#","#sas#","#county_code#","#county_name#","#felt#","#synched#","#sync_errors#","#origin_time_cst#"'>
		<cffile action="append" file="#EventsOutputFile#" output="#Data#" addnewline="yes">
	</cfloop>

	<cfif #qEventData.recordcount# gt 0>
		<cfset EventFileText = "Click for Earthquakes File">
	<cfelse>
		<cfset EventFileText = "No earthquakes match search">
	</cfif>
</cfif>

<cfoutput>
	<cfif FindNoCase("Click", #WellFileText#) neq 0>
		<div class="download-link"><a href="http://vmpyrite.kgs.ku.edu/KgsMaps/oilgas/output/#WellsFileName#">#WellFileText#</a></div>
	<cfelse>
		<div class="download-link">#WellFileText#</div>
	</cfif>
	<cfif FindNoCase("Click", #EventFileText#) neq 0>
		<div class="download-link"><a href="http://vmpyrite.kgs.ku.edu/KgsMaps/oilgas/output/#EventsFileName#">#EventFileText#</a></div>
	<cfelse>
		<div class="download-link">#EventFileText#</div>
	</cfif>
</cfoutput>

</body>
</html>
