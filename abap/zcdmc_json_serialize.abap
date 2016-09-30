*&---------------------------------------------------------------------*
*& Report  ZCDMC_JSON_SERIALIZE
*&
*&---------------------------------------------------------------------*
*&
*&
*&---------------------------------------------------------------------*

REPORT  zcdmc_json_serialize.

* CA: CNVCDMCCA_OBJS (Detail View)
* UCIA: CNVCDMCUCIA_OBJS (Compressed View)

DATA:
   it_caobjs TYPE STANDARD TABLE OF cnvcdmcca_objs,
   l_serializer TYPE REF TO cl_trex_json_serializer,
   json_c       TYPE string,
   json_x       TYPE xstring,
   it_json_c    TYPE STANDARD TABLE OF string,
   ld_filename  TYPE string,
   ld_path      TYPE string,
   ld_fullpath  TYPE string,
   ld_result    TYPE i,
   json_writer  TYPE REF TO cl_sxml_string_writer,
   writer       TYPE REF TO if_sxml_writer,
   dl_flag      TYPE c,
   wa_ucia_objs LIKE cnvcdmcucia_objs.

TYPES : BEGIN OF ys_output_tmp.
        INCLUDE STRUCTURE cnvcdmcucia_objs.
*   { +SM13032009:Change of Code for EhP2 UCIA requirement 5.1.1
*  TYPES : ref_obj_type TYPE cnvcdmc_ref_object,
TYPES : as4pos  TYPE ddposition,
iter_count      TYPE cnvcdmcucia_iter_count,
ref_obj_type    TYPE cnvcdmc_ref_object,
*     +SM13032009 }
severity_sap TYPE cnvcdmc_severity ,
ref_obj_name TYPE cnvcdmc_obj_nam,
*   { -SP25022011 To hide the coloumns due to memory problem
*  ref_sub_type TYPE trobjtype,
*  ref_sub_name TYPE cnvcdmc_obj_nam,
*   -SP25022011 }
cust_sev_text(12) TYPE c ,
sap_sev_text(30)  TYPE c ,
adjtime_sap TYPE cnvcdmcucia_adj_time,
*   { -SP25022011 To hide the coloumns due to memory problem
*  reason_category TYPE cnvcdmcucia_res_category,
*   -SP25022011 }
reason1         TYPE char200,
*   { -SP25022011 To hide the coloumns due to memory problem
*  reason2         TYPE char200,
*  other_reasons   TYPE char255,
*   -SP25022011 }
reason_sap(10)  TYPE c ,
reason(10)      TYPE c ,
status_sap      TYPE cnvcdmcucia_status,
comment_sap     TYPE cnvcdmc_comment,
*   { -SP25022011 To hide the coloumns due to memory problem
*  addl_comment_sap TYPE cnvcdmcucia_addl_comment,
*   -SP25022011 }
cellstyles      TYPE lvc_t_styl,
*   { +AV 21.05.2009 : CDMC : Phase2-WP8
solar_object    TYPE cnvcdmc_projhier-solar_object,
solman_obj_desc TYPE cnvcdmc_projhier-solman_obj_desc,
solman_obj_type TYPE cnvcdmc_projhier-solman_obj_type,
bus_scenario    TYPE cnvcdmc_projhier-bus_scenario,
bus_process     TYPE cnvcdmc_projhier-bus_process,
bus_prcstep     TYPE cnvcdmc_projhier-bus_prcstep,
refobj_tbom_flag TYPE cnvcdmc_refobjs-refobj_tbom_flag,
ref_obj_top_down TYPE cnvcdmc_refobjs-ref_obj_top_down,
main_obj_not_exi TYPE cnvcdmc_refobjs-main_obj_not_exi,
anal_sysid       TYPE cnvcdmc_refobjs-anal_sysid,
*    +AV 21.05.2009 : CDMC : Phase2-WP8 }
counter TYPE i, "+kv17062009 to get count of objects
freq_count TYPE i, "KV03082009 for frequency count of used objs.
call_date TYPE d,     "SK19062014 for last used date
END OF ys_output_tmp.

TYPES : BEGIN OF ys_output.
        INCLUDE STRUCTURE cnvcdmcucia_objs.
