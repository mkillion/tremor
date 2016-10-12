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

<cfif isdefined("url.type")>
	<cfset Type = #url.type#>
<cfelse>
	<cfset Type = #form.type#>
</cfif>

<cfset WellsFileName = "KGS-#Type#-#TimeStamp#.csv">
<cfset WellsOutputFile = "\\vmpyrite\d$\webware\Apache\Apache2\htdocs\kgsmaps\oilgas\output\#WellsFileName#">


<cfif #Type# eq "Class I Injection" or #Type# eq "Oil and Gas" or #Type# eq "Salt Water Disposal">
	<!--- PREPARE OUTPUT FILE: --->
	<cfset Headers = "KID,API_NUMBER,LEASE_NAME,WELL_NAME,ORIG_OPERATOR,CURR_OPERATOR,FIELD_NAME,TOWNSHIP,TOWNSHIP_DIR,RANGE,RANGE_DIR,SECTION,SPOT,SUBDIVISION_4_SMALLEST,SUBDIVISION_3,SUBDIVISION_2,SUBDIVISION_1_LARGEST,FEET_NORTH,FEET_EAST,REFERENCE_CORNER,NAD27_LONGITUDE,NAD27_LATITUDE,COUNTY,PERMIT_DATE,SPUD_DATE,COMPLETION_DATE,PLUG_DATE,WELL_TYPE,STATUS,TOTAL_DEPTH,ELEVATION_KB,ELEVATION_GL,ELEVATION_DF,PRODUCING_FORMATION">
	<cffile action="write" file="#WellsOutputFile#" output="#Headers#" addnewline="yes">

	<!--- CREATE TEMP TABLE: --->
	<cfset Uid = right(CreateUUID(),16)>
	<cfset tempTable = "tmp_#Uid#">
	<cfquery name="qCreate" datasource="plss">
		create table #tempTable#(oid varchar2(20))
	</cfquery>
	<cfloop index="i" list="#form.lstIds#">
		<cfquery name="qInsert" datasource="plss">
			insert into #tempTable# values('#i#')
		</cfquery>
	</cfloop>

	<!--- GET FEATURES: --->
	<cfquery name="qWellData" datasource="plss">
		select kid, api_number, lease_name, well_name, operator_name, curr_operator, field_name, township, township_direction, range, range_direction, section, spot, subdivision_4_smallest, subdivision_3, subdivision_2, subdivision_1_largest, feet_north_from_reference, feet_east_from_reference, reference_corner, nad27_longitude, nad27_latitude, county, permit_date_txt, spud_date_txt, completion_date_txt, plug_date_txt, status_txt, well_class, rotary_total_depth, elevation_kb, elevation_gl, elevation_df, producing_formation
		<cfif #Type# eq "Oil and Gas" or #Type# eq "Salt Water Disposal">
			from oilgas_wells
		<cfelse>
			from class1_wells
		</cfif>
		where objectid in (select oid from #tempTable#)
	</cfquery>

	<!--- CLEANUP: --->
	<cfquery name="qDrop" datasource="plss">
		drop table #tempTable#
	</cfquery>

	<!--- WRITE OUTPUT: --->
	<cfloop query="qWellData">
		<cfset Data = '"#kid#","#api_number#","#lease_name#","#well_name#","#operator_name#","#curr_operator#","#field_name#","#township#","#township_direction#","#range#","#range_direction#","#section#","#spot#","#subdivision_4_smallest#","#subdivision_3#","#subdivision_2#","#subdivision_1_largest#","#feet_north_from_reference#","#feet_east_from_reference#","#reference_corner#","#nad27_longitude#","#nad27_latitude#","#county#","#permit_date_txt#","#spud_date_txt#","#completion_date_txt#","#plug_date_txt#","#status_txt#","#well_class#","#rotary_total_depth#","#elevation_kb#","#elevation_gl#","#elevation_df#","#producing_formation#"'>
		<cffile action="append" file="#WellsOutputFile#" output="#Data#" addnewline="yes">
	</cfloop>

<cfelseif #Type# eq "Earthquakes">
	<!--- PREPARE OUTPUT FILE: --->
	<cfset Headers = "EVENT_ID,QUAKE_ID,AGENCY,AGENCY_ID,ORIGIN_TIME,LATITUDE,LONGITUDE,DEPTH,DATUM,ORIGIN_TIME_ERR,LATITUDE_ERR,LONGITUDE_ERR,DEPTH_ERR,NST,RMS,GAP,MC,ML,MB,MS,MW,MB_LG,FAULT_SOLUTION,MODEL,UPDATED_TIMESTAMP,WAVEFORM_URL,WAVEFORM_FILE,PLACE,SECONDS,FEET,LAYER,SAS,COUNTY,CATALOG">
	<cffile action="write" file="#WellsOutputFile#" output="#Headers#" addnewline="yes">

	<!--- CREATE TEMP TABLE: --->
	<cfset Uid = right(CreateUUID(),16)>
	<cfset tempTable = "tmp_#Uid#">
	<cfquery name="qCreate" datasource="gis_webinfo">
		create table #tempTable#(oid varchar2(20))
	</cfquery>
	<cfloop index="i" list="#form.lstIds#">
		<cfquery name="qInsert" datasource="gis_webinfo">
			insert into #tempTable# values('#i#')
		</cfquery>
	</cfloop>

	<!--- GET FEATURES: --->
	<cfquery name="qEventData" datasource="gis_webinfo">
		select event_id, quake_id, agency, agency_id, to_char(origin_time, 'MM/DD/YYYY HH24:MI:SS') as otm, latitude, longitude, depth, datum, origin_time_err, latitude_err, longitude_err, depth_err, nst, rms, gap, mc, ml, mb, ms, mw, mb_lg, fault_solution, model, to_char(updated_timestamp, 'MM/DD/YYYY HH24:MI:SS') as uts, waveform_url, waveform_file, place, seconds, feet, layer, sas, county, catalog
		from tremor_events
		where objectid in (select oid from #tempTable#)
	</cfquery>

	<!--- CLEANUP: --->
	<cfquery name="qDrop" datasource="gis_webinfo">
		drop table #tempTable#
	</cfquery>

	<!--- WRITE OUTPUT: --->
	<cfloop query="qEventData">
		<cfset Data = '"#event_id#","#quake_id#","#agency#","#agency_id#","#otm#","#latitude#","#longitude#","#depth#","#datum#","#origin_time_err#","#latitude_err#","#longitude_err#","#depth_err#","#nst#","#rms#","#gap#","#mc#","#ml#","#mb#","#ms#","#mw#","#mb_lg#","#fault_solution#","#model#","#uts#","#waveform_url#","#waveform_file#","#place#","#seconds#","#feet#","#layer#","#sas#","#county#","#catalog#"'>
		<cffile action="append" file="#WellsOutputFile#" output="#Data#" addnewline="yes">
	</cfloop>
</cfif>

<cfoutput>
	<div class="download-link"><a href="http://vmpyrite.kgs.ku.edu/KgsMaps/oilgas/output/#WellsFileName#">#WellsFileName#</a></div>
</cfoutput>

</body>
</html>
