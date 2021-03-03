<cfsetting requestTimeOut = "600" showDebugOutput = "yes">

<cfquery name="qGTE2015" datasource="plss">
    SELECT * FROM injection.class_ii_injections_view where year >= 2015
</cfquery>

<cfloop query="qGTE2015">
    <cfset InjKID = #kid#>
    <cfset injections_vol = #total_fluid_volume#>

    <cfquery name="qMonths" datasource="plss">
        select sum(fluid_injected) as months_vol from injection.class_ii_injections_view_months where injection_kid = #InjKID#
    </cfquery>

    <cfif #injections_vol# neq "" and #qMonths.months_vol# neq "" and #injections_vol# neq #qMonths.months_vol#>
        <cfquery name="qWrite" datasource="plss">
            insert into compare_vols values(#InjKID#, #injections_vol#, #qMonths.months_vol#)
        </cfquery>
    </cfif>
</cfloop>
