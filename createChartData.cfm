<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfquery name="qLayers" datasource="gis_webinfo">
    select distinct layer
    from tremor_events_dev_only
    where objectid in (select oid from #url.tbl#)
</cfquery>

<cfloop query="qLayers">
    <cfquery name="q#layer#" datasource="gis_webinfo">
        select layer,
        mc,
        (trunc(origin_time) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms
        from tremor_events_dev_only
        where objectid in (select oid from #url.tbl#)
        and mc is not null
        and layer = '#layer#'
    </cfquery>
</cfloop>

<cfoutput>
    [
        <cfset j = 1>
        <cfloop query="qLayers">
            {
            <cfif #layer# eq "KGS">
                "name": "KGS",
                "color": "rgba(255,85,0,0.85)",
            <cfelseif #layer# eq "EWA">
                "name": "KGS Prelim",
                "color": "rgba(223,115,255,0.85)",
            <cfelseif #layer# eq "NEIC">
                "name": "NEIC",
                "color": "rgba(0,197,255,0.85)",
            <cfelseif #layer# eq "OGS">
                "name": "OGS",
                "color": "rgba(114,137,68,0.85)",
            </cfif>

            "data": [
                <cfset i = 1>
                <cfloop query="q#layer#">
                    [#ms#,#mc#]
                    <cfif i neq Evaluate("q#layer#.recordcount")>
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



<!--- This is what it should look like:

[{
"name": "KGS",
"color": "rgba(223,83,83,.5)",
"data": [[1412208000000,2],[1412208000000,3],[1412208000000,2],[1410134400000,2.3],[1410134400000,2.8]]
},
{
"name": "NEIC",
"color": "rgba(0,0,255,.5)",
"data": [[1471361251000,3]]
}]

--->
