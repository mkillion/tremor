
<cfquery name="qFacilities" datasource="plss">
    select '"' || facility_name || '"' as fac from TREMOR.CLASS_1_INJECTION_WELLS order by facility_name
</cfquery>

<cfset F = #ValueList(qFacilities.fac)#>

<cfoutput>#F#</cfoutput>
