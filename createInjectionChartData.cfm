
<!--- NOTE: keep changes to this query synced with createJointPlotData.cfm --->

<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfquery name="qCount" datasource="plss">
    select
        count(*) as cnt
    from
        swd_wells
    where
        #PreserveSingleQuotes(form.injvolwhere)#
</cfquery>

<cfif #form.fromdate# neq "">
    <cfset FromYear = Right(#form.fromdate#, 4)>
    <cfset FromMonth = Left(#form.fromdate#, 2)>
</cfif>
<cfif #form.todate# neq "">
    <cfset ToYear = Right(#form.todate#, 4)>
    <cfset ToMonth = Left(#form.todate#, 2)>
</cfif>

<cfquery name="qMonthlyVols" datasource="plss">
    select
        distinct (trunc( month_year ) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms,
        sum(fluid_injected) over (partition by month_year) as monthly_volume
    from
        mk_injections_months
    where
        well_header_kid in ( select kid from swd_wells where #PreserveSingleQuotes(form.injvolwhere)# )
        and
        month_year >= to_date('#FromMonth#/#FromYear#','mm/yyyy') and month_year <= to_date('#ToMonth#/#ToYear#','mm/yyyy')
        and
        fluid_injected >= #form.bbl#
    order by ms
</cfquery>

<cfoutput>
    [
        {
            "name": "Total Volume (bbls) for #qCount.cnt# Wells",
            "type": "column",
            "yAxis": 1,
            "data": [
                <cfset i = 1>
                <cfloop query="qMonthlyVols">
                    [#ms#,#monthly_volume#]
                    <cfif i neq qMonthlyVols.recordcount>
                        ,
                    </cfif>
                    <cfset i = i + 1>
                </cfloop>
            ],
            "tooltip": {
                "headerFormat": "<b>{point.key}</b><br>",
                "pointFormat": "Total BBLS: <b>{point.y}</b>",
                "xDateFormat": "%b %Y"
            }
        }
    ]
</cfoutput>
