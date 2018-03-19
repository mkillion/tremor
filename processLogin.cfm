
<cfsetting enablecfoutputonly="true">

<cflogin>
    <cfquery name="qAuthenticate" datasource="gis_webinfo">
		select user_name, pw
		from tremor_users
		where upper(user_name) = '#UCase(form.username)#' and upper(pw) = '#UCase(form.password)#'
	</cfquery>

    <cfif qAuthenticate.recordcount gt 0>
		<cfloginuser name="#qAuthenticate.user_name#" password="#qAuthenticate.pw#" roles="#qAuthenticate.user_name#">
		<cfset session.loggedin = "true">
		<cfoutput>authenticated</cfoutput>
	<cfelse>
		<cfoutput>denied</cfoutput>
	</cfif>
</cflogin>
