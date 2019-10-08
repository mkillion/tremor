create or replace package ogf4 as

/*
||  This is the package for making field oil and gas production pages. 
||  Package version created from procedure version in 1998.
||  This package is owned by the OIL user, and also calls
||  some tables in NOMENCLATURE (lease stuff).
||  To run this, make sure ANONYMOUS has EXECUTE access.
||  Call this with a form string like 
||  "https://chasm.kgs.ku.edu/ords/oil.ogf4.ProdQuery"
||
*/
/*
||  old version was 
||  https://chasm.kgs.ku.edu/pls/abyss/ogf4.
||  new version is 
||  https://chasm.kgs.ku.edu/ords/ogf4.
||
||  grant execute on ogf4 to APEX_PUBLIC_USER; (old was ANONYMOUS)
*/


/* Standard web page procedures.
||
||   PROCEDURE WebHeader
||            (dpaNeeded in varchar2 default null,
||             titleText in varchar2 default null);
||
||   FUNCTION FindFieldName 
||            (field_code_sent in varchar2) RETURN varchar2;
||
||   PROCEDURE WebFooter;
||
||   PROCEDURE kgError
||              (useFooter in varchar2,
||               isOther in varchar2, 
||               parFromWeb in varchar2);
||
*/

/* Main query page.  Receives field name or part of name. */

   PROCEDURE ProdQuery
            (FieldName in varchar2 default null,
             IsWholeName in varchar2 default 'Yes');

/* If a field code is sent (DPA pages, County pages) this is main routine */

   PROCEDURE IDProdQuery
            (FieldNumber in varchar2 default null);

/* Select by township-range-section  */

    PROCEDURE FieldByTRS
             (f_town in varchar2 default null,
              f_range in varchar2 default null,
              ew in varchar2 default null,
              f_sect in varchar2 default null);

/* If a name is not correct or user enters part of a name, then  */
/* this routine finds possible field names. */

   PROCEDURE NarrowDown
            (PossibleName in varchar2);

/* Finds production from database after field identified */
/* Actual tables split into two routines. */

   PROCEDURE GetProdID
            (FieldNumber in varchar2);
 
   PROCEDURE FieldProduction
            (PossibleFieldCode in number);

/* These two retrieve accessory field info. */

   PROCEDURE Discovery
            (PossibleFieldCode in number);

   PROCEDURE Counties
             (PossibleFieldCode in number);

   PROCEDURE StatusInfo
             (PossibleFieldCode in number);

   PROCEDURE Formations
            (PossibleFieldCode in number);

   PROCEDURE CommentInfo
            (PossibleFieldCode in number);

   PROCEDURE Locat
            (PossibleFieldCode in number);

   PROCEDURE GasStorage;

   PROCEDURE GSPage
            (f_kid in varchar2);

   PROCEDURE FieldRes
            (f_reserv in varchar2 default null);

   PROCEDURE CntyFix
            (f_c in varchar2 default null);

   PROCEDURE TRS_L;

END ogf4;
/
show errors;

create or replace package body ogf4 as

/*
||  A record is declared globally so that display can be moved out of 
||  the selection programs.
*/

fileHandle1 UTL_FILE.FILE_TYPE;

-----------------------------

PROCEDURE WebHeader
          (dpaNeeded in varchar2 default null,
           titleText in varchar2 default null,
           f_kid in varchar2 default null) as

   dpaURL varchar2(125);

BEGIN

   htp.htmlOpen;
   htp.headOpen;
   htp.title(titleText);
   htp.headClose;

   htp.print ('<BODY bgcolor="#FFFFFF">');
   htp.anchor ('http://www.kgs.ku.edu/index.html', htf.img('http://www.kgs.ku.edu/Magellan/gifs/head/smKGShome2.gif', '', 'KGS Home Page', '', 'width=87 height=49 border=1'));
   htp.anchor ('http://www.kgs.ku.edu/PRS/petroDB.html', htf.img('http://www.kgs.ku.edu/Magellan/gifs/head/smOilGas.gif', '', 'Oil and Gas Index Page', '', 'width=87 height=49 border=1'));
   htp.anchor ('http://www.kgs.ku.edu/Magellan/Field/index.html', htf.img('http://www.kgs.ku.edu/Magellan/Field/smFieldProd.gif', '', 'Field Production Page', '', 'width=87 height=49 border=1'));

   dpaURL := 'https://chasm.kgs.ku.edu/ords/gemini.dpa_general_pkg.build_general_web_page?sFieldKID=' || f_kid;

   IF (dpaNeeded = 'Y') THEN
      htp.anchor (dpaURL, htf.img('http://www.kgs.ku.edu/Magellan/gifs/head/smDPA.gif', '', 'DPA Kansas Page', '', 'width=87 height=49 border=1'));
   END IF;
   htp.header (2, titleText);
   htp.hr;

END WebHeader;

-----------------------------

PROCEDURE WebHeaderGS
          (titleText in varchar2 default null) as

BEGIN

   htp.htmlOpen;
   htp.headOpen;
   htp.title(titleText);
   htp.headClose;

   htp.print ('<BODY bgcolor="#FFFFFF">');
   htp.anchor ('http://www.kgs.ku.edu/index.html', htf.img('http://www.kgs.ku.edu/Magellan/gifs/head/smKGShome2.gif', '', 'KGS Home Page', '', 'width=87 height=49 border=1'));
   htp.anchor ('http://www.kgs.ku.edu/PRS/petroDB.html', htf.img('http://www.kgs.ku.edu/Magellan/gifs/head/smOilGas.gif', '', 'Oil and Gas Index Page', '', 'width=87 height=49 border=1'));
   htp.anchor ('https://chasm.kgs.ku.edu/ords/oil.ogf4.GasStorage', htf.img('http://www.kgs.ku.edu/Magellan/Field/smGasStor.gif', '', 'Gas Storage Fields', '', 'width=87 height=49 border=1'));

   htp.header (2, titleText);
   htp.hr;

END WebHeaderGS;

-------------------------

PROCEDURE WebFooter as

BEGIN

   htp.print ('<hr>Kansas Geological Survey<br>');
   htp.print ('Comments to <a href="mailto:webadmin@kgs.ku.edu">webadmin@kgs.ku.edu</a><br>');
   htp.print ('URL=http://www.kgs.ku.edu/Magellan/Field/index.html<br>');
   htp.print ('Programs Updated Aug. 28, 2014.<br>');
   htp.print ('Data from Kansas Dept. of Revenue files monthly.');
   htp.bodyClose;
   htp.htmlClose;

END WebFooter;

-------------------------

PROCEDURE WebFooterGS as

BEGIN

   htp.print ('<hr>Kansas Geological Survey<br>');
   htp.print ('Comments to webadmin@kgs.ku.edu<br>');
   htp.print ('URL=https://chasm.kgs.ku.edu/ords/oil.ogf4.GasStorage<br>');
   htp.print ('Programs Updated Nov. 2004.<br>');
   htp.print ('General field info courtesy American Gas Association.');
   htp.bodyClose;
   htp.htmlClose;

END WebFooterGS;

-----------------------------------------------------------------------
--  Error message for most exceptions.  Web Header should be already
--  present.  If a footer is needed to error page, first parameter is
--  'Y'.  If the routine is called from a "when others" routine, you can
--  have Oracle print out the specific error message for you.

PROCEDURE kgError
         (useFooter in varchar2,
          isOther in varchar2, 
          parFromWeb in varchar2) as

   err_num number;
   err_msg char(100);

BEGIN

   htp.header (3, parFromWeb);

   IF (isOther = 'Y') THEN
      err_num := SQLCODE;
      err_msg := SUBSTR (SQLERRM, 1, 100);
      htp.nl;
      htp.print (err_num || '--' || err_msg);
   END IF;

   IF (useFooter = 'Y') THEN
      WebFooter;
   END IF;

END kgError;

-----------------------------------------------------------
--  Called to find field name.

FUNCTION FindFieldName 
   (field_code_sent in varchar2) RETURN varchar2
IS

   realFieldName varchar2(40);

BEGIN
            
   select FIELD_NAME into realFieldName
      from nomenclature.fields
      where KID = field_code_sent;

   RETURN realFieldName;
   
EXCEPTION
   
   when others then
      realFieldName := 'Unknown';
      RETURN realFieldName;

end FindFieldName;

--------------------------
--  Called from Magellan page /Field/index.html

PROCEDURE ProdQuery
          (FieldName in varchar2 default null,
           IsWholeName in varchar2 default 'Yes') as

   local_field_code number(10);

   count_returned number(5);
   PossibleName varchar2(40);

   EX_NullParam EXCEPTION;

BEGIN

   IF (FieldName IS NULL) THEN
      RAISE EX_NullParam;
   END IF;

   /*
   ||  First we check if the field they have asked for exists or not.  They
   ||  may have entered only part of a field name, so then the NarrowDown
   ||  routine is called right away.  If they believe they've asked for an
   ||  existing field, but we find there is no field matching the name, then
   ||  we call NarrowDown to see if we find anything.
   */

   IF (IsWholeName = 'No') THEN
      WebHeader ('N', 'KGS--Oil and Gas Production--Narrow Down Fields');
      htp.print ('Will try to identify all fields containing this string: ' || FieldName);
      PossibleName := '%'||UPPER(FieldName)||'%';
      NarrowDown (PossibleName);

   /*
   ||  Other option is that user or other subroutines believe that this 
   ||  is a field name. 
   */

   ELSE
      select count(KID) into count_returned
         from nomenclature.fields
         where upper(FIELD_NAME) = UPPER(FieldName);

   /* No field found that matches exactly in field table. */

      if (count_returned = 0) then
         WebHeader ('N', 'KGS--Oil and Gas Production--Narrow Down Fields');

         htp.print ('No fields found with that exact name: ' || FieldName);
         PossibleName := '%'||UPPER(FieldName)||'%';
         htp.print ('<br>Will try to identify all fields containing this string: ' || FieldName);
         NarrowDown (PossibleName);

   /* Field found in field table */

      else
         select KID into local_field_code
            from nomenclature.fields
            where upper(FIELD_NAME) = UPPER(FieldName);
         GetProdID (local_field_code);

      end if;
   end if;

   WebFooter;

