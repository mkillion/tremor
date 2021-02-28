
<!--- Class I: --->
<cfif #url.welltype# eq "c1">
    <cfquery name="qLastVolume" datasource="plss">
        select
            round(barrels) as last_vol,
            to_char(month_year, 'Mon-yyyy') as last_date
        from
            mk_class1_injections_months
        where
            uic_permit = '#url.wellkid#'
            and
            month_year = (select max(month_year) from mk_class1_injections_months where uic_permit = '#url.wellkid#')
    </cfquery>
</cfif>



<!--- Class II: --->
<cfif #url.welltype# eq "c2">
    <cfquery name="qLastVolume" datasource="plss">
        select
            round(fluid_injected) as last_vol,
            to_char(month_year, 'Mon-yyyy') as last_date
        from
            mk_class2_injections_months
        where
            well_header_kid = #url.wellkid#
            and
            month_year = (select max(month_year) from mk_class2_injections_months where well_header_kid = #url.wellkid#)
    </cfquery>
</cfif>


<cfoutput>
    #qLastVolume.last_vol#,#qLastVolume.last_date#
</cfoutput>
