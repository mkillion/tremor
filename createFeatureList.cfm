<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfset TimeStamp = "#hour(now())##minute(now())##second(now())#">

<cfif isdefined("url.type")>
	<cfset Type = #url.type#>
<cfelse>
	<cfset Type = #form.type#>
</cfif>


<cfif #Type# eq "Oil and Gas" OR #Type# eq "Class I Injection" OR #Type# eq "Salt Water Disposal">
	<cfif isdefined("form.lstIds")>
		<!--- CREATE TEMP TABLE: --->
		<cfset Uid = right(CreateUUID(),26)>
		<cfset Uid = replace(#Uid#, "-", "_", "all")>
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
		<cfquery name="qFeatureData" maxRows="500" datasource="plss">
			select kid, api_number, lease_name, well_name
            <cfif #Type# eq "Oil and Gas" OR #Type# eq "Salt Water Disposal">
			    from oilgas_wells
            <cfelse>
                from class1_wells
            </cfif>
			where objectid in (select oid from #tempTable#) and status = 'Drilled'
            order by api_number
		</cfquery>

        <!--- CLEANUP: --->
		<!---<cfquery name="qDrop" datasource="plss">
			drop table #tempTable#
		</cfquery>--->

        <!--- CREATE HTML TABLE FOR RESPONSE: --->
        <cfoutput>
			#tempTable#
            <table class='striped-tbl well-list-tbl' id='og-tbl'><tr><th>Name</th><th>API</th></tr>
            <cfloop query="qFeatureData">
                <tr><td style='width:50%'>#LEASE_NAME# &nbsp; #WELL_NAME#</td><td style='width:50%'>#API_NUMBER#</td><td class='hide'>#KID#</td></tr>
            </cfloop>
            </table>
        </cfoutput>
	</cfif>

<cfelseif #Type# eq "Earthquakes">
    <cfif isdefined("form.lstIds")>
        <!--- CREATE TEMP TABLE: --->
        <cfset Uid = right(CreateUUID(),26)>
		<cfset Uid = replace(#Uid#, "-", "_", "all")>
        <cfset tempTable = "tmp_#Uid#">
        <cfquery name="qCreate" datasource="gis_webinfo">
            create table #tempTable#(oid varchar2(20))
        </cfquery>
        <cfloop index="i" list="#form.lstIds#">
            <cfquery name="qInsert" datasource="gis_webinfo">
                insert into #tempTable# values('#i#')
            </cfquery>
        </cfloop>

        <!--- GET RECORDS: --->
        <cfquery name="qFeatureData" maxRows="500" datasource="gis_webinfo">
            select
                decode(layer, 'KGS', 'KGS Permanent',
                    'EWA', 'KGS Preliminary',
                    'OGS', 'OGS Permanent') as eq_type,
                to_char(origin_time,'mm/dd/yyyy') as the_date,
                round(mc, 1) || '&nbsp;&nbsp;mc' as mag,
                event_id
            from
				tremor_events
            where
				objectid in (select oid from #tempTable#)
			and
				layer <> 'USGS'
			and
				mc is not null
			union
			select
                decode(layer, 'USGS', 'NEIC Permanent') as eq_type,
                to_char(origin_time,'mm/dd/yyyy') as the_date,
                round(ml, 1) || '&nbsp;&nbsp;ml' as mag,
                event_id
            from
				tremor_events
            where
				objectid in (select oid from #tempTable#)
			and
				layer = 'USGS'
			and
				ml is not null
            order by eq_type, the_date
        </cfquery>

        <!--- CLEANUP: --->
        <!---<cfquery name="qDrop" datasource="gis_webinfo">
            drop table #tempTable#
        </cfquery>--->

        <!--- CREATE HTML TABLE FOR RESPONSE: --->
        <cfoutput>
			#tempTable#
            <table class='striped-tbl well-list-tbl' id='og-tbl'><tr><th>Type</th><th>Date</th><th>Magnitude</th></tr>
            <cfloop query="qFeatureData">
                <tr><td>#eq_type#</td><td>#the_date#</td><td>#mag#</td><td class='hide'>#event_id#</td></tr>
            </cfloop>
            </table>
        </cfoutput>
    </cfif>
</cfif>
