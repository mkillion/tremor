
<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<!--- INJECTION VOLS: --->
<cfquery name="qCount" datasource="plss">
    select
        count(*) as cnt
    from
        swd_wells
    where
        #PreserveSingleQuotes(form.where)#
</cfquery>

<!--- NOTE: KEEP CHANGES TO THIS QUERY SYNCED WITH CREATEINJECTIONCHARTDATA.CFM --->
<cfquery name="qMonthlyVols" datasource="plss">
    <!--- this could be simplified - form.where probably duplicates - but it works so, eh --->
    select
        distinct month, sum(fluid_injected) over (partition by month) as monthly_volume,
        (trunc( to_date(month || '/15/#form.year#','mm/dd/yyyy') ) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms
    from
        (
        select
            injection_kid, month, fluid_injected
        from
            qualified.injections_months
        where
            injection_kid in
            (select kid from qualified.injections where year = #form.year# and well_header_kid in
                (select kid from swd_wells where #PreserveSingleQuotes(form.where)#)
            )
        )
    order by month
</cfquery>

<!---<cfoutput>
    [ {
        "name": "Total Volume (bbls) for #qCount.cnt# Wells",
        "type": "area",
        "yAxis": 1,
        "data": [#ValueList(qMonthlyVols.monthly_volume)#],
        "tooltip": {
            "valueSuffix": " bbls"
        }
    } ]
</cfoutput>--->


<!--- test: --->
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
    "data": [ [1421280000000,2.9], [1423958400000,2.5], [1426377600000,3.4], [1429056000000,3.2], [1431648000000,2.0], [1434326400000,3.0], [1436918400000,2.6], [1439596800000,3.5], [1442275200000,2.4], [1444867200000,3.1], [1447545600000,2.6], [1450137600000,2.4] ],
    "tooltip": {
        "valueSuffix": " °C"
    }
} ]



<!--- Should look something like this:
[ {
    "name": "Rainfall",
    "type": "area",
    "yAxis": 1,
    "data": [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4],
    "tooltip": {
        "valueSuffix": " mm"
    }

}, {
    "name": "Temperature",
    "type": "scatter",
    "data": [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6],
    "tooltip": {
        "valueSuffix": " °C"
    }
} ]
--->
