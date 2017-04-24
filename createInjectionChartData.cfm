
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
        distinct month_year, sum(fluid_injected) over (partition by month_year) as monthly_volume
    from
        mk_injections_months
    where
        well_header_kid in ( select kid from swd_wells where #PreserveSingleQuotes(form.injvolwhere)# )
        ###### PICK UP HERE W/ A CHECK FOR DATE VARS BEING DEFINED #####
        and
        month_year >= to_date('#FromMonth#/#FromYear#','mm/yyyy') and month_year <= to_date('#ToMonth#/#ToYear#','mm/yyyy')

        and
        fluid_injected >= #form.bbl#
    order by month_year
</cfquery>

<cfoutput>
    [{
        "name": "Total Volume (bbls) for #qCount.cnt# Wells",
        "data": [#ValueList(qMonthlyVols.monthly_volume)#]
    }]
</cfoutput>

<!---
Should look like this (series name, data for each month in order. month names are set up in chart js code):
[{
    name: 'Tokyo',
    data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
}]

--->
