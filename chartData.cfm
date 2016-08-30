<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfquery name="qry" datasource="gis_webinfo">
    select layer,
    mc,
    (trunc(origin_time) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms
    from tremor_events_dev_only
    where objectid in (select oid from #url.tbl#)
    and mc is not null
</cfquery>

<cfset i = 1>

<cfoutput>
    [{
        "name": "KGS",
        "color": "rgba(223,83,83,0.7)",
        "data": [
            <cfloop query="qry">
                [#ms#,#mc#]
                <cfif i neq qry.recordcount>
                    ,
                </cfif>
                <cfset i = i + 1>
            </cfloop>
        ]
    }]
</cfoutput>




<!---[{
"name": "KGS",
"color": "rgba(223,83,83,.5)",
"data": [[1412208000000,2],[1412208000000,3],[1412208000000,2],[1410134400000,2.3],[1410134400000,2.8]]
},
{
"name": "NEIC",
"color": "rgba(0,0,255,.5)",
"data": [[1471361251000,3]]
}]--->
