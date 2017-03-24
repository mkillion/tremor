<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfquery name="qCount" datasource="plss">
    select
        count(*) as cnt
    from
        swd_wells_test
    where
        #PreserveSingleQuotes(form.where)#
</cfquery>

<cfquery name="qMonthlyVols" datasource="plss">
    select
        distinct month, sum(fluid_injected) over (partition by month) as monthly_volume
    from
        (
        select
            injection_kid, month, fluid_injected
        from
            qualified.injections_months
        where
            injection_kid in
            (select kid from qualified.injections where year = 2015 and well_header_kid in
                (select kid from swd_wells_test where #PreserveSingleQuotes(form.where)#)
            )
        )
    order by month
</cfquery>

<cfoutput>
    [{
        "name": "Total Volume (bbls) for #qCount.cnt# Wells",
        "data": [#ValueList(qMonthlyVols.monthly_volume)#]
    }]
</cfoutput>

<!---
Should look like this:
[{
    name: 'Tokyo',
    data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
}]

--->
