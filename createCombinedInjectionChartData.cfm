
<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfif #form.fromdate# neq "">
    <cfset FromYear = Right(#form.fromdate#, 4)>
    <cfset FromMonth = Left(#form.fromdate#, 2)>
</cfif>
<cfif #form.todate# neq "">
    <cfset ToYear = Right(#form.todate#, 4)>
    <cfset ToMonth = Left(#form.todate#, 2)>
</cfif>


<!--- Class1 volumes, always monthly: --->
<cfquery name="qC1MonthlyVolumes" datasource="plss">
    select
        (to_date(month || '/' || year,'mm/yyyy') - to_date('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms,
        sum(barrels) over (partition by to_date(month || '/' || year, 'mm/yyyy')) as volume
    from
        tremor.class_1_injection_volumes
    where
        uic_id in (select uic_id from class1_wells where #PreserveSingleQuotes(c1injvolwhere)#)
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
            uic_id in (select uic_id from class1_wells where injection_zone = 'Arbuckle')
        </cfif>
    order by
        ms
</cfquery>


<!--- Class2 MONTHLY volumes. --->
<cfquery name="qC2MonthlyVolumes" datasource="plss">
    select
        distinct (trunc( month_year ) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms,
        sum(fluid_injected) over (partition by month_year) as volume
    from
        mk_injections_months
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


<!--- Create JSON: --->
<cfoutput>
    [
        {
            "name": "Class 1",
            "type": "area",
            "yAxis": 1,
            "color": "rgba(56, 168, 0, 0.75)",
            "data": [
                <cfset i = 1>
                <cfloop query="qC1MonthlyVolumes">
                    [#ms#,#volume#]
                    <cfif i neq #qC1MonthlyVolumes.recordcount#>
                        ,
                    </cfif>
                    <cfset i = i + 1>
                </cfloop>
            ]
        },
        {
            "name": "Class 2",
            "type": "area",
            "yAxis": 1,
            "color": "rgba(115, 178, 255, 0.85)",
            "data": [
                <cfset i = 1>
                <cfloop query="qC2MonthlyVolumes">
                    [#ms#,#volume#]
                    <cfif i neq #qC2MonthlyVolumes.recordcount#>
                        ,
                    </cfif>
                    <cfset i = i + 1>
                </cfloop>
            ]
        }
    ]
</cfoutput>


<!--- Should look something like this (Stacked Area plot):
[ {
    	type: "area",
        yAxis: 1,
        data: [[1421280000000,490], [1423958400000,715], [1426377600000,104], [1429056000000,122]]
    }, {
    	type: "area",
        yAxis: 1,
        data: [[1421280000000,9.9], [1423958400000,71], [1426377600000,106], [1429056000000,29.2]]
    }
]
--->
