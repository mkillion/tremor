<!--- KHRI survey tables: --->
<cfquery name="qGetTables" datasource="kshs_hri">
	select * from user_tables where table_name like 'SRVY_TMP%'
</cfquery>

<cfloop query="qGetTables">
	<cfquery name="qDelTbl" datasource="kshs_hri">
		drop table #table_name#
	</cfquery>
</cfloop>

<!--- Tremor tables: --->
<cfquery name="qGetTables" datasource="plss">
	select * from user_tables where table_name like 'TMP%'
</cfquery>

<cfloop query="qGetTables">
	<cfquery name="qDelTbl" datasource="plss">
		drop table #table_name#
	</cfquery>
</cfloop>

<!--- GIS_WEBINFO Tremor tables: --->
<cfquery name="qGetTables" datasource="gis_webinfo">
	select * from user_tables where table_name like 'TMP%'
</cfquery>

<cfloop query="qGetTables">
	<cfquery name="qDelTbl" datasource="gis_webinfo">
		drop table #table_name#
	</cfquery>
</cfloop>