*     { +SM13032009:Change of Code for EhP2 UCIA requirement 5.1.1
*    TYPES : ref_obj_type TYPE cnvcdmc_ref_object,
TYPES : as4pos  TYPE ddposition,
iter_count      TYPE cnvcdmcucia_iter_count,
ref_obj_type    TYPE cnvcdmc_ref_object,
*       +SM13032009 }
severity_sap TYPE cnvcdmc_severity ,
ref_obj_name TYPE cnvcdmc_obj_nam,
*     { -SP25022011 To hide the coloumns due to memory problem
*    ref_sub_type TYPE trobjtype,
*    ref_sub_name TYPE cnvcdmc_obj_nam,
*     -SP25022011 }
cust_sev_text(12) TYPE c ,
sap_sev_text(30)  TYPE c ,
adjtime_sap TYPE cnvcdmcucia_adj_time,
*     { -SP25022011 To hide the coloumns due to memory problem
*    reason_category TYPE cnvcdmcucia_res_category,
*     -SP25022011 }
reason1         TYPE char200,
*     { -SP25022011 To hide the coloumns due to memory problem
*    reason2         TYPE char200,
*    other_reasons   TYPE char255,
*     -SP25022011 }
reason_sap(10)  TYPE c ,
reason(10)      TYPE c ,
status_sap      TYPE cnvcdmcucia_status,
comment_sap     TYPE cnvcdmc_comment,
*     { -SP25022011 To hide the coloumns due to memory problem
*    addl_comment_sap TYPE cnvcdmcucia_addl_comment,
*     -SP25022011 }
*cellstyles      TYPE lvc_t_styl,
*     { +AV 21.05.2009 : CDMC : Phase2-WP8
solar_object    TYPE cnvcdmc_projhier-solar_object,
solman_obj_desc TYPE cnvcdmc_projhier-solman_obj_desc,
solman_obj_type TYPE cnvcdmc_projhier-solman_obj_type,
bus_scenario    TYPE cnvcdmc_projhier-bus_scenario,
bus_process     TYPE cnvcdmc_projhier-bus_process,
bus_prcstep     TYPE cnvcdmc_projhier-bus_prcstep,
refobj_tbom_flag TYPE cnvcdmc_refobjs-refobj_tbom_flag,
ref_obj_top_down TYPE cnvcdmc_refobjs-ref_obj_top_down,
main_obj_not_exi TYPE cnvcdmc_refobjs-main_obj_not_exi,
anal_sysid       TYPE cnvcdmc_refobjs-anal_sysid,
*      +AV 21.05.2009 : CDMC : Phase2-WP8 }
counter TYPE i, "+kv17062009 to get count of objects
freq_count TYPE i, "KV03082009 for frequency count of used objs.
call_date TYPE d,     "SK19062014 for last used date
END OF ys_output.


DATA: it_ucia_tmp      TYPE TABLE OF ys_output_tmp,
      it_ucia_comp_tmp TYPE TABLE OF ys_output_tmp,
      it_ucia          TYPE TABLE OF ys_output,
      it_ucia_comp     TYPE TABLE OF ys_output,
      wa_ucia          TYPE ys_output.

FIELD-SYMBOLS: <it_ucia> TYPE ys_output_tmp.


SELECTION-SCREEN BEGIN OF BLOCK blk00 WITH FRAME TITLE ttl00.
PARAMETERS: rb_ca RADIOBUTTON GROUP rbg1 USER-COMMAND choi,
            rb_ucia RADIOBUTTON GROUP rbg1.
SELECTION-SCREEN END OF BLOCK blk00.


SELECTION-SCREEN BEGIN OF BLOCK blk01 WITH FRAME TITLE ttl01.
PARAMETERS p_prj TYPE cnvcdmcca_objs-proj_id OBLIGATORY.
SELECTION-SCREEN END OF BLOCK blk01.


*======================================================================*
*<<Initialization>>
*======================================================================*
INITIALIZATION.
  MOVE 'CA or UCIA?' TO ttl00.
  MOVE 'Project ID of CDMC result' TO ttl01.
  dl_flag = ''.


*######################################################################*
* Main Procedure
*######################################################################*
START-OF-SELECTION.

  IF rb_ca = 'X'.
    PERFORM ca_result_collect.
    PERFORM json_serialize USING it_caobjs.
  ELSEIF rb_ucia = 'X'.
    PERFORM ucia_result_collect.
    PERFORM json_serialize USING it_ucia.
  ENDIF.

  IF dl_flag ='X'.
    PERFORM download_file.
  ENDIF.

