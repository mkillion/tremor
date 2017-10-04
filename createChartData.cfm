<!--- NOTE: keep changes to this query synced with createJointPlotData.cfm --->

<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfset Lyrs = ReplaceNoCase(#form.includelayers#, "KGS Cataloged Events", "'KGS'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "KGS Preliminary Events", "'EWA'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "Historic Events", "'KSNE'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "NEIC Cataloged Events", "'US'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "Class 1 Wells", "'C1'")>
<cfset Lyrs = ReplaceNoCase(#Lyrs#, "Class 2 Wells", "'C2'")>

<cfquery name="qLayers" datasource="tremor">
    select distinct layer
    from quakes
    where layer in (#PreserveSingleQuotes(Lyrs)#)
</cfquery>

<cfset DateToMS = "(trunc(local_time) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000">

<cfif #form.type# eq "cumulative">
    <cfquery name="qCumulative" datasource="tremor">
        select
            ms,
            daily_total,
            sum(daily_total) over (order by ms range unbounded preceding) running_total
        from
            (select #PreserveSingleQuotes(DateToMS)# as ms, count(*) as daily_total
                from quakes
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
            <cfquery name="q#layer#" datasource="tremor">
                select
                    layer,
                    magnitude,
                    #PreserveSingleQuotes(DateToMS)# as ms
                from
                    quakes
                where
                    magnitude is not null
                    and
                        layer = '#layer#'
                    <cfif #form.where# neq "">
                        and #PreserveSingleQuotes(form.where)#
                    </cfif>
            </cfquery>
        <cfelseif #form.type# eq "count">
            <cfquery name="q#layer#" datasource="tremor">
                select
                    layer,
                    count(*) as cnt,
                    #PreserveSingleQuotes(DateToMS)# as ms
                from
                    quakes
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
                    "name": "KGS Cataloged",
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
