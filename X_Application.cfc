
<cfcomponent
	output="false">

	<!--- Define the application settings. --->
	<cfset THIS.Name = "SessionOnlyCookiesTest" />
	<cfset THIS.ApplicationTimeout = CreateTimeSpan( 0, 0, 5, 0 ) />
	<cfset THIS.SessionManagement = true />
	<cfset THIS.SessionTimeout = CreateTimeSpan( 0, 0, 1, 0 ) />

	<!---
		When creating session-only cookies so that the user's
		session ends when the browser is closed, we must turn
		off ColdFusion's automatic cookie storage. If we let
		ColdFusion store the cookies, then it will set an
		expiration date which will cause us trouble.
	--->
	<cfset THIS.SetClientCookies = false />


	<cffunction
		name="OnSessionStart"
		access="public"
		returntype="void"
		output="false"
		hint="Fires when user session initializes (first fun).">

		<!---
			Since we prevented ColdFusion from writing the
			client cookied, we have to take it upon ourselves
			to write the cookies so that the user session will
			hold from page to page. We can use CFCookie to
			create these session-only cookies. By using the
			CFCookie tag without using the Expires attribute,
			it will get the browser to convert the the stored
			cookie values into session-only values.
		--->
		<cfcookie name="CFID" value="#SESSION.CFID#" />
		<cfcookie name="CFTOKEN" value="#SESSION.CFTOKEN#" />

		<!--- Store date the session was created. --->
		<cfset SESSION.DateInitialized = Now() />

		<!--- Return out. --->
		<cfreturn />
	</cffunction>

</cfcomponent>
