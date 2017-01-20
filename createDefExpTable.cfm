<cfsetting requestTimeOut = "180" showDebugOutput = "yes">

<cfset TimeStamp = "#hour(now())##minute(now())##second(now())#">

<cfif isdefined("url.type")>
	<cfset Type = #url.type#>
<cfelse>
	<cfset Type = #form.type#>
</cfif>

<cfset Uid = right(CreateUUID(),16)>
<cfset Uid = replace(#Uid#, "-", "_", "all")>

<cfif #Type# eq "Oil and Gas" OR #Type# eq "Class I Injection" OR #Type# eq "Salt Water Disposal">
	<cfset DS = "plss">
	<cfset tempTable = "TMP_#Uid#">
</cfif>

<cfif #Type# eq "quakes">
	<cfset DS = "tremor">
	<cfset tempTable = "MJKTMP_#Uid#">
</cfif>

<cfquery name="qCreate" datasource="#DS#">
	create table #tempTable#(oid clob)
</cfquery>

<cfquery name="qInsert" datasource="#DS#">
	insert into #tempTable# values('#form.objIds#')
</cfquery>

<!---<cfloop index="i" list="#form.objIds#">
	<cfquery name="qInsert" datasource="#DS#">
		insert into #tempTable# values('#i#')
	</cfquery>
</cfloop>--->

<!--- Return: --->
<cfoutput>
    #tempTable#
</cfoutput>
