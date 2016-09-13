<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfset TimeStamp = "#hour(now())##minute(now())##second(now())#">

<cfif isdefined("url.type")>
	<cfset Type = #url.type#>
<cfelse>
	<cfset Type = #form.type#>
</cfif>

<cfset Uid = right(CreateUUID(),26)>
<cfset Uid = replace(#Uid#, "-", "_", "all")>
<cfset tempTable = "tmp_#Uid#">

<cfif #Type# eq "Oil and Gas" OR #Type# eq "Class I Injection" OR #Type# eq "Salt Water Disposal">
	<cfset DS = "plss">
</cfif>

<cfif #Type# eq "Earthquakes">
	<cfset DS = "gis_webinfo">
</cfif>

<cfquery name="qCreate" datasource="#DS#">
	create table #tempTable#(oid varchar2(20))
</cfquery>

<cfloop index="i" list="#form.objIds#">
	<cfquery name="qInsert" datasource="#DS#">
		insert into #tempTable# values('#i#')
	</cfquery>
</cfloop>

<!--- Return: --->
<cfoutput>
    #tempTable#
</cfoutput>
