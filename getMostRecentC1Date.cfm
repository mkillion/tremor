
<cfquery name="qC1Date" datasource="plss">
    select
        max(year) year,
        max(month) month
    from
        tremor.class_1_injection_volumes
    where
        year = (select max(year) from tremor.class_1_injection_volumes)
</cfquery>

<cfquery name="qC2Date" datasource="plss">
    select
        max(year) year,
        max(month) month
    from
        mk_injections_months
    where
        year = (select max(year) from mk_injections_months)
</cfquery>


<cfoutput>
    C1, #qC1Date.year#, #qC1Date.month#, C2, #qC2Date.year#, #qC2Date.month#
</cfoutput>
