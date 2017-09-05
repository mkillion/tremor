
<cfquery name="qDate" datasource="plss">
    select
        max(year) year,
        max(month) month
    from
        tremor.class_1_injection_volumes
    where
        year = (select max(year) from tremor.class_1_injection_volumes)
</cfquery>

<cfoutput>
    #qDate.year#, #qDate.month#
</cfoutput>
