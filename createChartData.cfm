<!--- NOTE: keep changes to this query synced with createJointPlotData.cfm --->

<cfsetting requestTimeOut = "180" showDebugOutput = "yes">


<!--- Reformat where clauses (formatted for FGDB) to a format that works with Oracle SQL: --->
<!--- where: --->
<!--- "This Year" time option selected: --->
<cfif Find('EXTRACT(YEAR FROM " LOCAL_TIME ") = EXTRACT(YEAR FROM CURRENT_DATE)', #form.where#)>
    <cfset form.where = Replace(#form.where#, 'EXTRACT(YEAR FROM " LOCAL_TIME ") = EXTRACT(YEAR FROM CURRENT_DATE)', "to_char(local_time,'YYYY') = to_char(sysdate, 'YYYY')")>
</cfif>

<!--- Past week or month option selected: --->
<cfif Find("CURRENT_DATE", #form.where#)>
    <cfset form.where = Replace(#form.where#, "CURRENT_DATE", "sysdate")>
    <cfset form.where = Replace(#form.where#, "local_time", "cast(local_time as date)")>
</cfif>

<!--- Both from and to date selected: --->
<cfif Find("local_time >= date '", #form.where#) AND Find("local_time <= date '", #form.where#)>
    <cfset form.where = Replace(#form.where#, "local_time >= date '", "trunc(local_time) >= to_date('")>
    <cfset form.where = Replace(#form.where#, " and local_time <= date '", ",'mm/dd/yyyy') and trunc(local_time) <= to_date('")>
    <cfif Find(" and magnitude", #form.where#)>
        <cfset form.where = Replace(#form.where#, " and magnitude", ",'mm/dd/yyyy') and magnitude")>
    <cfelse>
        <cfset form.where = #form.where# & ",'mm/dd/yyyy')">
    </cfif>
</cfif>

<!--- Only from date selected: --->
<cfif Find("local_time >= date '", #form.where#) AND NOT Find("local_time <= date '", #form.where#)>
    <cfset form.where = Replace(#form.where#, "local_time >= date '", "trunc(local_time) >= to_date('")>
    <cfset form.where = #form.where# & ",'mm/dd/yyyy')">
</cfif>

<!--- Only to date selected: --->
<cfif NOT Find("local_time >= date '", #form.where#) AND Find("local_time <= date '", #form.where#)>
    <cfset form.where = Replace(#form.where#, "local_time <= date '", "trunc(local_time) <= to_date('")>
    <cfset form.where = #form.where# & ",'mm/dd/yyyy')">
</cfif>
<!--- End reformat where. --->



<cfset Lyrs = ReplaceNoCase(#form.includelayers#, "KGS Permanent Events", "'KGS'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "KGS Preliminary Events", "'EWA'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "Historic Events", "'KSNE'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "NEIC Permanent Events", "'US'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "Class 1 Wells", "'C1'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "Class 2 Wells", "'C2'")>

<cfquery name="qLayers" datasource="gis_webinfo">
    select distinct layer
    from tremor_quakes_3857_fgdb
    where layer in (#PreserveSingleQuotes(Lyrs)#)
</cfquery>

<cfset DateToMS = "(trunc(local_time) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000">

<cfif #form.type# eq "cumulative">
    <cfquery name="qCumulative" datasource="gis_webinfo">
        select
            ms,
            daily_total,
            sum(daily_total) over (order by ms range unbounded preceding) running_total
        from
            (select #PreserveSingleQuotes(DateToMS)# as ms, count(*) as daily_total
                from tremor_quakes_3857_fgdb
                where layer in (#PreserveSingleQuotes(Lyrs)#)
                <cfif #form.where# neq "">
                    and #PreserveSingleQuotes(form.where)#
                </cfif>
                group by #PreserveSingleQuotes(DateToMS)#)
    </cfquery>

    <cfoutput>
        [
            {
            "name": "All Displayed Events",
            "color": "rgba(0,0,255,0.85)",
                "data": [
                    <cfset i = 1>
                    <cfloop query="qCumulative">
                        [#ms#,#running_total#]
                        <cfif i neq qCumulative.recordcount>
                            ,
                        </cfif>
                        <cfset i = i + 1>
                    </cfloop>
                ]
                }
        ]
    </cfoutput>
<cfelse>
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
                    <cfif #form.where# neq "">
                        and #PreserveSingleQuotes(form.where)#
                    </cfif>
            </cfquery>
        <cfelseif #form.type# eq "count">
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
                        and #PreserveSingleQuotes(form.where)#
                    </cfif>
                group by
                    layer,
                    #PreserveSingleQuotes(DateToMS)#
            </cfquery>
        </cfif>
    </cfloop>

    <cfoutput>
        [
            <cfset j = 1>
            <cfloop query="qLayers">
                <cfset Lyr = #layer#>
                {
                <cfif #layer# eq "KGS">
                    "name": "KGS Permanent",
                    "color": "rgba(255,85,0,0.85)",
                <cfelseif #layer# eq "EWA">
                    "name": "KGS Preliminary",
                    "color": "rgba(223,115,255,0.85)",
                <cfelseif #layer# eq "US">
                    "name": "NEIC",
                    "color": "rgba(0,197,255,0.85)",
                <cfelseif #layer# eq "KSNE">
                    "name": "Historic",
                    "color": "rgba(76,230,0,0.85)",
                </cfif>

                "data": [
                    <cfset i = 1>
                    <cfloop query="q#layer#">
                        <cfif #form.type# eq "mag" OR #form.type# eq "joint">
                            [#ms#,#magnitude#]
                        <cfelseif #form.type# eq "count">
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
                }
                <cfif j neq qLayers.recordcount>
                    ,
                </cfif>
                <cfset j = j + 1>
            </cfloop>
        ]
    </cfoutput>
</cfif>



<!--- Should look something like this:

[{
"name": "KGS",
"color": "rgba(223,83,83,.5)",
"data": [[1412208000000,2],[1412208000000,3],[1412208000000,2],[1410134400000,2.3],[1410134400000,2.8]]
},
{
"name": "USGS",
"color": "rgba(0,0,255,.5)",
"data": [[1471361251000,3]]
}]

--->