EXCEPTION

   when no_data_found then
      kgError ('Y', 'N', 'No data was returned from the query.');

   when EX_NullParam then
      WebHeader ('N', 'KGS--Oil and Gas Production--Error');
      kgError ('Y', 'N', 'You must enter a value for Field Name. Please try your query again, checking the values.');

   when others then
      kgError ('Y', 'Y', 'An error in the Query Fields by Name routine was detected.');

END ProdQuery;

----------------------------------
--  Called from web pages when the Field ID is known.  
--  Otherwise same as ProdQuery.

PROCEDURE IDProdQuery
         (FieldNumber in varchar2 default null) as

   count_returned number(5);
   PossibleName varchar2(40);

   EX_NullParam EXCEPTION;

BEGIN

   IF (FieldNumber IS NULL) THEN
      RAISE EX_NullParam;
   END IF;

   /*
   ||  This routine assumes that the user has enterted a correct 
   ||  FIELD_CODE based on a previous query or canned package. 
   ||  We will not check for possibility that field doesn't exist.
   */

   select count(KID) into count_returned
      from nomenclature.fields
      where KID = FieldNumber;

   GetProdID (FieldNumber);

/* print standard footer */

   WebFooter;

EXCEPTION

   when no_data_found then
     kgError ('Y', 'N', 'No data was returned from the query.');

   when EX_NullParam then
      WebHeader ('N', 'KGS--Oil and Gas Production--Error');
      kgError ('Y', 'N', 'You must enter a value for Field Name. Please try your query again, checking the values.');

   when others then
      kgError ('Y', 'Y', 'An error in the Query Fields by ID routine was detected.');

end IDProdQuery;

--------------------------
--  Finds Fields using T-R-S search, passes results off to display program.
--  Section is optional.

PROCEDURE FieldByTRS
          (f_town in varchar2 default null,
           f_range in varchar2 default null,
           ew in varchar2 default null,
           f_sect in varchar2 default null) as

   count_returned number(5);
   local_field_code number(10);
   localName varchar2(40);
   urlName varchar2(30);
   anchorURL varchar2(100);

   EX_NullValuesSent EXCEPTION;

   cursor cFull is
      SELECT * from nomenclature.fields NMFD
         WHERE exists (select kid from nomenclature.fields_sections NMFS
            where TOWNSHIP = f_town
            AND RANGE = f_range
            AND RANGE_DIRECTION = ew
            AND SECTION = f_sect
            and NMFS.FIELD_KID = NMFD.KID)
            order by lower (FIELD_NAME);
   rf cFull%ROWTYPE;

   cursor cSmall is
      SELECT * from nomenclature.fields NMFD
         WHERE exists (select kid from nomenclature.fields_sections NMFS
            where TOWNSHIP = f_town
            AND RANGE = f_range
            AND RANGE_DIRECTION = ew
            and NMFS.FIELD_KID = NMFD.KID)
            order by lower (FIELD_NAME);

BEGIN

   /*
   ||  This routine is called from /Magellan/Fields/index.html on Magellan.
   ||  Fields found by searching on location.
   */

      WebHeader ('N', 'KGS--Oil and Gas Production--Narrow Down Fields');

   /*
   ||  Select data based on T-R-S.  All are required for this version.
   ||  First see if any data is present.
   */

   IF (f_town IS NULL) THEN
      RAISE EX_NullValuesSent;
   END IF;
   IF (f_range IS NULL) THEN
      RAISE EX_NullValuesSent;
   END IF;

   IF (f_sect IS NULL) THEN
	   SELECT count(distinct(FIELD_KID)) into count_returned
		  from nomenclature.fields_sections
		  WHERE TOWNSHIP = f_town
		  AND RANGE = f_range
		  AND RANGE_DIRECTION = ew;
   ELSE
	   SELECT count(distinct(FIELD_KID)) into count_returned
		  from nomenclature.fields_sections
		  WHERE SECTION = f_sect
		  AND TOWNSHIP = f_town
		  AND RANGE = f_range
		  AND RANGE_DIRECTION = ew;
   END IF;

   /*
   ||  Have determined if any records exist.
   ||  Will display count, then will start cursor.
   */

   if count_returned = 0 then
      htp.print ('Township: ' || f_town || ', Range: ' || f_range || ew || ', Section: ' || f_sect);
      RAISE no_data_found;
   elsif count_returned = 1 then
      htp.print ('One record found.');
   else
      htp.print (count_returned || ' records returned.');
   end if;

   htp.nl;

/*
||  Cursor find data, another routine displays the data.  Since a database 
||  record (well_rec) was declared globally, the receiving routine will know 
||  about it.
*/


   htp.print ('<table border="1">');
   htp.print ('<tr><th>Field</th><th>Status</th><th>Oil?</th><th>Gas</th></tr>');
   IF (f_sect IS NULL) THEN
	   open cSmall;
	
	   loop
		  fetch cSmall into rf;
		  exit when not cSmall%FOUND;

          localName := INITCAP(rf.FIELD_NAME);
          urlName := rf.KID;
          htp.print ('<tr>');
          anchorURL := 'https://chasm.kgs.ku.edu/ords/oil.ogf4.IDProdQuery?FieldNumber='||urlName;
          htp.print ('<td>');
          htp.anchor(anchorURL, localName);
          htp.print ('</td><td>');
          htp.print(rf.STATUS);
          htp.print ('</td><td>');
          if (rf.PRODUCES_OIL = 'Yes') then
             htp.print ('Oil');
          else
             htp.print ('&nbsp;');
          end if;
          htp.print ('</td><td>');
          if (rf.PRODUCES_GAS = 'Yes') then
             htp.print ('Gas');
          else
             htp.print ('&nbsp;');
          end if;
          htp.print ('</td></tr>');
	
	   END LOOP;                               --  well loop
	   close cSmall;
	   
   ELSE
	   open cFull;
	
	   loop
		  fetch cFull into rf;
		  exit when not cFull%FOUND;
	
          localName := INITCAP(rf.FIELD_NAME);
          urlName := rf.KID;
          htp.print ('<tr>');
          anchorURL := 'https://chasm.kgs.ku.edu/ords/oil.ogf4.IDProdQuery?FieldNumber='||urlName;
          htp.print ('<td>');
          htp.anchor(anchorURL, localName);
          htp.print ('</td><td>');
          htp.print(rf.STATUS);
          htp.print ('</td><td>');
          if (rf.PRODUCES_OIL = 'Yes') then
             htp.print ('Oil');
          else
             htp.print ('&nbsp;');
          end if;
          htp.print ('</td><td>');
          if (rf.PRODUCES_GAS = 'Yes') then
             htp.print ('Gas');
          else
             htp.print ('&nbsp;');
          end if;
          htp.print ('</td></tr>');
	
	   END LOOP;                               --  well loop
	   close cFull;
   END IF;
   htp.print ('</table>');
   htp.nl;

   WebFooter;

EXCEPTION

   when EX_NullValuesSent then
      kgError ('Y', 'N', 'Values MUST be entered for Township, Range, and Section.');

   when no_data_found then
      kgError ('Y', 'N', 'No data was returned from the query.');

   when invalid_number then
      kgError ('Y', 'N', 'Values for Township, Range, and Section must be numbers.  Please try your query again, checking the values.');

   when others then
      kgError ('Y', 'Y', 'An error in the query was detected.');

END FieldByTRS;

-------------------------
--  Narrow down the field name because the user asked for all possibilities
--  or because the exact field name is not found.

PROCEDURE NarrowDown
         (PossibleName in varchar2) as

   localName varchar2(40);
   urlName varchar2(30);

   count_returned number(5);
   anchorURL varchar2(100);

   cursor cFull is
      select *
         from nomenclature.fields
         where upper(FIELD_NAME) LIKE PossibleName
         order by FIELD_NAME;
   row_full cFull%ROWTYPE;

BEGIN

   /*
   ||  This routine is called if the user wants to do a wildcard-type search or
   ||  if an exact search has not been successful.
   */

   htp.br;

   select COUNT(KID) into count_returned
      from nomenclature.fields
      where upper(FIELD_NAME) LIKE PossibleName;

   /*
   ||  First a count is performed to see if we should proceed.
   ||  Limit of 60 is arbitrary.  
   */

   IF (count_returned > 60) THEN
      htp.print('Too many fields found with that search (' || count_returned || ' found).  Please narrow down your search.');
   ELSIF (count_returned = 0) then
      htp.print ('<b>No fields found that match.</b>');
   ELSE
      open cFull;
      loop
         fetch cFull into row_full;
         exit when not cFull%FOUND;

         localName := INITCAP(row_full.FIELD_NAME);
         urlName := row_full.KID;
         htp.print (htf.strong('Field Name: '));
         anchorURL := 'https://chasm.kgs.ku.edu/ords/oil.ogf4.IDProdQuery?FieldNumber='||urlName;
         htp.anchor(anchorURL, localName);
         htp.nl;
      end loop;
      close cFull;
   END IF;

EXCEPTION

   when no_data_found then
      kgError ('N', 'N', 'No data was returned from the query.');

   when others then
      kgError ('N', 'Y', 'An error in the Narrow Down Fields routine was detected.');

END NarrowDown;

-------------------------
--  displays the field page

PROCEDURE GetProdID
         (FieldNumber in varchar2) as

   localStatus varchar2(30);
   localCode number(10);
   localName varchar2(40);
   titleName varChar2(80);
   URL_sent varchar2(180);

   timeSpot number;
   elapsedTime number;
   today_date  DATE;
   three_days_ago DATE;

   dpaCount number(3);
   dpaURL varchar2(125);