*######################################################################*

*======================================================================*
* Forms
*======================================================================*
*&---------------------------------------------------------------------*
*&      Form  ca_result_collect
*&---------------------------------------------------------------------*
*       text
*----------------------------------------------------------------------*
FORM ca_result_collect.

  SELECT * FROM cnvcdmcca_objs
           INTO CORRESPONDING FIELDS OF TABLE it_caobjs
          WHERE proj_id = p_prj.

  IF sy-subrc <> 0.
    MESSAGE 'There is no CA project you have entered!'
       TYPE 'E'.
  ENDIF.

ENDFORM.                    "ca_result_collect


*&---------------------------------------------------------------------*
*&      Form  ucia_result_collect
*&---------------------------------------------------------------------*
*       text
*----------------------------------------------------------------------*
FORM ucia_result_collect.

*  MESSAGE 'UCIA scenario is in construction now!'
*     TYPE 'E'.

  SELECT SINGLE * FROM cnvcdmcucia_objs
           INTO CORRESPONDING FIELDS OF wa_ucia_objs
          WHERE project_id = p_prj.

  IF sy-subrc <> 0.
    MESSAGE 'There is no UCIA project you have entered!'
       TYPE 'E'.
  ENDIF.


  PERFORM get_data_from_ctrl_center(cnvcdmcucia_display_results) USING p_prj
                                                              CHANGING it_ucia_tmp
                                                                       it_ucia_comp_tmp.

  LOOP AT it_ucia_tmp ASSIGNING <it_ucia>.
    MOVE-CORRESPONDING <it_ucia> TO wa_ucia.
    APPEND wa_ucia TO it_ucia.
  ENDLOOP.

*  DATA line_cnt TYPE i.
*  DESCRIBE TABLE it_ucia LINES line_cnt.


ENDFORM.                    "ucia_result_collect

*&---------------------------------------------------------------------*
*&      Form  json_serialize
*&---------------------------------------------------------------------*
*       text
*----------------------------------------------------------------------*
FORM json_serialize USING it_src.

  json_writer = cl_sxml_string_writer=>create( type = if_sxml=>co_xt_json ).
  writer ?= json_writer.
*writer->set_option( option = if_sxml_writer=>co_opt_linebreaks ).
*writer->set_option( option = if_sxml_writer=>co_opt_indent ).

  CALL TRANSFORMATION id SOURCE itab = it_src
  RESULT XML json_writer.

  "cl_demo_output=>display_json( writer->get_output( ) ).

  json_c = cl_abap_codepage=>convert_from( json_writer->get_output( ) ).

  REPLACE REGEX '^\{\"ITAB\":' IN json_c WITH ''.
  REPLACE REGEX '\}$' IN json_c WITH ''.

*  CREATE OBJECT l_serializer
*    EXPORTING
*      data = it_caobjs.      " your data here!

  "l_serializer->serialize( ) .
  "json_c = l_serializer->get_data( ) .

*  WRITE: / json_c.

  APPEND json_c TO it_json_c.

  dl_flag = 'X'.

ENDFORM.                    "json_serialize

*&---------------------------------------------------------------------*
*&      Form  download_file
*&---------------------------------------------------------------------*
*       text
*----------------------------------------------------------------------*
FORM download_file.
* Display save dialog window
  CALL METHOD cl_gui_frontend_services=>file_save_dialog
    EXPORTING
*     window_title      = ' '
      default_extension = 'TXT'
      default_file_name = 'cdmc_result_json'
      initial_directory = 'c:\temp\'
    CHANGING
      filename          = ld_filename
      path              = ld_path
      fullpath          = ld_fullpath
      user_action       = ld_result.

* Check user did not cancel request
  CHECK ld_result EQ '0'.

  CALL FUNCTION 'GUI_DOWNLOAD'
    EXPORTING
      filename              = ld_fullpath
      filetype              = 'ASC'
*     APPEND                = 'X'
      write_field_separator = 'X'
*     CONFIRM_OVERWRITE     = 'X'
    TABLES
      data_tab              = it_json_c[]     "need to declare and populate
    EXCEPTIONS
      file_open_error       = 1
      file_write_error      = 2
      OTHERS                = 3.
ENDFORM.                    "download_file

