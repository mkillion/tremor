
<cfif #url.get# eq "fac">
    <cfquery name="qFacilities" datasource="plss">
        select
            '"' || facility_name || '"' as fac
        from
            tremor.class_1_injection_wells
        order by
            facility_name
    </cfquery>

    <cfset F = #ValueList(qFacilities.fac)#>

    <cfoutput>#F#</cfoutput>
</cfif>

<cfif #url.get# eq "gname">
    <cfquery name="qGName" datasource="plss">
        select
            '"' || well_name || '"' as gn
        from
            tremor.class_1_injection_wells
        order by
            well_name
    </cfquery>

    <cfset GName = #ValueList(qGName.gn)#>

    <cfoutput>#GName#</cfoutput>
</cfif>
