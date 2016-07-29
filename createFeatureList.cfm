<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfset TimeStamp = "#hour(now())##minute(now())##second(now())#">

<cfif isdefined("url.type")>
	<cfset Type = #url.type#>
<cfelse>
	<cfset Type = #form.type#>
</cfif>


<cfif #Type# eq "Oil and Gas" OR #Type# eq "Class I Injection">
	<cfif isdefined("form.lstIds")>
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

        <!--- GET RECORDS: --->
		<cfquery name="qFeatureData" datasource="plss">
			select kid, api_number, lease_name, well_name
            <cfif #Type# eq "Oil and Gas">
			    from oilgas_wells
            <cfelse>
                from class1_wells
            </cfif>
			where objectid in (select oid from #tempTable#)
            order by api_number
		</cfquery>

        <!--- CLEANUP: --->
        <!---
		<cfquery name="qDrop" datasource="plss">
			drop table #tempTable#
		</cfquery>
        --->
        <!--- CREATE HTML TABLE FOR RESPONSE: --->
        <cfoutput>
            <table class='striped-tbl well-list-tbl' id='og-tbl'><tr><th>Name</th><th>API</th></tr>
            <cfloop query="qFeatureData">
                <tr><td style='width:50%'>#LEASE_NAME# &nbsp; #WELL_NAME#</td><td style='width:50%'>#API_NUMBER#</td><td class='hide'>#KID#</td></tr>
            </cfloop>
            </table>
        </cfoutput>
	</cfif>



<cfelseif #Type# eq "Earthquakes">
	<cfset Headers = "EVENT_ID,QUAKE_ID,AGENCY,AGENCY_ID,ORIGIN_TIME,LATITUDE,LONGITUDE,DEPTH,DATUM,ORIGIN_TIME_ERR,LATITUDE_ERR,LONGITUDE_ERR,DEPTH_ERR,NST,RMS,GAP,MC,ML,MB,MS,MW,MB_LG,FAULT_SOLUTION,MODEL,UPDATED_TIMESTAMP,WAVEFORM_URL,WAVEFORM_FILE,PLACE,SECONDS,FEET,LAYER,SAS,COUNTY,CATALOG">

	<cffile action="write" file="#WellsOutputFile#" output="#Headers#" addnewline="yes">

	<!--- download w/in buffer: --->
	<cfset Uid = right(CreateUUID(),16)>
	<cfset tempTable = "tmp_seq_#Uid#">
	<cfquery name="qCreate" datasource="gis_webinfo">
		create table #tempTable#(event_id varchar2(20))
	</cfquery>
	<cfloop index="i" list="#form.evts#">
		<cfquery name="qInsert" datasource="gis_webinfo">
			insert into #tempTable# values('#i#')
		</cfquery>
	</cfloop>
	<cfquery name="qEventData" datasource="gis_webinfo">
		select event_id, quake_id, agency, agency_id, to_char(origin_time, 'MM/DD/YYYY HH24:MI:SS') as otm, latitude, longitude, depth, datum, origin_time_err, latitude_err, longitude_err, depth_err, nst, rms, gap, mc, ml, mb, ms, mw, mb_lg, fault_solution, model, to_char(updated_timestamp, 'MM/DD/YYYY HH24:MI:SS') as uts, waveform_url, waveform_file, place, seconds, feet, layer, sas, county, catalog
		from tremor_events
		where event_id in (select event_id from #tempTable#)
	</cfquery>
	<cfquery name="qDrop" datasource="gis_webinfo">
		drop table #tempTable#
	</cfquery>

	<cfloop query="qEventData">
		<cfset Data = '"#event_id#","#quake_id#","#agency#","#agency_id#","#otm#","#latitude#","#longitude#","#depth#","#datum#","#origin_time_err#","#latitude_err#","#longitude_err#","#depth_err#","#nst#","#rms#","#gap#","#mc#","#ml#","#mb#","#ms#","#mw#","#mb_lg#","#fault_solution#","#model#","#uts#","#waveform_url#","#waveform_file#","#place#","#seconds#","#feet#","#layer#","#sas#","#county#","#catalog#"'>

		<cffile action="append" file="#WellsOutputFile#" output="#Data#" addnewline="yes">
	</cfloop>
</cfif>
