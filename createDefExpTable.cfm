<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfset TimeStamp = "#hour(now())##minute(now())##second(now())#">

<cfif isdefined("url.type")>
	<cfset Type = #url.type#>
<cfelse>
	<cfset Type = #form.type#>
</cfif>

<cfif #Type# eq "Oil and Gas" or #Type# eq "Class I Injection">
	<cfset Uid = right(CreateUUID(),16)>
    <cfset tempTable = "tmp_#Uid#">
	<cfquery name="qCreate" datasource="plss">
		create table #tempTable#(kid varchar2(20))
	</cfquery>
	<cfloop index="i" list="#form.kids#">
		<cfquery name="qInsert" datasource="plss">
			insert into #tempTable# values('#i#')
		</cfquery>
	</cfloop>
</cfif>

<cfif #Type# eq "Earthquakes">
	<cfset Uid = right(CreateUUID(),16)>
    <cfset tempTable = "tmp_#Uid#">
	<cfquery name="qCreate" datasource="gis_webinfo">
		create table #tempTable#(event_id varchar2(20))
	</cfquery>
	<cfloop index="i" list="#form.events#">
		<cfquery name="qInsert" datasource="gis_webinfo">
			insert into #tempTable# values('#i#')
		</cfquery>
	</cfloop>
</cfif>

<!--- Return: --->
<cfoutput>
    #tempTable#
</cfoutput>