BEGIN

   localCode := FieldNumber;

/* Create header information--name, location, discovery, formations, DPA link. */

--   timeSpot := DBMS_UTILITY.GET_TIME;

   select Field_Name, status
      into localName, localStatus
      from nomenclature.fields
      where KID = FieldNumber;
   titleName := INITCAP(localName) || '--Oil and Gas Production';

--   select COUNT(dpa_url) into dpaCount
--      from oil.dpa_url_link
--      where FIELD_KID = localCode;
--   IF (dpaCount = 1) THEN            -- Check for URL to DPA
      WebHeader ('Y', titleName, localCode);
 --     select dpa_url into dpaURL
 --        from oil.dpa_url_link
 --        where FIELD_KID = localCode;
      htp.print('Additional information on this field is available in the');
      dpaURL := 'https://chasm.kgs.ku.edu/ords/gemini.dpa_general_pkg.build_general_web_page?sFieldKID=' || localCode;
      htp.anchor (dpaURL, 'Digital Petroleum Atlas');
      htp.nl;
--   ELSE
--      WebHeader ('N', titleName);
--   END IF;

--   elapsedTime :=  DBMS_UTILITY.GET_TIME - timeSpot;
--   htp.print ('head ' || elapsedTime);
--   htp.print ('<br>');
--   timeSpot := DBMS_UTILITY.GET_TIME;

   Discovery (localCode);
   Counties (localCode);
   URL_sent := 'https://chasm.kgs.ku.edu/ords/oil.ogf4.Locat?PossibleFieldCode=' || localCode;
   htp.anchor2 (URL_sent, 'View Field Boundary', '', '_BNDY');
   htp.print ('<br>');
   StatusInfo (localCode);
   htp.print ('<b>Leases and Wells:</b> ');
   URL_sent := 'https://chasm.kgs.ku.edu/ords/oil.ogl5.FieldLeases?f_field='||localCode;
   htp.anchor(URL_sent, 'View Production by Lease for this Field');
   htp.print (' || ');
   URL_sent := 'https://chasm.kgs.ku.edu/ords/qualified.ogw4.FieldWells?f_fc='||localCode;
   htp.anchor(URL_sent, 'View Wells Assigned to this Field');
   htp.print ('<br>');
   Formations (localCode);
   CommentInfo (localCode);

   htp.print ('<b>Field Map</b> (opens in new window):');
--   htp.print ('<b>Mapping is not working at the moment--Jan. 17, 2005.</b>');
   URL_sent := ('http://maps.kgs.ku.edu/oilgas/index.cfm?extenttype=field&extentvalue=' || localCode);
   htp.anchor2 (URL_sent, 'View Field Map', '', '_FIELD_2002');

--   htp.print ('<br><b>Production Bubble Map</b> (opens in new window, requires Java):');
--   URL_sent := ('http://www.kgs.ku.edu/PRS/Ozark/GBubbleMap/GBubbleMap.html?SQL=' || localCode);
--   htp.anchor2 (URL_sent, 'View Bubble Map', '', '_FIELD_2002');

   htp.hr;
--   elapsedTime :=  DBMS_UTILITY.GET_TIME - timeSpot;
--   htp.print ('info ' || elapsedTime);
--   htp.print ('<br>');
--   timeSpot := DBMS_UTILITY.GET_TIME;

   /*
   ||  Write other header info (translate county code).
   ||  Then call OilProduction to print a table of data.
   */

   FieldProduction (localCode);
--   elapsedTime :=  DBMS_UTILITY.GET_TIME - timeSpot;
--   htp.print ('prod ' || elapsedTime);
--   htp.print ('<br>');

--   today_date := SYSDATE;
--   three_days_ago := today_date - 3;
--   DELETE from graph_data where update_date < three_days_ago;   --->

/* Return to IDFieldQuery.  Footer added there. */

EXCEPTION

   when no_data_found then
      kgError ('N', 'N', 'No data was returned from the query--Main Production.');

   when others then
      kgError ('N', 'Y', 'An error in the Get Production by ID routine was detected.');

END GetProdID;

----------------------------

PROCEDURE FieldProduction
         (PossibleFieldCode in number) as

   current_year  number(4);
   temp_year number(4);
   first_year_found   number(4);
   last_year_found   number(4);
   last_month_found   number(2);
   year_oil_lease_sum   number(10);
   year_oil_wells_sum   number(10);
   year_gas_lease_sum   number(15);
   year_gas_wells_sum   number(10);
   cumulative_oil_total  number(10);
   cumulative_gas_total  number(15);
   startingCumulativeValue  number(10);

-- for graphing
   num_years    number(10);
   graph_o_title   varchar2(250);
   graph_g_title   varchar2(250);
   graph_o_id      number(10);
   graph_g_id      number(10);
   graph_date    DATE;
   graph_label   number(2);
   graph_counter  number(10);
   graph_o_gridlines  number(2);
   graph_g_gridlines  number(2);
   label_counter   number(10);
   label_max    number(15);
   level_range   number(15);
   localName varchar2(40);
   localName2 varchar2(50);
   oil_min   number(10);
   gas_min   number(15);
   oil_max   number(10);
   gas_max   number(15);
   anchorURL varchar2(250);
   oil_count   number(10);
   gas_count   number(10);

   timeSpot number;
   elapsedTime number;

   EX_NoneFound EXCEPTION;

BEGIN

   first_year_found := 9999;
   last_year_found := 0;
   select MIN(year) into temp_year
      from nomenclature.fields_production
      where FIELD_KID = PossibleFieldCode;
   if (temp_year IS NOT NULL) then
      first_year_found := LEAST (first_year_found, temp_year);
   END IF;
   select MAX(year) into temp_year
      from nomenclature.fields_production
      where FIELD_KID = PossibleFieldCode;
   if (temp_year IS NOT NULL) then
      last_year_found := GREATEST (last_year_found, temp_year);
   END IF;

   if (first_year_found = 9999) THEN
      RAISE EX_NoneFound;
   END IF;

   select max(month) into last_month_found 
      from nomenclature.fields_production
      where FIELD_KID = PossibleFieldCode
      and YEAR = last_year_found;

   select Field_Name
      into localName
      from nomenclature.fields
      where KID = PossibleFieldCode;
   select seq_oil_prod_graph.NEXTVAL into graph_o_id from DUAL;
   select seq_oil_prod_graph.NEXTVAL into graph_g_id from DUAL;

   select count(distinct(YEAR)) into num_years
      from nomenclature.fields_production
      where FIELD_KID = PossibleFieldCode;
   select CUM_THRU_1965 into startingCumulativeValue
      from nomenclature.FIELDS
      where KID = PossibleFieldCode;
   label_max := TRUNC (num_years/7);
   if (label_max < 1) then    -->
      label_max := 1;
   end if;
   label_counter := label_max - 1;
   graph_o_title := 'Cum. oil prod., ' || localName || ' (bbl)';
   graph_g_title := 'Cum. gas prod., ' || localName || ' (mcf)';
   select SYSDATE into graph_date from dual;
   if (startingCumulativeValue IS NULL) then
      startingCumulativeValue := 0;
   END IF;

   select count(*) into oil_count
     from nomenclature.FIELDS_PRODUCTION
     where product='O'
     and FIELD_KID = PossibleFieldCode;
   select count(*) into gas_count
     from nomenclature.FIELDS_PRODUCTION
     where product='G'
     and FIELD_KID = PossibleFieldCode;

   htp.print ('<br>');
