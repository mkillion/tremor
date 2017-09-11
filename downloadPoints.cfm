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

<cfset WellsFileText = "">
<cfset InjFileText = "">
<cfset EventFileText = "">
<cfset C1WellsFileText = "">

<cfif #form.fromdate# neq "">
    <cfset FromYear = Right(#form.fromdate#, 4)>
    <cfset FromMonth = Left(#form.fromdate#, 2)>
</cfif>
<cfif #form.todate# neq "">
    <cfset ToYear = Right(#form.todate#, 4)>
    <cfset ToMonth = Left(#form.todate#, 2)>
</cfif>

<!--- C1 WELLS: --->
<cfif ListContains(#form.what#, "c1s")>
    <!--- Make a wells file even if there's no injection data: --->
    <cfset C1WellsFileName = "CLASS1-WELLS-#TimeStamp#.csv">
	<cfset WellsOutputFile = "\\vmpyrite\d$\webware\Apache\Apache2\htdocs\kgsmaps\oilgas\output\#C1WellsFileName#">

	<!--- PREPARE OUTPUT FILE: --->
	<cfset Headers = "UIC_ID,FACILITY_NAME,COUNTY,LATITUDE,LONGITUDE,injection_zone">
	<cffile action="write" file="#WellsOutputFile#" output="#Headers#" addnewline="yes">

    <!--- GET DATA: --->

    <cfquery name="qC1WellData" datasource="plss">
		select
            uic_id, facility_name, county_name, latitude, longitude, injection_zone
        from
            class1_wells
		<cfif #form.c1wellwhere# neq "">
			where #PreserveSingleQuotes(form.c1wellwhere)#
		</cfif>
	</cfquery>

    <!--- WRITE FILE: --->
    <cfif #qC1WellData.recordcount# gt 0>
        <cfloop query="qC1WellData">
    		<cfset Data = '"#uic_id#","#facility_name#","#county_name#","#latitude#","#longitude#","#injection_zone#"'>
    		<cffile action="append" file="#WellsOutputFile#" output="#Data#" addnewline="yes">
    	</cfloop>
		<cfset C1WellsFileText = "Click for Class 1 Wells File">
	<cfelse>
		<cfset C1WellsFileText = "No Class 1 wells data for this search">
	</cfif>
    <!--- End C1 wells file. --->

    <!--- C1 INJECTION FILE: --->

</cfif>


<!--- C2 WELLS: --->
<cfif ListContains(#form.what#, "wells")>
    <!--- Make a wells file even if there's no injection data: --->
    <cfset WellsFileName = "CLASS2-WELLS-#TimeStamp#.csv">
	<cfset WellsOutputFile = "\\vmpyrite\d$\webware\Apache\Apache2\htdocs\kgsmaps\oilgas\output\#WellsFileName#">

	<!--- PREPARE OUTPUT FILE: --->
	<cfset Headers = "KID,API_NUMBER,LEASE_NAME,WELL_NAME,ORIG_OPERATOR,CURR_OPERATOR,FIELD_NAME,TOWNSHIP,TOWNSHIP_DIR,RANGE,RANGE_DIR,SECTION,SPOT,SUBDIVISION_4_SMALLEST,SUBDIVISION_3,SUBDIVISION_2,SUBDIVISION_1_LARGEST,FEET_NORTH,FEET_EAST,REFERENCE_CORNER,NAD27_LONGITUDE,NAD27_LATITUDE,COUNTY,PERMIT_DATE,SPUD_DATE,COMPLETION_DATE,PLUG_DATE,WELL_TYPE,STATUS,TOTAL_DEPTH,ELEVATION_KB,ELEVATION_GL,ELEVATION_DF,PRODUCING_FORMATION">
	<cffile action="write" file="#WellsOutputFile#" output="#Headers#" addnewline="yes">

	<!--- GET DATA: --->
    <cfquery name="qWellData" datasource="plss">
		select kid, api_number, lease_name, well_name, operator_name, curr_operator, field_name, township, township_direction, range, range_direction, section, spot, subdivision_4_smallest, subdivision_3, subdivision_2, subdivision_1_largest, feet_north_from_reference, feet_east_from_reference, reference_corner, nad27_longitude, nad27_latitude, county, permit_date_txt, spud_date_txt, completion_date_txt, plug_date_txt, status_txt, well_class, rotary_total_depth, elevation_kb, elevation_gl, elevation_df, producing_formation
		from swd_wells
		<cfif #form.wellwhere# neq "">
			where #PreserveSingleQuotes(form.wellwhere)#
		</cfif>
	</cfquery>

    <cfif #qWellData.recordcount# gt 0>
        <cfloop query="qWellData">
    		<cfset Data = '"#kid#","#api_number#","#lease_name#","#well_name#","#operator_name#","#curr_operator#","#field_name#","#township#","#township_direction#","#range#","#range_direction#","#section#","#spot#","#subdivision_4_smallest#","#subdivision_3#","#subdivision_2#","#subdivision_1_largest#","#feet_north_from_reference#","#feet_east_from_reference#","#reference_corner#","#nad27_longitude#","#nad27_latitude#","#county#","#permit_date_txt#","#spud_date_txt#","#completion_date_txt#","#plug_date_txt#","#status_txt#","#well_class#","#rotary_total_depth#","#elevation_kb#","#elevation_gl#","#elevation_df#","#producing_formation#"'>
    		<cffile action="append" file="#WellsOutputFile#" output="#Data#" addnewline="yes">
    	</cfloop>
		<cfset WellsFileText = "Click for Class 2 Wells File">
	<cfelse>
		<cfset WellsFileText = "No Class 2 wells data for this search">
	</cfif>

    <!--- End wells file. --->


    <!--- INJECTION: --->
    <cfset InjWhere = "swd." & #form.wellwhere#>

	<!--- GET DATA: --->
    <cfif (isDefined("FromYear") and #FromYear# lt 2015) or (isDefined("ToYear") and #ToYear# lt 2015) or (#form.time# eq "all")>
        <!--- Return ANNUAL volumes. --->
        <!--- Prepare output file: --->
        <cfset InjFileName = "CLASS2-ANNUAL-INJ-#TimeStamp#.csv">
    	<cfset InjOutputFile = "\\vmpyrite\d$\webware\Apache\Apache2\htdocs\kgsmaps\oilgas\output\#InjFileName#">
    	<cfset Headers = "WELL_HEADER_KID,API_NUMBER,API_NUMBER_KCC,NAD27_LATITUDE,NAD27_LONGITUDE,YEAR,ANNUAL_VOLUME,FLUID_TYPE,INJECTION_ZONE,MAX_AUTHORIZED_PRESSURE">
    	<cffile action="write" file="#InjOutputFile#" output="#Headers#" addnewline="yes">

        <cfquery name="qInjData" datasource="plss">
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
                inj.max_authorized_pressure
            from
                qualified.injections inj,
                swd_wells swd,
                qualified.well_headers qwh
            where
                swd.kid = inj.well_header_kid
                and
                swd.kid = qwh.kid
                <cfif #form.time# eq "date">
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
                <cfelseif #form.time# neq "all">
                    and
                    year = (select to_char(sysdate, 'YYYY') from dual)
                </cfif>
                <cfif #form.bbl# neq "">
                    and
                    total_fluid_volume >= #form.bbl#
                </cfif>
                <cfif #form.wellwhere# neq "">
                    and
                    #PreserveSingleQuotes(InjWhere)#
                </cfif>
            order by well_header_kid, year
        </cfquery>

        <!--- WRITE FILE: --->
    	<cfif #qInjData.recordcount# gt 0>
            <cfloop query="qInjData">
        		<cfset Data = '"#well_header_kid#","#api_number#","#api_number_kcc#","#nad27_latitude#","#nad27_longitude#","#year#","#annual_volume#","#fluid_type#","#injection_zone#","#max_authorized_pressure#"'>
        		<cffile action="append" file="#InjOutputFile#" output="#Data#" addnewline="yes">
        	</cfloop>
    		<cfset InjFileText = "Click for Class 2 Injection File">
    	<cfelse>
    		<cfset InjFileText = "No Class 2 injection data for this time period">
    	</cfif>

    <cfelseif #form.time# eq "date">
        <!--- Return MONTHLY volumes. --->
        <!--- Prepare output file: --->
        <cfset InjFileName = "CLASS2-MONTHLY-INJ-#TimeStamp#.csv">
    	<cfset InjOutputFile = "\\vmpyrite\d$\webware\Apache\Apache2\htdocs\kgsmaps\oilgas\output\#InjFileName#">
    	<cfset Headers = "WELL_HEADER_KID,API_NUMBER,API_NUMBER_KCC,NAD27_LATITUDE,NAD27_LONGITUDE,YEAR,MONTH,MONTHLY_VOLUME,FLUID_TYPE,INJECTION_ZONE,MAX_AUTHORIZED_PRESSURE">
    	<cffile action="write" file="#InjOutputFile#" output="#Headers#" addnewline="yes">

        <cfquery name="qInjData" datasource="plss">
            select
                inj.well_header_kid,
                qwh.api_number,
                qwh.api_number_kcc,
                qwh.nad27_latitude,
                qwh.nad27_longitude,
                m.year,
                m.month,
                m.fluid_injected as monthly_volume,
                inj.fluid_type,
                inj.injection_zone,
                inj.max_authorized_pressure
            from
                qualified.injections inj,
                qualified.well_headers qwh,
                mk_injections_months m
            where
                inj.well_header_kid = qwh.kid
                and
                inj.kid = m.inj_kid
                <cfif #form.injvolwhere# neq "">
                    and
                    inj.well_header_kid in ( select kid from swd_wells where #PreserveSingleQuotes(form.injvolwhere)# )
                </cfif>
                <cfif isDefined("FromYear") and isDefined("ToYear")>
                    and
                    m.month_year >= to_date('#fromMonth#/#fromYear#','mm/yyyy') and m.month_year <= to_date('#toMonth#/#toYear#','mm/yyyy')
                </cfif>
                <cfif isDefined("FromYear") and not isDefined("ToYear")>
                    and
                    m.month_year >= to_date('#fromMonth#/#fromYear#','mm/yyyy')
                </cfif>
                <cfif not isDefined("FromYear") and isDefined("ToYear")>
                    and
                    m.month_year <= to_date('#toMonth#/#toYear#','mm/yyyy')
                </cfif>
                <cfif #form.bbl# neq "">
                    and
                    m.fluid_injected >= #form.bbl#
                </cfif>
            order by m.well_header_kid, m.year, m.month
        </cfquery>

        <!--- WRITE FILE: --->
    	<cfif #qInjData.recordcount# gt 0>
            <cfloop query="qInjData">
        		<cfset Data = '"#well_header_kid#","#api_number#","#api_number_kcc#","#nad27_latitude#","#nad27_longitude#","#year#","#month#","#monthly_volume#","#fluid_type#","#injection_zone#","#max_authorized_pressure#"'>
        		<cffile action="append" file="#InjOutputFile#" output="#Data#" addnewline="yes">
        	</cfloop>
    		<cfset InjFileText = "Click for Class 2 Injection File">
    	<cfelse>
    		<cfset InjFileText = "No Class 2 injection data for this time period">
    	</cfif>
    <cfelse>
        <cfset InjFileText = "No Class 2 injection data for this time period">
    </cfif>
    <!--- End injection file. --->
</cfif>


<!--- EVENTS: --->
<cfif ListContains(#form.what#, "events")>
	<cfset EventsFileName = "KGS-QUAKES-#TimeStamp#.csv">
	<cfset EventsOutputFile = "\\vmpyrite\d$\webware\Apache\Apache2\htdocs\kgsmaps\oilgas\output\#EventsFileName#">

	<!--- PREPARE OUTPUT FILE: --->
	<cfset Headers = "ORIGIN_TIME,LATITUDE,LONGITUDE,DEPTH,MAGNITUDE,MAGNITUDE_TYPE,SAS,NST,GAP,RMS,LATITUDE_ERR,LONGITUDE_ERR,DEPTH_ERR,COUNTY_NAME,LOCAL_TIME,AGENCY,AGENCY_ID,TYPE">
	<cffile action="write" file="#EventsOutputFile#" output="#Headers#" addnewline="yes">

	<!--- GET DATA: --->
    <cfset Lyrs = ReplaceNoCase(#form.includelayers#, "KGS Cataloged Events", "'KGS'")>
    <cfset Lyrs = ReplaceNoCase(#Lyrs#, "KGS Preliminary Events", "'EWA'")>
    <cfset Lyrs = ReplaceNoCase(#Lyrs#, "Historic Events", "'KSNE'")>
    <cfset Lyrs = ReplaceNoCase(#Lyrs#, "NEIC Cataloged Events", "'US'")>
    <cfset Lyrs = ReplaceNoCase(#Lyrs#, "Class 2 Wells", "")>
    <cfset Lyrs = ReplaceNoCase(#Lyrs#, "Class 1 Wells", "")>
    <cfset Lyrs = REReplace(Lyrs, ",$", "")>
    <cfset Lyrs = REReplace(Lyrs, ",$", "")>

	<cfquery name="qEventData" datasource="tremor">
		select origin_time,latitude,longitude,depth,magnitude,magnitude_type,sas,nst,gap,rms,latitude_err,longitude_err,depth_err,county_name,local_time,agency,agency_id,
            decode(layer,'EWA','Preliminary',
                'KGS','Cataloged',
                'US','NEIC',
                'KSNE','KSNE') as type
		from quakes
		<cfif #form.evtwhere# neq "">
			where #PreserveSingleQuotes(form.evtwhere)#
			and layer in (#PreserveSingleQuotes(Lyrs)#)
		</cfif>
		order by origin_time desc
	</cfquery>

	<!--- WRITE FILE: --->
	<cfloop query="qEventData">
		<cfset Data = '"#origin_time#","#latitude#","#longitude#","#depth#","#magnitude#","#magnitude_type#","#sas#","#nst#","#gap#","#rms#","#latitude_err#","#longitude_err#","#depth_err#","#county_name#","#local_time#","#agency#","#agency_id#","#type#"'>
		<cffile action="append" file="#EventsOutputFile#" output="#Data#" addnewline="yes">
	</cfloop>

	<cfif #qEventData.recordcount# gt 0>
		<cfset EventFileText = "Click for Earthquakes File">
	<cfelse>
		<cfset EventFileText = "No earthquakes match search">
	</cfif>
</cfif>

<cfoutput>
    <cfif FindNoCase("Click", #C1WellsFileText#) neq 0>
		<div class="download-link"><a href="http://vmpyrite.kgs.ku.edu/KgsMaps/oilgas/output/#C1WellsFileName#">#C1WellsFileText#</a></div>
	<cfelse>
		<div class="download-link">#C1WellsFileText#</div>
	</cfif>
    <cfif FindNoCase("Click", #WellsFileText#) neq 0>
		<div class="download-link"><a href="http://vmpyrite.kgs.ku.edu/KgsMaps/oilgas/output/#WellsFileName#">#WellsFileText#</a></div>
	<cfelse>
		<div class="download-link">#WellsFileText#</div>
	</cfif>
	<cfif FindNoCase("Click", #InjFileText#) neq 0>
		<div class="download-link"><a href="http://vmpyrite.kgs.ku.edu/KgsMaps/oilgas/output/#InjFileName#">#InjFileText#</a></div>
	<cfelse>
		<div class="download-link">#InjFileText#</div>
	</cfif>
	<cfif FindNoCase("Click", #EventFileText#) neq 0>
		<div class="download-link"><a href="http://vmpyrite.kgs.ku.edu/KgsMaps/oilgas/output/#EventsFileName#">#EventFileText#</a></div>
	<cfelse>
		<div class="download-link">#EventFileText#</div>
	</cfif>
</cfoutput>

</body>
</html>
