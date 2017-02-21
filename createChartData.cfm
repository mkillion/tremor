<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfquery name="qLayers" datasource="tremor">
    select distinct layer
    from quakes
    <cfif #form.where# neq "">
        where #PreserveSingleQuotes(form.where)#
    </cfif>
</cfquery>

<cfloop query="qLayers">
    <cfif #layer# eq "USGS">
        <cfset MagType = "ml">
    <cfelse>
        <cfset MagType = "mc">
    </cfif>

    <cfif #form.type# eq "mag">
        <cfquery name="q#layer#" datasource="tremor">
            select
                layer,
                #MagType# as magnitude,
                (trunc(origin_time_cst) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms
            from
                quakes
            where
                #MagType# is not null
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
                (trunc(origin_time_cst) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms
            from
                quakes
            where
                #MagType# is not null
                and
                    layer = '#layer#'
                <cfif #form.where# neq "">
        			and #PreserveSingleQuotes(form.where)#
        		</cfif>
            group by
                layer,
                (trunc(origin_time_cst) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000
        </cfquery>
    </cfif>
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
            <cfelseif #layer# eq "USGS">
                "name": "NEIC",
                "color": "rgba(0,197,255,0.85)",
            <cfelseif #layer# eq "OGS">
                "name": "OGS",
                "color": "rgba(114,137,68,0.85)",
            </cfif>

            "data": [
                <cfset i = 1>
                <cfloop query="q#layer#">
                    <cfif #form.type# eq "mag">
                        [#ms#,#magnitude#]
                    <cfelseif #form.type# eq "count">
                        [#ms#,#cnt#]
                    </cfif>
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



<!--- Should look like this:

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
