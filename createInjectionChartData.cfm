
<!--- NOTE: keep changes to this query synced with createJointPlotData.cfm --->

<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfif #form.fromdate# neq "">
    <cfset FromYear = Right(#form.fromdate#, 4)>
    <cfset FromMonth = Left(#form.fromdate#, 2)>
</cfif>
<cfif #form.todate# neq "">
    <cfset ToYear = Right(#form.todate#, 4)>
    <cfset ToMonth = Left(#form.todate#, 2)>
</cfif>

<cfif #form.plotc2# eq true AND #form.plotboth# eq false>
    <!--- Plot class2 wells only: --->
    <cfif (isDefined("FromYear") and #FromYear# lt 2015) or (isDefined("ToYear") and #ToYear# lt 2015)>
        <!--- Return ANNUAL volumes. --->
        <cfquery name="qVolumes" datasource="plss">
            select
                distinct ( trunc( to_date('01/15/' || year,'mm/dd/yyyy' ) - TO_DATE('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS') ) * 24 * 60 * 60 * 1000) as ms,
                sum(total_fluid_volume) over (partition by year) as volume
            from
                qualified.injections
            where
                well_header_kid in ( select kid from swd_wells where #PreserveSingleQuotes(form.injvolwhere)# )
                and
                <cfif isDefined("FromYear") and isDefined("ToYear")>
                    year >= #FromYear# and year <= #ToYear#
                </cfif>
                <cfif isDefined("FromYear") and not isDefined("ToYear")>
                    year >= #fromYear#
                </cfif>
                <cfif not isDefined("FromYear") and isDefined("ToYear")>
                    year <= #toYear#
                </cfif>
                <cfif #form.bbl# neq "">
                    and
                    total_fluid_volume/12 >= #form.bbl#
                </cfif>
            order by ms
        </cfquery>

        <!--- Get distinct count: --->
        <cfquery name="qCount" datasource="plss">
            select
                distinct well_header_kid
            from
                qualified.injections
            where
                well_header_kid in ( select kid from swd_wells where #PreserveSingleQuotes(form.injvolwhere)# )
                and
                <cfif isDefined("FromYear") and isDefined("ToYear")>
                    year >= #FromYear# and year <= #ToYear#
                </cfif>
                <cfif isDefined("FromYear") and not isDefined("ToYear")>
                    year >= #fromYear#
                </cfif>
                <cfif not isDefined("FromYear") and isDefined("ToYear")>
                    year <= #toYear#
                </cfif>
                <cfif #form.bbl# neq "">
                    and
                    total_fluid_volume/12 >= #form.bbl#
                </cfif>
        </cfquery>

        <cfset DateFormat = "%Y">
    <cfelse>
        <!--- Return MONTHLY volumes. --->
        <cfquery name="qVolumes" datasource="plss">
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

        <cfquery name="qCount" datasource="plss">
            select
                distinct well_header_kid
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
        </cfquery>

        <cfset DateFormat = "%b %Y">
    </cfif>
<cfelseif #form.plotc1# eq true AND #form.plotboth# eq false>
    <!--- Plot class1 only: --->
    <cfquery name="qVolumes" datasource="plss">
        select
            (to_date(month || '/15/' || year,'mm/dd/yyyy') - to_date('01-01-1970 00:00:00', 'DD-MM-YYYY HH24:MI:SS')) * 24 * 60 * 60 * 1000 as ms,
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

    <!--- Get distinct count: --->
    <cfquery name="qCount" datasource="plss">
        select
            distinct uic_id
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
    </cfquery>

    <cfset DateFormat = "%b %Y">
</cfif>

<cfoutput>
    [
        {
            "name": "Total Volume (bbls) for #qCount.recordcount# Wells",
            "type": "area",
            "yAxis": 1,
            "data": [
                <cfset i = 1>
                <cfloop query="qVolumes">
                    [#ms#,#volume#]
                    <cfif i neq #qVolumes.recordcount#>
                        ,
                    </cfif>
                    <cfset i = i + 1>
                </cfloop>
            ],
            "tooltip": {
                "headerFormat": "<b>{point.key}</b><br>",
                "pointFormat": "Total BBLS: <b>{point.y}</b>",
                "xDateFormat": "#DateFormat#"
            }
        }
    ]
</cfoutput>