--   htp.print ('<b><font color="red">Please Note:</font> Production charts are not working (Oct. 8, 2018). Fixing and/or replacing the systems is underway.</b>');
   htp.print ('<b>Flash Charts are working again.</b><br />You may need to grant permission for Flash<br />to run in your web browser.');
   htp.print ('<br>');
   htp.print ('<br>');
   localName2 := ('''' || localName || '''');
   if (oil_count > 1 and gas_count > 1) then
      htp.print ('<b>Production Charts</b><br>');
--      anchorURL := ('http://hercules.kgs.ku.edu/KS_Charts/fields.cfm?f_kid=' || PossibleFieldCode || '&o_id=' || graph_o_id || '&g_id=' || graph_g_id);
--      htp.anchor (anchorURL, 'View Simple JPEG chart');
--      htp.print (' || ');
      anchorURL := ('http://maps.kgs.ku.edu/plots/PlotProduction.html?sType=FIELD&sKID=' || PossibleFieldCode);
      htp.anchor2 (anchorURL, 'View Flash chart', '', '_BLANK');
--      htp.print ('<br>');
--      anchorURL := ('http://www.kgs.ku.edu/software/production/PlotProduction.html?sType=FIELD&sKID=' || PossibleFieldCode);
--      htp.anchor2 (anchorURL, 'Java Chart', '', '_BLANK');
   end if;
   if (oil_count > 1 and gas_count <= 1) then
      htp.print ('<b>Production Charts</b><br>');
--      anchorURL := ('http://hercules.kgs.ku.edu/KS_Charts/fields.cfm?f_kid=' || PossibleFieldCode || '&o_id=' || graph_o_id || '&g_id=-1');
--      htp.anchor (anchorURL, 'View Simple JPEG chart');
--      htp.print (' || ');
      anchorURL := ('http://maps.kgs.ku.edu/plots/PlotProduction.html?sType=FIELD&sKID=' || PossibleFieldCode);
      htp.anchor2 (anchorURL, 'View Flash chart', '', '_BLANK');
--      htp.print ('<br>');
--      anchorURL := ('http://www.kgs.ku.edu/software/production/PlotProduction.html?sType=FIELD&sKID=' || PossibleFieldCode);
--      htp.anchor2 (anchorURL, 'Java Chart', '', '_BLANK');
   end if;
   if (oil_count <= 1 and gas_count > 1) then
      htp.print ('<b>Production Charts</b><br>');
--      anchorURL := ('http://hercules.kgs.ku.edu/KS_Charts/fields.cfm?f_kid=' || PossibleFieldCode || '&o_id=-1&g_id=' || graph_g_id);
--      htp.anchor (anchorURL, 'View Simple JPEG chart');
--      htp.print (' || ');
      anchorURL := ('http://maps.kgs.ku.edu/plots/PlotProduction.html?sType=FIELD&sKID=' || PossibleFieldCode);
      htp.anchor2 (anchorURL, 'View Flash chart', '', '_BLANK');
--      htp.print ('<br>');
--      anchorURL := ('http://www.kgs.ku.edu/software/production/PlotProduction.html?sType=FIELD&sKID=' || PossibleFieldCode);
--      htp.anchor2 (anchorURL, 'Java Chart', '', '_BLANK');
   end if;
   htp.print ('<p>');
--   htp.print (startingCumulativeValue);
--   htp.print ('<p>');
   htp.print ('<table border>');
   htp.print ('<tr>');
   htp.print ('<th rowspan=2>Year</td>');
   htp.print ('<th colspan=3>Oil</td>');
   htp.print ('<th colspan=3>Gas</td>');
   htp.print ('</tr>');
   htp.print ('<tr align="center">');
   htp.print ('<td>Production<br>(bbls)</td>');
   htp.print ('<td>Wells</td>');
   htp.print ('<td>Cumulative<br>(bbls)</td>');
   htp.print ('<td>Production<br>(mcf)</td>');
   htp.print ('<td>Wells</td>');
   htp.print ('<td>Cumulative<br>(mcf)</td>');
   htp.print ('</tr>');

/*
||  Loop from starting year to ending year for this field
*/

--   timeSpot := DBMS_UTILITY.GET_TIME;

   cumulative_oil_total := 0;
   cumulative_oil_total := startingCumulativeValue;
   cumulative_gas_total := 0;
   current_year := first_year_found;
   if (current_year < 1966) then
      current_year := 1966;
   END IF;

   oil_min := 0;
   oil_max := 0;
   gas_min := 0;
   gas_max := 0;
   graph_counter := 0;
   while current_year <= last_year_found loop
      htp.tableRowOpen;
         htp.print ('<td>' || current_year || '</td>');

      select max(WELLS) into year_oil_wells_sum
         from nomenclature.fields_PRODUCTION
         where FIELD_KID = PossibleFieldCode
         and YEAR = current_year
         and PRODUCT = 'O';
      select max(WELLS) into year_gas_wells_sum
         from nomenclature.fields_PRODUCTION
         where FIELD_KID = PossibleFieldCode
         and YEAR = current_year
         and PRODUCT = 'G';
      select sum(PRODUCTION) into year_oil_lease_sum
         from nomenclature.fields_PRODUCTION
         where FIELD_KID = PossibleFieldCode
         and YEAR = current_year
         and PRODUCT = 'O';           
      select sum(PRODUCTION) into year_gas_lease_sum
         from nomenclature.fields_PRODUCTION
         where FIELD_KID = PossibleFieldCode
         and YEAR = current_year
         and PRODUCT = 'G';

      if (current_year = first_year_found) then
         htp.print ('<td align="center">-</td>');
      ELSE
	      if (year_oil_lease_sum IS NULL) then
	         htp.print ('<td align="center">-</td>');
	      ELSE
	         htp.tableData (TO_CHAR(year_oil_lease_sum, '999,999,999'));
	      END IF;
	   END IF;
      if (year_oil_wells_sum IS NULL) then
         htp.print ('<td align="center">-</td>');
      ELSE
         htp.tableData (year_oil_wells_sum);
      END IF;
      if (year_oil_lease_sum IS NOT NULL) THEN
         cumulative_oil_total := cumulative_oil_total + year_oil_lease_sum;
      END IF;
      htp.tableData (TO_CHAR(cumulative_oil_total, '999,999,999'));
      if (current_year = first_year_found) then
         htp.print ('<td align="center">-</td>');
      ELSE
	      if (year_gas_lease_sum IS NULL) then
	         htp.print ('<td align="center">-</td>');
	      ELSE
	         htp.tableData (TO_CHAR(year_gas_lease_sum, '999,999,999,999'));
	      END IF;
	   END IF;
      if (year_gas_wells_sum IS NULL) then
         htp.print ('<td align="center">-</td>');
      ELSE
         htp.tableData (year_gas_wells_sum);
      END IF;
      if (year_gas_lease_sum IS NOT NULL) THEN
         cumulative_gas_total := cumulative_gas_total + year_gas_lease_sum;
      END IF;
      htp.tableData (TO_CHAR(cumulative_gas_total, '999,999,999,999'));
      
      /* insert data into graph table */
      label_counter := label_counter + 1;
      if (label_counter = label_max) then
         graph_label := 1;
         label_counter := 0;
      else
         graph_label := 0;
      end if;
--      insert into GRAPH_DATA
--         values (graph_o_id, graph_counter, 1, current_year, cumulative_oil_total, 
--                 graph_o_title, 1, 1000, 1, 0,
--                 graph_o_gridlines, graph_label, graph_date, localName);
--      insert into GRAPH_DATA
--         values (graph_g_id, graph_counter, 1, current_year, cumulative_gas_total, 
--                 graph_g_title, 1, 1000, 1, 0,
--                 graph_g_gridlines, graph_label, graph_date, localName);
      graph_counter := graph_counter + 1;
      htp.tableRowClose;
      current_year := current_year + 1;
      if (oil_min > cumulative_oil_total) then     -->
         oil_min := cumulative_oil_total;
      end if;
      if (oil_min = 0) then
         oil_min := cumulative_oil_total;
      end if;
      if (oil_max < cumulative_oil_total) then     -->
         oil_max := cumulative_oil_total;
      end if;
      if (gas_min > cumulative_gas_total) then     -->
         gas_min := cumulative_gas_total;
      end if;
      if (gas_min = 0) then     -->
         gas_min := cumulative_gas_total;
      end if;
      if (gas_max < cumulative_gas_total) then     -->
         gas_max := cumulative_gas_total;
      end if;
   end loop;

   htp.tableClose;
   htp.print ('Updated through ' || last_month_found || '-' || last_year_found || '.<br>');
   htp.print ('Note: bbls is barrels; mcf is 1000 cubic feet.<br>');

      level_range := oil_max - oil_min;
      if (level_range <= 10) then     -->
      	oil_max := TRUNC(oil_max) + 1;
      	oil_min := TRUNC(oil_min) - 1;
      	graph_o_gridlines:= oil_max - oil_min -1;
      elsif (level_range > 10 AND level_range <= 1000) then     -->
      	oil_max := (TRUNC(oil_max /10) + 1) * 10;
      	oil_min := (TRUNC(oil_min /10) - 1) * 10;
      	if (oil_min < 0) then     -->
      	   oil_min := 0;
      	end if;
	      level_range := oil_max - oil_min;
	      if (MOD(level_range, 6) = 0) then
	         graph_o_gridlines := 5;
	      elsif (MOD(level_range, 5) = 0) then
	         graph_o_gridlines := 4;
	      elsif (MOD(level_range, 4) = 0) then
	         graph_o_gridlines := 3;
	      elsif (MOD(level_range, 3) = 0) then
	         graph_o_gridlines := 2;
	      else
	         graph_o_gridlines := 5;
	      end if;
      elsif (level_range > 1000) then     -->
      	oil_max := (TRUNC(oil_max /100) + 1) * 100;
      	oil_min := (TRUNC(oil_min /100) - 1) * 100;
      	if (oil_min < 0) then     -->
      	   oil_min := 0;
      	end if;
	      level_range := oil_max - oil_min;
	      if (MOD(level_range, 6) = 0) then
	         graph_o_gridlines := 5;
	      elsif (MOD(level_range, 5) = 0) then
	         graph_o_gridlines := 4;
	      elsif (MOD(level_range, 4) = 0) then
	         graph_o_gridlines := 3;
	      elsif (MOD(level_range, 3) = 0) then
	         graph_o_gridlines := 2;
	      else
	         graph_o_gridlines := 5;
	      end if;
      end if;

      level_range := gas_max - gas_min;
      if (level_range <= 10) then     -->
      	gas_max := TRUNC(gas_max) + 1;
      	gas_min := TRUNC(gas_min) - 1;
      	graph_g_gridlines:= gas_max - gas_min -1;
      elsif (level_range > 10 AND level_range <= 1000) then     -->
      	gas_max := (TRUNC(gas_max /10) + 1) * 10;
      	gas_min := (TRUNC(gas_min /10) - 1) * 10;
      	if (gas_min < 0) then     -->
      	   gas_min := 0;
      	end if;
	      level_range := gas_max - gas_min;
	      if (MOD(level_range, 6) = 0) then
	         graph_g_gridlines := 5;
	      elsif (MOD(level_range, 5) = 0) then
	         graph_g_gridlines := 4;
	      elsif (MOD(level_range, 4) = 0) then
	         graph_g_gridlines := 3;
	      elsif (MOD(level_range, 3) = 0) then
	         graph_g_gridlines := 2;
	      else
	         graph_g_gridlines := 5;
	      end if;
      elsif (level_range > 1000) then     -->
      	gas_max := (TRUNC(gas_max /100) + 1) * 100;
      	gas_min := (TRUNC(gas_min /100) - 1) * 100;
      	if (gas_min < 0) then     -->
      	   gas_min := 0;
      	end if;
	      level_range := gas_max - gas_min;
	      if (MOD(level_range, 6) = 0) then
	         graph_g_gridlines := 5;
	      elsif (MOD(level_range, 5) = 0) then
	         graph_g_gridlines := 4;
	      elsif (MOD(level_range, 4) = 0) then
	         graph_g_gridlines := 3;
	      elsif (MOD(level_range, 3) = 0) then
	         graph_g_gridlines := 2;
	      else
	         graph_g_gridlines := 5;
	      end if;
      end if;

--   update GRAPH_DATA set y_max=oil_max, y_min=oil_min, gridlines=graph_o_gridlines where gr_id=graph_o_id;
--   update GRAPH_DATA set y_max=gas_max, y_min=gas_min, gridlines=graph_g_gridlines where gr_id=graph_g_id;
--   elapsedTime :=  DBMS_UTILITY.GET_TIME - timeSpot;
--   htp.print ('time ' || elapsedTime);

   /*  Footer added in FieldQuery */


EXCEPTION

   when EX_NoneFound then
      htp.print ('There has been no production for this field.<p>');

   when no_data_found then
      kgError ('N', 'N', 'No data was returned from the query--Find Production.');

   when others then
      kgError ('N', 'Y', 'An error in the Find Production routine was detected.');

END FieldProduction;

-------------------------------

PROCEDURE Discovery
     (PossibleFieldCode in number) as

   localName varchar2(60);
   count_returned number(5);
   loop_counter   number(3);
   whole_locat  varchar2(100);

   cursor cDisc is
      SELECT * from nomenclature.FIELDS_DISCOVERY
         WHERE FIELD_KID = PossibleFieldCode
         order by DISCOVERY_DATE ASC;
   rD cDisc%ROWTYPE;

BEGIN

   SELECT count(KID) into count_returned
      from nomenclature.FIELDS_DISCOVERY
      WHERE FIELD_KID = PossibleFieldCode;

   IF (count_returned = 0) THEN
      htp.print ('<b>No discoveries currently in database.</b><br>');
   ELSIF (count_returned = 1) THEN
      htp.print ('<b>Discovery currently listed: </b><br>');
	   open cDisc;
	   loop
	      fetch cDisc into rd;
	      exit when not cDisc%FOUND;

         htp.print ('<table><tr><td><img src="http://www.kgs.ku.edu/Magellan/gifs/spacer.gif" width=30 height=5></td>');
	      htp.print ('<td>');
	      htp.print (htf.strong('Operator: ') || rd.OPERATOR);
		   htp.nl;
		   htp.print (htf.strong('Lease: ') || rd.LEASE_NAME || ', Well ' || rd.LEASE_WELL);
		   htp.nl;
	      whole_locat := (rd.TOWNSHIP || 'S-' || rd.RANGE || rd.RANGE_DIRECTION || ': ' || rd.QUARTER_CALLS || ' ' || rd.SECTION);
		   htp.print (htf.strong('Location: ') || whole_locat);
		   htp.nl;
		   htp.print (htf.strong('Discovery Date: ') || TO_CHAR(rd.DISCOVERY_DATE, 'MM/DD/YYYY'));
		   htp.nl;
		   htp.print (htf.strong('Producing zone: ') || rd.PRODUCING_ZONE);
	      htp.print ('</td>');
	      htp.print ('</tr>');
	      htp.print ('</table>');

      end loop;                            --  location loop
      close cDisc;
   ELSE
      loop_counter := 0;
	   htp.print ('<b>Discoveries currently listed: </b><br>');
	   htp.print ('<table border>');
	   open cDisc;
	   loop
	      fetch cDisc into rd;
	      exit when not cDisc%FOUND;

         loop_counter := loop_counter + 1;
         IF (loop_counter = 1) THEN
            htp.print ('<tr>');
            htp.print ('<td><img src="http://www.kgs.ku.edu/Magellan/gifs/spacer.gif" width=30 height=5></td>');
         END IF;
         htp.print ('<td>');
	      htp.print (htf.strong('Operator: ') || rd.OPERATOR);
		   htp.nl;
		   htp.print (htf.strong('Lease: ') || rd.LEASE_NAME || ', Well ' || rd.LEASE_WELL);
		   htp.nl;
	      whole_locat := (rd.TOWNSHIP || 'S-' || rd.RANGE || rd.RANGE_DIRECTION || ': ' || rd.QUARTER_CALLS || ' ' || rd.SECTION);
		   htp.print (htf.strong('Location: ') || whole_locat);
		   htp.nl;
		   htp.print (htf.strong('Discovery Date: ') || TO_CHAR(rd.DISCOVERY_DATE, 'MM/DD/YYYY'));
		   htp.nl;
		   htp.print (htf.strong('Producing zone: ') || rd.PRODUCING_ZONE);
         htp.print ('</td>');
         IF (loop_counter = 2) THEN
             htp.print ('</tr>');
             loop_counter := 0;
          END IF;

      end loop;                            --  location loop
	   close cDisc;
      IF (loop_counter = 1) THEN
         htp.print ('</tr>');
      END IF;
	   htp.print ('</table>');
   END IF;

   htp.br;

EXCEPTION

   when no_data_found then
      htp.print ('No discovery information at this time.<br>');

   when others then
      kgError ('N', 'Y', 'An error in the Discovery query was detected.');

end Discovery;

-------------------------------
--  Displays county list

PROCEDURE Counties
     (PossibleFieldCode in number) as

   count_returned number(5);
   count_displayed number(3);
   local_county_name VARCHAR2(60);

   cursor cFull is
      select *
         from nomenclature.fields_counties
         where FIELD_KID = PossibleFieldCode;
   rf cFull%ROWTYPE;

BEGIN

   select count(FIELD_KID) into count_returned
      from nomenclature.fields_counties
      where FIELD_KID = PossibleFieldCode;

   IF (count_returned = 0) THEN
      RAISE no_data_found;
   END IF;

   htp.print ('<strong>Counties:</strong> ');
   count_displayed := 0;
   open cFull;
      loop
         fetch cFull into rf;
         exit when not cFull%FOUND;

         select NAME into local_county_name
            from global.counties
            where CODE = rf.COUNTY_CODE;
         count_displayed := count_displayed + 1;
         if (count_displayed < count_returned) then     -->
            htp.print (local_county_name || ', ');
         ELSE
            htp.print (local_county_name);
         END IF;
       end loop;
   close cFull;

   htp.br;

EXCEPTION

   when no_data_found then
      NULL;

   when others then
      kgError ('N', 'Y', 'An error in the County Name query was detected.');

end Counties;

-------------------------------
-- Displays abandoned/revived info.

PROCEDURE StatusInfo
     (PossibleFieldCode in number) as

   count_returned number(5);
   count_displayed number(3);
   local_county_name VARCHAR2(60);

   cursor cStatus is
      SELECT * from nomenclature.FIELDS_STATUS
         WHERE FIELD_KID = PossibleFieldCode
         order by DATE_CHANGED ASC;
   rS cStatus%ROWTYPE;

BEGIN

   select count(FIELD_KID) into count_returned
      from nomenclature.FIELDS_STATUS
      where FIELD_KID = PossibleFieldCode;

   IF (count_returned = 0) THEN
      RAISE no_data_found;
   END IF;

   htp.print ('<strong>Status Info:</strong> ');
   count_displayed := 0;
   open cStatus;
      loop
         fetch cStatus into rS;
         exit when not cStatus%FOUND;

         count_displayed := count_displayed + 1;
         if (count_displayed < count_returned) then     -->
            htp.print (rS.STATUS || ' on ' || TO_CHAR(rS.DATE_CHANGED, 'MM/DD/YYYY') || ', ');
         ELSE
            htp.print (rS.STATUS || ' on ' || TO_CHAR(rS.DATE_CHANGED, 'MM/DD/YYYY'));
         END IF;
       end loop;
   close cStatus;

   htp.br;

EXCEPTION

   when no_data_found then
      NULL;

   when others then
      kgError ('N', 'Y', 'An error in the Abandoned/Revived query was detected.');

end StatusInfo;

--------------------------

PROCEDURE Formations
     (PossibleFieldCode in number) as

   count_returned number(5);
   local_temp   number(5);

   cursor cFull is
      select *
         from nomenclature.fields_reservoirs
         where FIELD_KID = PossibleFieldCode;
   rf cFull%ROWTYPE;

   cursor cTemp is
      select *
         from nomenclature.BHT_FIELDS
         where FIELD_KID = PossibleFieldCode;
   rt cTemp%ROWTYPE;

BEGIN

   select count(KID) into count_returned
      from nomenclature.fields_reservoirs
      where FIELD_KID = PossibleFieldCode;

   IF (count_returned = 0) THEN
      RAISE no_data_found;
   END IF;

   open cTemp;
   fetch cTemp into rt;
   close cTemp;
   local_temp := rt.BHT;
   
   htp.strong('Producing Formations');
   htp.br;
   htp.tableOpen ('border');
   htp.tableRowOpen;
   htp.tableHeader ('Name');
   htp.tableHeader ('Depth (ft.)');
   htp.tableHeader ('Thickness (ft.)');
   htp.tableHeader ('Oil Grav');
   htp.tableHeader ('Produces');
   htp.tableHeader ('Temperature');
   htp.tableRowClose;
   open cFull;
      loop
         fetch cFull into rf;
         exit when not cFull%FOUND;

         htp.tableRowOpen;
         htp.tableData (rf.FORMATION_NAME);
         IF (rf.DEPTH_TOP IS NULL) THEN
            htp.tableData ('-', 'CENTER');
         ELSE
            htp.tableData (rf.DEPTH_TOP, 'RIGHT');
         END IF;
         IF (rf.THICKNESS IS NULL) THEN
            htp.tableData ('-', 'CENTER');
         ELSE
            htp.tableData (rf.THICKNESS, 'RIGHT');
         END IF;
         IF (rf.OIL_GRAVITY_API_AVG IS NULL) THEN
            htp.tableData ('-', 'CENTER');
         ELSE
            htp.tableData (rf.OIL_GRAVITY_API_AVG, 'RIGHT');
         END IF;
         IF (rf.PRODUCES_GAS IS NULL) AND (rf.PRODUCES_OIL IS NULL) THEN
            htp.tableData ('-', 'CENTER');
         ELSIF (rf.PRODUCES_GAS IS NULL) AND (rf.PRODUCES_OIL IS NOT NULL) THEN
            htp.tableData ('Oil', 'LEFT');
         ELSIF (rf.PRODUCES_GAS IS NOT NULL) AND (rf.PRODUCES_OIL IS NULL) THEN
            htp.tableData ('Gas', 'LEFT');
         ELSIF (rf.PRODUCES_GAS IS NOT NULL) AND (rf.PRODUCES_OIL IS NOT NULL) THEN
            htp.tableData ('Oil, Gas', 'LEFT');
         END IF;
         IF (rf.BOTTOM_HOLE_TEMPERATURE IS NULL) THEN
            htp.tableData ('-', 'CENTER');
         ELSE
            htp.tableData (rf.BOTTOM_HOLE_TEMPERATURE, 'LEFT');
         END IF;
         htp.tableRowClose;

       end loop;
   close cFull;

   htp.tableClose;
   htp.nl;

EXCEPTION

   when no_data_found then
      htp.print ('No producing formation information at this time.<br>');

   when others then
      kgError ('N', 'Y', 'An error in the Formations query was detected.');

end Formations;

-------------------------------
--  Displays comments

PROCEDURE CommentInfo
          (PossibleFieldCode in number) as

   count_returned number(5);
   count_displayed number(3);
   local_county_name VARCHAR2(60);

   cursor cFull is
      select *
         from nomenclature.FIELDS_COMMENTS
         where FIELD_KID = PossibleFieldCode;
   rf cFull%ROWTYPE;

BEGIN

   select count(FIELD_KID) into count_returned
      from nomenclature.FIELDS_COMMENTS
      where FIELD_KID = PossibleFieldCode;

   IF (count_returned = 0) THEN
      RAISE no_data_found;
   END IF;

   htp.print ('<strong>Comments:</strong> ');
   count_displayed := 0;
   open cFull;
      loop
         fetch cFull into rf;
         exit when not cFull%FOUND;

         count_displayed := count_displayed + 1;
         if (count_displayed < count_returned) then     -->
            htp.print (rf.COMMENTS || '; ');
         ELSE
            htp.print (rf.COMMENTS);
         END IF;
       end loop;
   close cFull;

   htp.br;

EXCEPTION

   when no_data_found then
      NULL;

   when others then
      kgError ('N', 'Y', 'An error in the County Name query was detected.');

end CommentInfo;

-------------------------------
--  Displays boundary information.

PROCEDURE Locat
          (PossibleFieldCode in number) as

   pass_count   number(5);
   saved_town  number(2);
   saved_range  number(2);
   saved_range_dir varchar2(2);
   localFieldName   varchar2(80);
   whole_locat  varchar2(100);

   cursor cDirect is
      SELECT distinct(RANGE_DIRECTION) cur_range_dir from NOMENCLATURE.fields_sections
         WHERE FIELD_KID = PossibleFieldCode;
   rRD cDirect%ROWTYPE;

   cursor cTown is
      SELECT distinct(TOWNSHIP) cur_township from NOMENCLATURE.fields_sections
         WHERE FIELD_KID = PossibleFieldCode
         AND RANGE_DIRECTION = saved_range_dir
         ORDER BY TOWNSHIP ASC;
   rT cTown%ROWTYPE;

   cursor cRange is
      SELECT distinct(RANGE) cur_range from NOMENCLATURE.fields_sections
         WHERE FIELD_KID = PossibleFieldCode
         AND RANGE_DIRECTION = saved_range_dir
         AND TOWNSHIP = saved_town
         ORDER BY RANGE ASC;
   rR cRange%ROWTYPE;

   cursor cSect2 is
      SELECT * from NOMENCLATURE.fields_sections
         WHERE FIELD_KID = PossibleFieldCode
         AND RANGE_DIRECTION = saved_range_dir
         AND TOWNSHIP = saved_town
         AND RANGE = saved_range
         ORDER BY SECTION ASC;
   rS2 cSect2%ROWTYPE;

BEGIN

   localFieldName := FindFieldName (PossibleFieldCode);
   WebHeader ('N', 'Field Description for ' || localFieldName);
   /*
   || Select all locations for this field.  After all locations are displayed, add a New location option.
   */

   htp.print ('<table border="1" width="500">');
   open cDirect;       --  find unique directions
   loop
      fetch cDirect into rRD;
      exit when not cDirect%FOUND;
      saved_range_dir := rRD.cur_range_dir;
      
      open cTown;         --  find unique townships
      loop
         fetch cTown into rT;
         exit when not cTown%FOUND;
         saved_town := rT.cur_township;

         open cRange;        -- find unique ranges
         loop
            fetch cRange into rR;
            exit when not cRange%FOUND;
            saved_range := rR.cur_range;
            
		      htp.print ('<tr><td>');
		
		      whole_locat := (saved_town || 'S-' || saved_range || saved_range_dir || ': ');
		      htp.print (whole_locat);

            pass_count := 0;
            open cSect2;        -- find all sections
            loop
               fetch cSect2 into rS2;
               exit when not cSect2%FOUND;

               pass_count := pass_count + 1;
               if (pass_count = 1) then
                  htp.print (rS2.QUARTER_CALLS || ' ' || rS2.SECTION);
               ELSE
                  htp.print (', ');
                  htp.print (rS2.QUARTER_CALLS || ' ' || rS2.SECTION);
               END IF;
            end loop;                            --  all sections loop
            close cSect2;

		      htp.print ('</td></tr>');
            
         end loop;                            --  unique range loop
         close cRange;
       end loop;                            --  unique townships loop
       close cTown;
   end loop;                            --  unique directions loop
   close cDirect;
   htp.print ('</table>');

   WebFooter;

EXCEPTION

   when no_data_found then
      NULL;

   when others then
      kgError ('N', 'Y', 'An error in the County Name query was detected.');

end Locat;

-------------------------
--  Displays all of the gas storage fields

PROCEDURE GasStorage as

   titleString   varchar2(200);
   URL_sent      varchar2(200);

   cursor cFull is
      select *
         from nomenclature.GAS_STORAGE_FIELDS
         order by UPPER(STORAGE_FIELD_NAME);
   rf cFull%ROWTYPE;

BEGIN

   titleString := ('Gas Storage Fields in Kansas');

   WebHeaderGS (titleString);
   
   htp.print ('Click on a field''s name to view additional information.');

   htp.print ('<table border="1">');
   htp.print ('<tr>');
   htp.print ('<th>Field Name</th>');
   htp.print ('<th>Operator</th>');
   htp.print ('<th>County</th>');
   htp.print ('</tr>');
   open cFull;
      loop
         fetch cFull into rf;
         exit when not cFull%FOUND;

         htp.print ('<tr>');
         htp.print ('<td>');
         URL_sent := 'https://chasm.kgs.ku.edu/ords/oil.ogf4.GSPage?f_kid=' || rf.KID;
         htp.anchor(URL_sent, rf.STORAGE_FIELD_NAME);
         htp.print ('</td>');
         htp.print ('<td>');
         htp.print (rf.OPERATING_COMPANY);
         htp.print ('</td>');
         htp.print ('<td>');
         htp.print (Qualified.Web_Util.FindCounty(rf.COUNTY_CODE));
         if (rf.COUNTY_CODE_2 IS NOT NULL) then
            htp.print (', ');
            htp.print (Qualified.Web_Util.FindCounty(rf.COUNTY_CODE_2));
         end if;
         htp.print ('</td>');
         htp.print ('</tr>');
       end loop;
   close cFull;
   htp.print ('</table>');

   WebFooterGS;

EXCEPTION

   when others then
      kgError ('N', 'Y', 'An error in the Gas Storage Field routine was detected.');

END GasStorage;

-------------------------
--  Displays the GasStorage page

PROCEDURE GSPage
         (f_kid in varchar2) as

   titleString   varchar2(200);

   cursor cFull is
      select *
         from nomenclature.GAS_STORAGE_FIELDS
         where KID = f_kid;
   rf cFull%ROWTYPE;

BEGIN


   open cFull;
   fetch cFull into rf;
   close cFull;

   titleString := ('Gas Storage Field--' || INITCAP(rf.STORAGE_FIELD_NAME));
   WebHeaderGS (titleString);

   htp.print ('<b>Field name: ');
   htp.print (rf.STORAGE_FIELD_NAME);
   htp.print ('; Operated by');
   htp.print (rf.OPERATING_COMPANY);
   htp.print ('</b><br>Located in: ');
   htp.print (Qualified.Web_Util.FindCounty(rf.COUNTY_CODE));
   if (rf.COUNTY_CODE_2 IS NOT NULL) then
      htp.print (', ');
      htp.print (Qualified.Web_Util.FindCounty(rf.COUNTY_CODE_2));
      htp.print (' counties');
   else
      htp.print (' County');
   end if;

   htp.print ('<p>Reservoir discovered: ');
   htp.print (rf.RESERVOIR_DISCOVERY_YEAR);
   htp.print ('; Year Activated: ');
   htp.print (rf.YEAR_ACTIVATED);
   htp.print ('; Active?: ');
   htp.print (rf.ACTIVE_RESERVIOR);
   htp.print ('<p>Storage Type: ');
   htp.print (rf.STORAGE_TYPE);
   htp.print ('<br>Original Contents: ');
   htp.print (rf.ORIGINAL_CONTENTS);
   htp.print ('; Original Pressure: ');
   htp.print (rf.ORIGINAL_PRESSURE_PSIG);
   htp.print (' (psig); Original reserves: ');
   htp.print (rf.ORIGINAL_RESERVES_MMCF);
   htp.print ('(mmcf)<p>Formation Name: ');
   htp.print (rf.FORMATION_NAME);
   htp.print ('<br>Storage Lithology: ');
   htp.print (rf.STORAGE_LITHOLOGY);
   htp.print ('<br>Gross Thickness: ');
   htp.print (rf.GROSS_THICKNESS_FEET);
   htp.print ('(feet)<br>Trap Type: ');
   htp.print (rf.GEOLOGIC_TRAP_TYPE);
   htp.print ('<br>Formation Depth Maximum: ');
   htp.print (rf.FORMATION_MAXIMUM_DEPTH_TOP);
   htp.print ('; Minimum: ');
   htp.print (rf.FORMATION_MINIMUM_DEPTH_TOP);
   htp.print ('<p>Injection or Withdrawl Wells: ');
   htp.print (rf.INJECTION_OR_WITHDRAWAL_WELLS);
   htp.print ('<br>Observation, Pressure Control Wells: ');
   htp.print (rf.OBSERV_OR_PRESSR_CONTROL_WELLS);
   htp.print ('<br>Compressor Horsepower: ');
   htp.print (rf.COMPRESSOR_HORSEPOWER);
   htp.print ('<br>Pipe Diameter Maximum: ');
   htp.print (rf.PIPE_DIAMETER_MAXIMUM);
   htp.print ('; Minimum');
   htp.print (rf.PIPE_DIAMETER_MINIMUM);
   htp.print ('<p>Base Gas Volume: ');
   htp.print (rf.BASE_GAS_VOLUME_MMCF);
   htp.print ('(mmcf)<br>Maximum Developed Gas Volume: ');
   htp.print (rf.MAX_DEVELOPED_GAS_VOLUME_MMCF);
   htp.print ('(mmcf)<br>Maximum Storage Pressure: ');
   htp.print (rf.STORAGE_PRESSURE_MAX_PSIG_WH);
   htp.print ('(psig)<br>Maximum Daily Delverability: ');
   htp.print (rf.DELIVERABILITY_DAILY_MAX_MCF);
   htp.print ('(mcf)<br>Maximum Designed Daily Volume: ');
   htp.print (rf.MAXIMUM_DESIGN_DAY_VOLUME_MCF);
   htp.print ('(mcf)<br>Annual Cycling Capability: ');
   htp.print (rf.ANNUAL_CYCLING_CAPABILITY);
   htp.print ('<br>Undeveloped Capacity: ');
   htp.print (rf.UNDEVELOPED_CAPACITY_MMCF);
   htp.print ('(mmcf)<br>');
   if (rf.COMMENTS is not NULL) then
      htp.print ('Comments: ');
      htp.print (rf.COMMENTS);
   end if;

   WebFooterGS;

EXCEPTION

   when others then
      kgError ('N', 'Y', 'An error in the Gas Storage Page routine was detected.');

END GSPage;

--------------------------
--  Called from Magellan page /Field/index.html

PROCEDURE FieldRes
          (f_reserv in varchar2 default null) as

   local_field_code number(10);
   count_returned number(5);
   PossibleName varchar2(80);
   URL_sent varchar2(180);

   cursor cFull is
      select *
         from nomenclature.FIELDS QWH
         where exists (select aur.KID from nomenclature.fields_reservoirs AUR 
                       where AUR.FIELD_KID = QWH.KID
                       and lower(FORMATION_NAME) like PossibleName)
         order by lower(field_name);
   rf cFull%ROWTYPE;

   EX_NullParam EXCEPTION;

BEGIN

   IF (f_reserv IS NULL) THEN
      RAISE EX_NullParam;
   END IF;

   PossibleName := REPLACE (f_reserv, '***', ' ');
   WebHeader ('N', 'KGS--Oil and Gas Fields--Reservoir like *' || PossibleName || '*');

   select count(KID) into count_returned
      from nomenclature.FIELDS QWH
      where exists (select aur.KID from nomenclature.fields_reservoirs AUR where AUR.FIELD_KID = QWH.KID);
   if (count_returned = 0) then
      RAISE no_data_found;
   end if;

   PossibleName := ('%' || lower(f_reserv) || '%');
   PossibleName := REPLACE (PossibleName, '***', ' ');

   open cFull;
      loop
         fetch cFull into rf;
         exit when not cFull%FOUND;

         URL_sent := 'https://chasm.kgs.ku.edu/ords/oil.ogf4.IDProdQuery?FieldNumber=' || rf.KID;
         htp.anchor(URL_sent, rf.FIELD_NAME);
         htp.print ('<br>');
       end loop;
   close cFull;

   WebFooter;

EXCEPTION

   when no_data_found then
      kgError ('Y', 'N', 'No data was returned from the query.');

   when EX_NullParam then
      WebHeader ('N', 'KGS--Oil and Gas Production--Error');
      kgError ('Y', 'N', 'You must enter a reservoir name. Please try your query again, checking the value.');

   when others then
      kgError ('Y', 'Y', 'An error in the Query Fields by Reservoir routine was detected.');

END FieldRes;

-------------------------------
--  Displays boundary information.

PROCEDURE CntyFix
          (f_c in varchar2 default null) as

   min_year   number(4);
   min_year_gas   number(4);
   cum_prod   number(15);
   cum_prod1   number(15);
   cum_prodB   number(15);
   cum_prodB1   number(15);
   extra_stuff   number(15);

   cursor cFull is
      SELECT * from NOMENCLATURE.FIELDS NMF
         WHERE web_year_start is NULL
         AND exists (select kid from NOMENCLATURE.FIELDS_COUNTIES NMC where nmf.KID = NMC.FIELD_KID and COUNTY_CODE=f_c)
         ORDER BY LOWER(FIELD_NAME);
   rf cFull%ROWTYPE;

   cursor cProd is
      SELECT sum(production) prod1, year from NOMENCLATURE.FIELDS_PRODUCTION
         WHERE FIELD_KID = RF.KID
         AND PRODUCT = 'O'
         group by year
         ORDER BY YEAR ASC;
   rP cProd%ROWTYPE;

   cursor cBeeneProd is
      SELECT SUM(barrels) barrels from BEENE_FIELDS_66_96_YEARLY
         WHERE FIELD_CODE_BEENE = RF.FIELD_CODE_BEENE
         and YEAR = rP.YEAR;
   rBB cBeeneProd%ROWTYPE;
   cursor cBeene is
      SELECT * from BEENE_FIELDS_66_96
         WHERE FIELD_CODE_BEENE = RF.FIELD_CODE_BEENE;
   rBf cBeene%ROWTYPE;
   cursor cBeene2 is
      SELECT sum(PRODUCTION_THRU_1965) prod from BEENE_FIELDS_66_96
         WHERE FIELD_CODE_BEENE = RF.FIELD_CODE_BEENE;
   rBp cBeene2%ROWTYPE;

BEGIN

   WebHeader ('N', 'Production Fixer');

   open cFull;
   loop
      fetch cFull into rf;
      exit when not cFull%FOUND;

      htp.print ('<table><tr valign="top"><td rowspan="3">Oracle: ');
      htp.print (rf.FIELD_NAME);
      htp.print (' || ');
      htp.print (rf.CUM_THRU_1965);
      htp.print ('<br>Beene: ');

      open cBeene;
      fetch cBeene into rBf;
      close cBeene;
      open cBeene2;
      fetch cBeene2 into rBp;
      close cBeene2;
      htp.print (rBf.FIELD_NAME);
      htp.print (' || ');
      htp.print (rBp.prod);
      htp.print ('<br>');
      htp.print (rf.KID);
      htp.print (' || ');
      htp.print (rf.FIELD_CODE_BEENE);
      htp.print ('<br>');

      cum_prod := 0;
      cum_prodB := 0;
      cum_prod1 := rf.CUM_THRU_1965;
      cum_prodB1 := rf.CUM_THRU_1965;
      if (rf.CUM_THRU_1965 is NULL) then
         cum_prod1 := 0;
         cum_prodB1 := 0;
      end if;
      htp.print ('<table border="1">');
      htp.print ('<tr><td>year</td>');
      htp.print ('<td>annual</td>');
      htp.print ('<td>annual Beene</td>');
      htp.print ('<td>no cum</td>');
      htp.print ('<td>cum</td>');
      htp.print ('</tr>');
      open cProd;
      loop
         fetch cProd into rP;
         exit when not cProd%FOUND;

         open cBeeneProd;
         fetch cBeeneProd into rBB;
         close cBeeneProd;
         htp.print ('<tr>');
         htp.print ('<td>');
         htp.print (rP.year);
         htp.print ('</td>');
         cum_prod := cum_prod + rP.prod1;
         cum_prod1 := cum_prod1 + rP.prod1;
         cum_prodB := cum_prodB + rBB.barrels;
         cum_prodB1 := cum_prodB1 + rBB.barrels;
         htp.print ('<td>');
         htp.print (rP.prod1);
         htp.print ('</td>');
         htp.print ('<td>');
         htp.print (rBB.barrels);
         htp.print ('</td>');
         htp.print ('<td>');
         htp.print (cum_prod);
         htp.print ('</td>');
         htp.print ('<td>');
         htp.print (cum_prod1);
         htp.print ('</td>');
         htp.print ('</tr>');
      end loop;
      close cProd;
      htp.print ('</table>');

      select sum(barrels) into extra_stuff
         from BEENE_FIELDS_66_96_YEARLY 
         where FIELD_CODE_BEENE=RF.FIELD_CODE_BEENE 
         and year in (1966, 1967, 1968, 1969);
      if (extra_stuff is NULL) then
         extra_stuff := 0;
      end if;

      htp.print ('</td><td>');
---------------------------
       SELECT MIN(YEAR) into min_year
         from NOMENCLATURE.FIELDS_PRODUCTION
         WHERE FIELD_KID = RF.KID
         AND PRODUCT = 'O';
       SELECT MIN(YEAR) into min_year_gas
         from NOMENCLATURE.FIELDS_PRODUCTION
         WHERE FIELD_KID = RF.KID
         AND PRODUCT = 'G';
       if (min_year_gas < min_year) then 
	      htp.print ('<font color="red">Gas: ' || min_year_gas || '</font><br>');
	   else
	      htp.print ('Gas: ' || min_year_gas || '<br>');
	   end if;
	   htp.formOpen ('https://chasm.kgs.ku.edu/ords/nmc.SaveFix');
	
	   htp.formHidden ('f_id', RF.KID);
	   htp.formHidden ('f_c', f_c);
       htp.print ('<br>');
	   htp.formText('f_yr', 6, 6, min_year);
	   htp.print('<br>');
	   if (rf.CUM_THRU_1965 is NULL) then
	      htp.formText('f_pd', 12, 12, '0');
	   else
	      htp.formText('f_pd', 12, 12, rf.CUM_THRU_1965);
	   end if;
	   htp.print('Cum thru 65<br>');
	   htp.formText('f_pd2', 12, 12, extra_stuff);
	   htp.print('1966 to 69<br>');
	   htp.formText('f_cm', 30, 30, 'Cumulative since discovery.');
	   htp.print('<br>');
	
	   htp.print ('<input type="submit" value="Change" />');
	   htp.formClose;

      htp.print ('</td><td>');
---------------------------
       if (min_year_gas < min_year) then 
	      htp.print ('<font color="red">Gas: ' || min_year_gas || '</font>');
	   else
	      htp.print ('Gas: ' || min_year_gas);
	   end if;
	   htp.formOpen ('https://chasm.kgs.ku.edu/ords/nmc.SaveFix');
	
	   htp.formHidden ('f_id', RF.KID);
	   htp.formHidden ('f_c', f_c);
       htp.print ('<br>');
	   htp.formText('f_yr', 6, 6, min_year);
	   htp.print('<br>');
	   if (rf.CUM_THRU_1965 is NULL) then
	      htp.formText('f_pd', 12, 12, '0');
	   else
	      htp.formText('f_pd', 12, 12, rf.CUM_THRU_1965);
	   end if;
	   htp.print('<br>');
	   htp.formText('f_pd2', 12, 12, extra_stuff);
	   htp.print('<br>');
	   htp.formText('f_cm', 30, 30, 'Cumulative since 1944.');
	   htp.print('<br>');
	
	   htp.print ('<input type="submit" value="Change" />');
	   htp.formClose;

      htp.print ('</td></tr><tr valign="top"><td>');
---------------------------
	   htp.formOpen ('https://chasm.kgs.ku.edu/ords/nmc.SaveFix');
	
	   htp.formHidden ('f_id', RF.KID);
	   htp.formHidden ('f_c', f_c);
       htp.print ('<br>');
	   htp.formText('f_yr', 6, 6, '0');
	   htp.print('<br>');
	   htp.formText('f_pd', 12, 12, '0');
	   htp.print('<br>');
	   htp.formText('f_pd2', 12, 12, '0');
	   htp.print('<br>');
	   htp.formText('f_cm', 30, 30, 'Cumulative since discovery.');
	   htp.print('<br>');
	
	   htp.print ('<input type="submit" value="Change" />');
	   htp.formClose;

      htp.print ('</td><td>&nbsp;');
      htp.print ('</td></tr><tr valign="top"><td>');
---------------------------
	   htp.formOpen ('https://chasm.kgs.ku.edu/ords/nmc.SaveProdFix');
	
	   htp.formHidden ('f_id', RF.KID);
	   htp.formHidden ('f_c', f_c);
       htp.print ('<br>Year: ');
	   htp.formText('f_yr', 6, 6);
	   htp.print('<br>Production: ');
	   htp.formText('f_pd', 12, 12);
	   htp.print('<br>Wells: ');
	   htp.formText('f_wl', 12, 12);
	   htp.print('<br>');
	
	   htp.print ('<input type="submit" value="Add" />');
	   htp.formClose;

      htp.print ('</td><td>');
---------------------------
	   htp.formOpen ('https://chasm.kgs.ku.edu/ords/nmc.SaveCum');
	
	   htp.formHidden ('f_id', RF.KID);
	   htp.formHidden ('f_c', f_c);
	   htp.print('<br>New Cumulative: ');
	   htp.formText('f_pd', 12, 12);
	   htp.print('<br>');
	
	   htp.print ('<input type="submit" value="Change" />');
	   htp.formClose;


      htp.print ('</td></tr></table>');

   end loop;
   close cFull;

   WebFooter;

EXCEPTION

   when others then
      kgError ('N', 'Y', 'An error in the County Name query was detected.');

end CntyFix;

-------------------------------
--  Find distinct township-range-sect for all leases.
--  For John Dunham and Mike Killion

PROCEDURE TRS_L is

   local_cumulative_production NUMBER(12,2);
   
   cursor cOil is
      SELECT distinct township, range, range_direction, section 
         from NOMENCLATURE.LEASES NMLT
         where PRODUCES_OIL = 'Yes'
         and state_code=15
         ORDER BY range_direction, township, range, section;
   rf cOil%ROWTYPE;

   cursor cGas1 is
      SELECT distinct township, range, range_direction, section 
         from NOMENCLATURE.LEASES NMLT
         where PRODUCES_GAS = 'Yes'
         and state_code=15
         ORDER BY range_direction, township, range, section;

   cursor cGas is
      SELECT distinct township, range, range_direction, section 
         from NOMENCLATURE.LEASES NMLT
         where PRODUCES_GAS = 'Yes'
         and state_code=15
         and field_kid NOT in (1028645832, 1028645850)
         ORDER BY range_direction, township, range, section;

   cursor cCBM is
      SELECT distinct township, range, range_direction, section 
         from NOMENCLATURE.LEASES NMLT
         where PRODUCES_GAS = 'Yes'
         and state_code=15
         and field_kid in (1028645832, 1028645850)
         ORDER BY range_direction, township, range, section;

BEGIN

   WebHeader ('N', 'TRS Finder');

--  delete from nomenclature.oil_prod_t_r_s;
--  delete from nomenclature.gas_prod_t_r_s;
--  delete from nomenclature.gas_no_cbm_prod_t_r_s;
--  delete from nomenclature.cbm_prod_t_r_s;
--  commit;
--  execute oil.ogf4.TRS_L

--  set pause off;
--  spool oil_prod_TRS_01_2019.txt
--  select * from nomenclature.oil_prod_t_r_s ORDER BY range_direction, township, range, section;

--  set pause off;
--  spool gas_prod_TRS_01_2019.txt
--  select * from nomenclature.gas_prod_t_r_s ORDER BY range_direction, township, range, section;

--  set pause off;
--  spool gas_no_cbm_prod_TRS_01_2019.txt
--  select * from nomenclature.gas_no_cbm_prod_t_r_s ORDER BY range_direction, township, range, section;

--  set pause off;
--  spool CBM_prod_TRS_01_2019.txt
--  select * from nomenclature.cbm_prod_t_r_s ORDER BY range_direction, township, range, section;


   htp.print ('Oil<br />');
   open cOil;
   loop
      fetch cOil into rf;
      exit when not cOil%FOUND;

      select sum(CUMULATIVE_PRODUCTION) into local_cumulative_production
         from NOMENCLATURE.LEASES
         where township=rf.township and range=rf.range and 
               range_direction=rf.range_direction
               and section=rf.section
               and state_code=15
               and PRODUCES_OIL = 'Yes';

      insert into nomenclature.oil_prod_t_r_s 
          (township, township_direction, range, range_direction, 
           section, cumulative_production)
           values
          (rf.township, 'S', rf.range, rf.range_direction,
           rf.section, local_cumulative_production);
   end loop;
   close cOil;

   htp.print ('Gas<br />');
   open cGas1;
   loop
      fetch cGas1 into rf;
      exit when not cGas1%FOUND;

      select sum(CUMULATIVE_PRODUCTION) into local_cumulative_production
         from NOMENCLATURE.LEASES
         where township=rf.township and range=rf.range and 
               range_direction=rf.range_direction
               and section=rf.section
               and state_code=15
               and PRODUCES_GAS = 'Yes';

      insert into nomenclature.gas_prod_t_r_s 
          (township, township_direction, range, range_direction, 
           section, cumulative_production)
           values
          (rf.township, 'S', rf.range, rf.range_direction,
           rf.section, local_cumulative_production);
   end loop;
   close cGas1;

   htp.print ('No CBM<br />');
   open cGas;
   loop
      fetch cGas into rf;
      exit when not cGas%FOUND;
  
      select sum(CUMULATIVE_PRODUCTION) into local_cumulative_production
         from NOMENCLATURE.LEASES
         where township=rf.township and range=rf.range and 
               range_direction=rf.range_direction
               and section=rf.section
               and state_code=15
               and PRODUCES_GAS = 'Yes'
               and field_kid NOT in (1028645832, 1028645850);
  
      insert into nomenclature.gas_no_cbm_prod_t_r_s 
          (township, township_direction, range, range_direction, 
           section, cumulative_production)
           values
          (rf.township, 'S', rf.range, rf.range_direction,
           rf.section, local_cumulative_production);
   end loop;
   close cGas;

  htp.print ('CBM<br />');
  open cCBM;
  loop
      fetch cCBM into rf;
      exit when not cCBM%FOUND;
  
      select sum(CUMULATIVE_PRODUCTION) into local_cumulative_production
         from NOMENCLATURE.LEASES
         where township=rf.township and range=rf.range and 
               range_direction=rf.range_direction
               and section=rf.section
               and state_code=15
               and PRODUCES_GAS = 'Yes'
               and field_kid in (1028645832, 1028645850);
  
      insert into nomenclature.cbm_prod_t_r_s 
          (township, township_direction, range, range_direction, 
          section, cumulative_production)
          values
          (rf.township, 'S', rf.range, rf.range_direction,
          rf.section, local_cumulative_production);
  end loop;
  close cCBM;

   WebFooter;

EXCEPTION

   when others then
      kgError ('N', 'Y', 'An error in the Find T-R-S query was detected.');

end TRS_L;

END ogf4;
/
show errors;
