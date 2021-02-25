
<cfquery name="qC1Date" datasource="plss">
    select
        max(year) year,
        max(month) month
    from
        MK_CLASS1_INJECTIONS_MONTHS
    where
        year = (select max(year) from MK_CLASS1_INJECTIONS_MONTHS)
</cfquery>

<cfquery name="qC2Date" datasource="plss">
    select
        max(year) year,
        max(month) month
    from
        mk_class2_injections_months
    where
        year = (select max(year) from mk_class2_injections_months )
</cfquery>


<cfoutput>
    C1,#qC1Date.year#,#qC1Date.month#,C2,#qC2Date.year#,#qC2Date.month#
</cfoutput>
