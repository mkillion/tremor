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

<cfif #form.fromdate# neq "">
    <cfset FromYear = Right(#form.fromdate#, 4)>
    <cfset FromMonth = Left(#form.fromdate#, 2)>
</cfif>
<cfif #form.todate# neq "">
    <cfset ToYear = Right(#form.todate#, 4)>
    <cfset ToMonth = Left(#form.todate#, 2)>
</cfif>


<!--- WELLS: --->
<cfif ListContains(#form.what#, "wells")>
    <cfset WellsWhere = "swd." & #form.wellwhere#>

	<cfset WellsFileName = "KGS-WELLS-#TimeStamp#.csv">
	<cfset WellsOutputFile = "\\vmpyrite\d$\webware\Apache\Apache2\htdocs\kgsmaps\oilgas\output\#WellsFileName#">

	<!--- PREPARE OUTPUT FILE: --->
	<cfset Headers = "WELL_HEADER_KID,API_NUMBER,API_NUMBER_KCC,NAD27_LATITUDE,NAD27_LONGITUDE,YEAR,ANNUAL_VOLUME,FLUID_TYPE,INJECTION_ZONE,MAX_PRESSURE">
	<cffile action="write" file="#WellsOutputFile#" output="#Headers#" addnewline="yes">

	<!--- GET DATA: --->
    <cfquery name="qWellData" datasource="plss">
        select
            inj.well_header_kid,
            qwh.api_number,
            qwh.api_number_kcc,
            qwh.nad27_latitude,
            qwh.nad27_longitude,
            inj.year,
            inj.total_fluid_volume as annual_volume,
            inj.fluid_type,
            inj.injection_zone,
            inj.max_pressure
        from
            qualified.injections inj,
            swd_wells swd,
            qualified.well_headers qwh
        where
            swd.kid = inj.well_header_kid
            and
            swd.kid = qwh.kid
            <cfif isDefined("FromYear") and isDefined("ToYear")>
  			    and
  			    year >= #FromYear# and year <= #ToYear#
  		    </cfif>
  		    <cfif isDefined("FromYear") and not isDefined("ToYear")>
  			    and
  			    year >= #fromYear#
  		    </cfif>
  		    <cfif not isDefined("FromYear") and isDefined("ToYear")>
  			    and
  			    year <= #toYear#
  		    </cfif>
            <cfif #form.bbl# neq "">
                and
                total_fluid_volume >= #form.bbl#
            </cfif>
            <cfif #form.wellwhere# neq "">
                and
                #PreserveSingleQuotes(WellsWhere)#
            </cfif>
        order by well_header_kid, year
    </cfquery>

	<!--- WRITE FILE: --->
	<cfloop query="qWellData">
		<cfset Data = '"#well_header_kid#","#api_number#","#api_number_kcc#","#nad27_latitude#","#nad27_longitude#","#year#","#annual_volume#","#fluid_type#","#injection_zone#","#max_pressure#"'>
		<cffile action="append" file="#WellsOutputFile#" output="#Data#" addnewline="yes">
	</cfloop>

	<cfif #qWellData.recordcount# gt 0>
		<cfset WellFileText = "Click for Wells File">
	<cfelse>
		<cfset WellFileText = "No wells match search">
	</cfif>
</cfif>


<!--- EVENTS: --->
<cfif ListContains(#form.what#, "events")>
	<cfset EventsFileName = "KGS-QUAKES-#TimeStamp#.csv">
	<cfset EventsOutputFile = "\\vmpyrite\d$\webware\Apache\Apache2\htdocs\kgsmaps\oilgas\output\#EventsFileName#">

	<!--- PREPARE OUTPUT FILE: --->
	<cfset Headers = "ORIGIN_TIME,LATITUDE,LONGITUDE,DEPTH,MAGNITUDE,MAGNITUDE_TYPE,SAS,NST,GAP,RMS,LATITUDE_ERR,LONGITUDE_ERR,DEPTH_ERR,COUNTY_NAME,ORIGIN_TIME_CST,AGENCY,AGENCY_ID,TYPE">
	<cffile action="write" file="#EventsOutputFile#" output="#Headers#" addnewline="yes">

	<!--- GET DATA: --->
	<cfquery name="qEventData" datasource="tremor">
		select origin_time,latitude,longitude,depth,magnitude,magnitude_type,sas,nst,gap,rms,latitude_err,longitude_err,depth_err,county_name,origin_time_cst,agency,agency_id,
            decode(layer,'EWA','Preliminary',
                'KGS','Cataloged') as type
		from quakes
		<cfif #form.evtwhere# neq "">
			where #PreserveSingleQuotes(form.evtwhere)#
			and layer <> 'N/A'
		</cfif>
		order by origin_time desc
	</cfquery>

	<!--- WRITE FILE: --->
	<cfloop query="qEventData">
		<cfset Data = '"#origin_time#","#latitude#","#longitude#","#depth#","#magnitude#","#magnitude_type#","#sas#","#nst#","#gap#","#rms#","#latitude_err#","#longitude_err#","#depth_err#","#county_name#","#origin_time_cst#","#agency#","#agency_id#","#type#"'>
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
