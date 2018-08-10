<cfsetting enablecfoutputonly="true">

<cflogin>
    <cfquery name="qAuthenticate" datasource="gis_webinfo">
		select user_name, pw
		from tremor_users
		where upper(user_name) = '#UCase(form.username)#' and upper(pw) = '#UCase(form.password)#'
	</cfquery>

    <cfif qAuthenticate.recordcount gt 0>
        <cfset session.auth = True>
        <cfif isDefined("url.id")>
            <cflocation url="layout.cfm?type=quake&id=#url.id#">
        <cfelse>
            <cflocation url="layout.cfm">
        </cfif>
	<cfelse>
        <cfset session.auth = False>
        <cflocation url="index.cfm">
	</cfif>
</cflogin>
