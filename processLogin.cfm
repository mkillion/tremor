<cfsetting enablecfoutputonly="true">

<cflogin>
    <cfquery name="qAuthenticate" datasource="gis_webinfo">
		select user_name, pw
		from tremor_users
		where upper(user_name) = '#UCase(form.username)#' and upper(pw) = '#UCase(form.password)#'
	</cfquery>

    <cfif qAuthenticate.recordcount gt 0>
        <cfif #UCase(form.username)# eq "KGS">
            <cfset User = 23>
        <cfelseif #UCase(form.username)# eq "KCC">
            <cfset User = 29>
        <cfelseif #UCase(form.username)# eq "TREMORS">
            <cfset User = 37>
        </cfif>

        <cfset session.auth = True>
        
        <cfif isDefined("url.id")>
            <cflocation url="layout.cfm?n=#User#&type=quake&id=#url.id#">
        <cfelse>
            <cflocation url="layout.cfm?n=#User#">
        </cfif>
	<cfelse>
        <cfset session.auth = False>
        <cflocation url="index.cfm">
	</cfif>
</cflogin>
