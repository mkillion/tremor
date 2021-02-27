
<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<!--- Reformat where clauses (formatted for FGDB) to a format that works with Oracle SQL: --->
<!--- jointeqwhere: --->
<!--- "This Year" time option selected: --->
<cfif Find('EXTRACT(YEAR FROM " LOCAL_TIME ") = EXTRACT(YEAR FROM CURRENT_DATE)', #form.jointeqwhere#)>
    <cfset form.jointeqwhere = Replace(#form.jointeqwhere#, 'EXTRACT(YEAR FROM " LOCAL_TIME ") = EXTRACT(YEAR FROM CURRENT_DATE)', "to_char(local_time,'YYYY') = to_char(sysdate, 'YYYY')")>
</cfif>

<!--- Past week or month option selected: --->
<cfif Find("CURRENT_DATE", #form.jointeqwhere#)>
    <cfset form.jointeqwhere = Replace(#form.jointeqwhere#, "CURRENT_DATE", "sysdate")>
    <cfset form.jointeqwhere = Replace(#form.jointeqwhere#, "local_time", "cast(local_time as date)")>
</cfif>

<!--- Both from and to date selected: --->
<cfif Find("local_time >= date '", #form.jointeqwhere#) AND Find("local_time <= date '", #form.jointeqwhere#)>
    <cfset form.jointeqwhere = Replace(#form.jointeqwhere#, "local_time >= date '", "trunc(local_time) >= to_date('")>
    <cfset form.jointeqwhere = Replace(#form.jointeqwhere#, " and local_time <= date '", ",'mm/dd/yyyy') and trunc(local_time) <= to_date('")>
    <cfif Find("objectid in", #form.jointeqwhere#)>
        <cfset form.jointeqwhere = Replace(#form.jointeqwhere#, "' and (objectid in", "','mm/dd/yyyy') and (objectid in")>
    <!---<cfelse>
        <cfset form.jointeqwhere = #form.jointeqwhere# & ",'mm/dd/yyyy')">--->
    </cfif>
    <cfif Find(" and magnitude", #form.jointeqwhere#)>
        <cfset form.jointeqwhere = Replace(#form.jointeqwhere#, " and magnitude", ",'mm/dd/yyyy') and magnitude")>
    </cfif>
</cfif>

<!--- Only from date selected: --->
<cfif Find("local_time >= date '", #form.jointeqwhere#) AND NOT Find("local_time <= date '", #form.jointeqwhere#)>
    <cfset form.jointeqwhere = Replace(#form.jointeqwhere#, "local_time >= date '", "trunc(local_time) >= to_date('")>
    <cfset form.jointeqwhere = #form.jointeqwhere# & ",'mm/dd/yyyy')">
</cfif>

<!--- Only to date selected: --->
<cfif NOT Find("local_time >= date '", #form.jointeqwhere#) AND Find("local_time <= date '", #form.jointeqwhere#)>
    <cfset form.jointeqwhere = Replace(#form.jointeqwhere#, "local_time <= date '", "trunc(local_time) <= to_date('")>
    <cfset form.jointeqwhere = #form.jointeqwhere# & ",'mm/dd/yyyy')">
</cfif>
<!--- End reformat jointeqwhere. --->


<!--- Injection query: --->
<!--- NOTE: keep changes to this query synced with createInjectionChartData.cfm --->
<cfif #form.fromdate# neq "">
    <cfset FromYear = Right(#form.fromdate#, 4)>
    <cfset FromMonth = Left(#form.fromdate#, 2)>
</cfif>
<cfif #form.todate# neq "">
    <cfset ToYear = Right(#form.todate#, 4)>
    <cfset ToMonth = Left(#form.todate#, 2)>
</cfif>

<cfif #form.plotc2# eq true AND #form.plotboth# eq false>
    <cfif (isDefined("FromYear") and #FromYear# lt 2015) or (isDefined("ToYear") and #ToYear# lt 2015)>
        <!--- Return ANNUAL volumes. --->
        <cfquery name="qVolumes" datasource="plss">
            select
                distinct ( trunc( to_date('01/15/' || year,'mm/dd/yyyy' ) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS') ) * 24 * 60 * 60 * 1000) as ms,
                sum(total_fluid_volume) over (partition by year) as volume
            from
                qualified.injections
            where
                well_header_kid in ( select kid from swd_wells where #PreserveSingleQuotes(form.injvolwhere)# )
                and
                <cfif isDefined("FromYear") and isDefined("ToYear")>
                    year >= #FromYear# and year <= #ToYear#
                </cfif>
                <cfif isDefined("FromYear") and not isDefined("ToYear")>
                    year >= #fromYear#
                </cfif>
                <cfif not isDefined("FromYear") and isDefined("ToYear")>
                    year <= #toYear#
                </cfif>
                <cfif #form.bbl# neq "">
                    and
                    total_fluid_volume/12 >= #form.bbl#
                </cfif>
            order by ms
        </cfquery>

        <cfquery name="qCount" datasource="plss">
            select
                distinct well_header_kid
            from
                qualified.injections
            where
                well_header_kid in ( select kid from swd_wells where #PreserveSingleQuotes(form.injvolwhere)# )
                and
                <cfif isDefined("FromYear") and isDefined("ToYear")>
                    year >= #FromYear# and year <= #ToYear#
                </cfif>
                <cfif isDefined("FromYear") and not isDefined("ToYear")>
                    year >= #fromYear#
                </cfif>
                <cfif not isDefined("FromYear") and isDefined("ToYear")>
                    year <= #toYear#
                </cfif>
                <cfif #form.bbl# neq "">
                    and
                    total_fluid_volume/12 >= #form.bbl#
                </cfif>
        </cfquery>

        <cfset DateFormat = "%Y">
        <cfset PlotColor = '"rgba(115, 178, 255, 0.85)"'>
    <cfelse>
        <!--- Return MONTHLY volumes. --->
        <cfquery name="qVolumes" datasource="plss">
            select
                distinct (trunc( month_year ) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms,
                sum(fluid_injected) over (partition by month_year) as volume
            from
                mk_class2_injections_months
            where
                well_header_kid in ( select kid from swd_wells where #PreserveSingleQuotes(form.injvolwhere)# )
                and
                <cfif isDefined("FromYear") and isDefined("ToYear")>
                    month_year >= to_date('#FromMonth#/#FromYear#','mm/yyyy') and month_year <= to_date('#ToMonth#/#ToYear#','mm/yyyy')
                </cfif>
                <cfif isDefined("FromYear") and not isDefined("ToYear")>
                    month_year >= to_date('#FromMonth#/#FromYear#','mm/yyyy')
                </cfif>
                <cfif not isDefined("FromYear") and isDefined("ToYear")>
                    month_year <= to_date('#ToMonth#/#ToYear#','mm/yyyy')
                </cfif>
                <cfif #form.bbl# neq "">
                    and
                    fluid_injected >= #form.bbl#
                </cfif>
            order by ms
        </cfquery>

        <cfquery name="qCount" datasource="plss">
            select
                distinct well_header_kid
            from
                mk_class2_injections_months
            where
                well_header_kid in ( select kid from swd_wells where #PreserveSingleQuotes(form.injvolwhere)# )
                and
                <cfif isDefined("FromYear") and isDefined("ToYear")>
                    month_year >= to_date('#FromMonth#/#FromYear#','mm/yyyy') and month_year <= to_date('#ToMonth#/#ToYear#','mm/yyyy')
                </cfif>
                <cfif isDefined("FromYear") and not isDefined("ToYear")>
                    month_year >= to_date('#FromMonth#/#FromYear#','mm/yyyy')
                </cfif>
                <cfif not isDefined("FromYear") and isDefined("ToYear")>
                    month_year <= to_date('#ToMonth#/#ToYear#','mm/yyyy')
                </cfif>
                <cfif #form.bbl# neq "">
                    and
                    fluid_injected >= #form.bbl#
                </cfif>
        </cfquery>

        <cfset DateFormat = "%b %Y">
        <cfset PlotColor = '"rgba(115, 178, 255, 0.85)"'>
    </cfif>
<cfelseif #form.plotc1# eq true AND #form.plotboth# eq false>
    <!--- Plot class1 only: --->
    <cfquery name="qVolumes" datasource="plss">
        select
            (to_date(month || '/15/' || year,'mm/dd/yyyy') - to_date('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms,
            sum(barrels) over (partition by to_date(month || '/' || year, 'mm/yyyy')) as volume
        from
            MK_CLASS1_INJECTIONS_MONTHS
        where
            uic_permit in (select uic_permit from class1_wells where status = 'Drilled' and #PreserveSingleQuotes(c1injvolwhere)#)
            <cfif IsDefined("fromYear") and IsDefined("ToYear")>
                and
                to_date(month || '/' || year, 'mm/yyyy') >= to_date('#FromMonth#/#FromYear#','mm/yyyy')
                and
                to_date(month || '/' || year, 'mm/yyyy') <= to_date('#ToMonth#/#ToYear#','mm/yyyy')
            </cfif>
            <cfif isDefined("FromYear") and not isDefined("ToYear")>
                and
                to_date(month || '/' || year, 'mm/yyyy') >= to_date('#FromMonth#/#FromYear#','mm/yyyy')
            </cfif>
            <cfif not isDefined("FromYear") and isDefined("ToYear")>
                and
                to_date(month || '/' || year, 'mm/yyyy') <= to_date('#ToMonth#/#ToYear#','mm/yyyy')
            </cfif>
            <cfif #form.bbl# neq "">
                and
                barrels >= #form.bbl#
            </cfif>
            <cfif #form.arb#>
                and
                uic_permit in (select uic_permit from class1_wells where status = 'Drilled' and injection_zone = 'Arbuckle')
            </cfif>
        order by
            ms
    </cfquery>

    <!--- Get distinct count: --->
    <cfquery name="qCount" datasource="plss">
        select
            distinct uic_permit
        from
            MK_CLASS1_INJECTIONS_MONTHS
        where
            uic_permit in (select uic_permit from class1_wells where status = 'Drilled' and #PreserveSingleQuotes(c1injvolwhere)#)
            <cfif IsDefined("fromYear") and IsDefined("ToYear")>
                and
                to_date(month || '/' || year, 'mm/yyyy') >= to_date('#FromMonth#/#FromYear#','mm/yyyy')
                and
                to_date(month || '/' || year, 'mm/yyyy') <= to_date('#ToMonth#/#ToYear#','mm/yyyy')
            </cfif>
            <cfif isDefined("FromYear") and not isDefined("ToYear")>
                and
                to_date(month || '/' || year, 'mm/yyyy') >= to_date('#FromMonth#/#FromYear#','mm/yyyy')
            </cfif>
            <cfif not isDefined("FromYear") and isDefined("ToYear")>
                and
                to_date(month || '/' || year, 'mm/yyyy') <= to_date('#ToMonth#/#ToYear#','mm/yyyy')
            </cfif>
            <cfif #form.bbl# neq "">
                and
                barrels >= #form.bbl#
            </cfif>
            <cfif #form.arb#>
                and
                uic_permit in (select uic_permit from class1_wells where status = 'Drilled' and injection_zone = 'Arbuckle')
            </cfif>
    </cfquery>

    <cfset DateFormat = "%b %Y">
    <cfset PlotColor = '"rgba(56, 168, 0, 0.75)"'>

<cfelseif #form.plotboth# eq true>
    <!--- Plot both class1 and class2: --->

</cfif>


<!--- Earthquake query: --->
<!--- NOTE: keep changes to this query synced with createChartData.cfm --->
<cfset Lyrs = ReplaceNoCase(#form.includelayers#, "KGS Permanent Events", "'KGS'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "KGS Preliminary Events", "'EWA'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "Historic Events", "'KSNE'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "NEIC Permanent Events", "'USGS'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "Class 1 Wells", "'C1'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "Class 2 Wells", "'C2'")>

<cfquery name="qLayers" datasource="gis_webinfo">
    select distinct layer
    from tremor_quakes_3857_fgdb
    where layer in (#PreserveSingleQuotes(Lyrs)#)
</cfquery>

<cfset DateToMS = "(trunc(local_time) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000">

<cfloop query="qLayers">
    <cfif #form.type# eq "mag" OR #form.type# eq "joint">
        <cfquery name="q#layer#" datasource="gis_webinfo">
            select
                layer,
                magnitude,
                #PreserveSingleQuotes(DateToMS)# as ms
            from
                tremor_quakes_3857_fgdb
            where
                magnitude is not null
                and
                    layer = '#layer#'
                <cfif #form.jointeqwhere# neq "">
        			and #PreserveSingleQuotes(form.jointeqwhere)#
        		</cfif>
        </cfquery>
    <cfelseif #form.type# eq "jointcount">
        <cfquery name="q#layer#" datasource="gis_webinfo">
            select
                layer,
                count(*) as cnt,
                #PreserveSingleQuotes(DateToMS)# as ms
            from
                tremor_quakes_3857_fgdb
            where
                magnitude is not null
                and
                    layer = '#layer#'
                <cfif #form.where# neq "">
        			and #PreserveSingleQuotes(form.jointeqwhere)#
        		</cfif>
            group by
                layer,
                #PreserveSingleQuotes(DateToMS)#
        </cfquery>
    </cfif>
</cfloop>



<!--- Create JSON: --->
<cfoutput>
    [
        {
            "name": "Total Volume (bbls) for #qCount.recordcount# Wells",
            "type": "area",
            "color": #PlotColor#,
            "yAxis": 1,
            "data": [
                <cfset i = 1>
                <cfloop query="qVolumes">
                    [#ms#,#volume#]
                    <cfif i neq qVolumes.recordcount>
                        ,
                    </cfif>
                    <cfset i = i + 1>
                </cfloop>
            ],
            "tooltip": {
                "headerFormat": "<b>{point.key}</b><br>",
                "pointFormat": "Total BBLS: <b>{point.y}</b>",
                "xDateFormat": "#DateFormat#"
            }
        },

        <cfset j = 1>
        <cfloop query="qLayers">
            <cfset Lyr = #layer#>
            {
            <cfif #layer# eq "KGS">
                "name": "KGS Permanent",
                "type": "scatter",
                "color": "rgba(255,85,0,0.85)",
            <cfelseif #layer# eq "EWA">
                "name": "KGS Preliminary",
                "type": "scatter",
                "color": "rgba(223,115,255,0.85)",
            <cfelseif #layer# eq "USGS">
                "name": "NEIC",
                "type": "scatter",
                "color": "rgba(0,197,255,0.85)",
            <cfelseif #layer# eq "KSNE">
                "name": "Historic",
                "type": "scatter",
                "color": "rgba(76,230,0,0.85)",
            </cfif>

            "data": [
                <cfset i = 1>
                <cfloop query="q#layer#">
                    <cfif #form.type# eq "mag" OR #form.type# eq "joint">
                        [#ms#,#magnitude#]
                    <cfelseif #form.type# eq "count" OR #form.type# eq "jointcount">
                        [#ms#,#cnt#]
                    <cfelseif #form.type# eq "cumulative">
                        [#ms#,#running_total#]
                    </cfif>
                    <cfif i neq Evaluate("q#Lyr#.recordcount")>
                        ,
                    </cfif>
                    <cfset i = i + 1>
                </cfloop>
            ]
            ,
            <cfif #form.type# eq "joint">
                "tooltip": {
                    "headerFormat": "<b>{point.key}</b><br>",
                    "pointFormat": "Magnitude: <b>{point.y}</b>",
                    "xDateFormat": "%b %e, %Y"
                }
            <cfelseif #form.type# eq "jointcount">
                "tooltip": {
                    "headerFormat": "<b>{point.key}</b><br>",
                    "pointFormat": "Count: <b>{point.y}</b>",
                    "xDateFormat": "%b %e, %Y"
                }
            </cfif>
            }
            <cfif j neq qLayers.recordcount>
                ,
            </cfif>
            <cfset j = j + 1>
        </cfloop>
    ]
</cfoutput>



<!--- Should look something like this:
[ {
    "name": "injvols",
    "type": "area",
    "yAxis": 1,
    "data": [ [1421280000000,49.9], [1423958400000,71.5], [1426377600000,106.4], [1429056000000,129.2], [1431648000000,144.0], [1434326400000,176.0], [1436918400000,135.6], [1439596800000,148.5], [1442275200000,216.4], [1444867200000,194.1], [1447545600000,95.6], [1450137600000,54.4] ],
    "tooltip": {
        "valueSuffix": " bbls"
    }

    }, {
        "name": "mags",
        "type": "scatter",
        "data": [ [1421280000000,2.9], [1423958400000,2.5], [1426377600000,3.4], [1429056000000,3.2], [1431648000000,2.0], [1434326400000,3.0], [1436918400000,2.6], [1439596800000,3.5], [1442275200000,2.4], [1444867200000,3.1], [1447545600000,2.6], [1450137600000,2.4],
        [1421539200000,3.0], [1424217600000,4.3], [1434585600000,5.5] ],
        "tooltip": {
            "valueSuffix": " °C"
        }
} ]
--->
