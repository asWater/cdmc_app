
'use strict';

moment.locale( myUtil.getBrowserLang() );

(function ()
{
	var app = angular.module('myApp', ['chart.js']),
	    createCAsummary,
	    jsonCont,
	    checkContents,
	    jsonCustObjMain,
	    jsonModObj,
	    getCustObjMain,
	    getModObj,
	    objTypePivot,
	    objTypePivotGraph,
	    subFlag = false,
	    setUsageAnalysis,
	    setOtherAnalyses,
	    getCustObjMainFilter;

	app.controller('fileDropCtrl', ['$scope', function($scope){
	  $scope.fileNames = [];
	  $scope.dragAreaShow = true;
	 
	  $scope.dragOver = function($event){
	    $event.stopPropagation();
	    $event.preventDefault();
	 
	    $event.dataTransfer.dropEffect = 'copy';
	  };
	 
	  $scope.drop = function($event){
	    $event.stopPropagation();
	    $event.preventDefault();

	    $scope.dragAreaShow = false;
	 
	    var files = $event.dataTransfer.files,
	    	f,
	 	    reader = new FileReader();

	 	if ( files.length === 1 )
	 	{
	 		f = files[0];
	 	}
	 	else
	 	{
	 		alert("Drop only 1 file!");
	 		return;
	 	}

	 	if (("" + f.type).indexOf("text/") == 0)
	 	{
	 		reader.readAsText(f);
	 	}
	 	else
	 	{
	 		alert("This file type cannnot be processed! Only TXT file is valid.");
	 		return;
	 	}

	 	$scope.fileName = f.name;
 
	 	reader.onload = function(e)
	 	{
	 		$scope.$apply( function ()
	 		{
	 			$scope.summaryShow = true;

	 			try
	 			{
	 				jsonCont = JSON.parse(e.target.result);
	 			}
	 			catch (e)
	 			{
	 				alert( "This file does not seem JSON format! \nError Messeage: " + e );
	 				return;
	 			}
		 		
		 		switch ( checkContents() )
		 		{
		 			case "CA":
		 				// Clearing Analysis Contents
		 				createCAsummary( $scope );
		 				break;
		 			case "UCIA":
		 				// UCIA Contents
		 				break;
		 			default: 
		 				// Unknown Contents = "NA"
		 				alert( "This file is not a CDMC result!" );
		 				return;
		 				break;
		 		}

	 		});
	 	};

	  };
	}]).directive('ngDrop', function($parse){
	  return{
	    restrict: 'A',
	    link: function($scope, element, attrs){
	      element.bind('drop', function(event){
	        var fn = $parse(attrs.ngDrop);
	        $scope.$apply(function() {
	          fn($scope, {$event:event});
	                });
	      });
	    }
	  };
	}).directive('ngDragover', function($parse){
	  return{
	    restrict: 'A',
	    link: function($scope, element, attrs){
	      element.bind('dragover', function(event){
	        var fn = $parse(attrs.ngDragover);
	        $scope.$apply(function() {
	          fn($scope, {$event:event});
	        });
	      });
	    }
	  };
	});


	createCAsummary = function ( scope )
	{
		var
			tmpJson;

 		jsonCustObjMain = getCustObjMain();
 		jsonModObj = getModObj();
 		scope.objMain = jsonCustObjMain.length;
 		scope.objMod = jsonModObj.length;

 		// Customer Object
 		subFlag = false;
 		objTypePivot( jsonCustObjMain,  "#custMainTab", subFlag );
 		objTypePivotGraph( jsonCustObjMain, "#custMainGraph", subFlag );
 		
 		// Modification
 		subFlag = true;
 		objTypePivot( jsonModObj,  "#modObjTab", subFlag );
 		objTypePivotGraph( jsonModObj, "#modObjGraph", subFlag );

 		// Usage analysis
 		setUsageAnalysis( scope );
 		subFlag = false;
 		objTypePivot( getCustObjMainFilter( jsonCustObjMain, "USAGE", "X" ),  "#usedObjTab", subFlag );
 		objTypePivotGraph( getCustObjMainFilter( jsonCustObjMain, "USAGE", "X" ),  "#usedObjGraph", subFlag );
 		objTypePivot( getCustObjMainFilter( jsonCustObjMain, "USAGE", "" ),  "#unUsedObjTab", subFlag );
 		objTypePivotGraph( getCustObjMainFilter( jsonCustObjMain, "USAGE", "" ),  "#unUsedObjGraph", subFlag );

 		// Other Analyses
 		setOtherAnalyses( scope );

 		// Mixed Check
 		// > Not Referred & Not Used
 		tmpJson = getCustObjMainFilter( getCustObjMainFilter( jsonCustObjMain, "USAGE", "" ), "NOREF" );
 		objTypePivot( tmpJson, "#mixTab01", subFlag );
 		// > Not Referred & Duplicate Domain
 		tmpJson = getCustObjMainFilter( getCustObjMainFilter( jsonCustObjMain, "DUPDOM" ), "NOREF" );
 		objTypePivot( tmpJson, "#mixTab02", subFlag );
 		// > Not Referred & ZERO tab entries
 		tmpJson = getCustObjMainFilter( getCustObjMainFilter( jsonCustObjMain, "ZEROTAB" ), "NOREF" );
 		objTypePivot( tmpJson, "#mixTab03", subFlag );

	};

	checkContents = function ( jsonOb )
	{
		if ( jsonCont[0].HAS_INACTIVE     !== undefined && 
			 jsonCont[0].HAS_NO_REF       !== undefined && 
			 jsonCont[0].HAS_EQUAL_DOM    !== undefined && 
			 jsonCont[0].HAS_SYNTAX_ERROR !== undefined )
		{
			return "CA";
		}
		else
		{
			return "NA";
		}
	};

	getCustObjMain = function ()
	{
		return jsonCont.filter( function( elem )
		{
			return elem.SUB_TYPE === "" && elem.SUB_NAME === "" && elem.OBJ_NAMESPACE === "C"
		});
	};

	getModObj = function ()
	{
		return jsonCont.filter( function( elem )
		{
			return elem.OBJ_NAMESPACE === "S"
		});
	};


	getCustObjMainFilter = function ( jsonObj, objFilter, uType )
	{
		switch ( objFilter )
		{
			case 'USAGE':
				switch ( uType )
				{
					case "X":
						return jsonObj.filter( function( elem )
						{
							return elem.IS_USED === "X";
						});
						break;
					case "N":
						return jsonObj.filter( function( elem )
						{
							return elem.IS_USED === "N";
						});
						break;
					default: 
						return jsonObj.filter( function( elem )
						{
							return elem.IS_USED === "";
						});
						break;
				}

			case "INACTIVE":
				return jsonObj.filter( function( elem )
				{
					return elem.HAS_INACTIVE === "X";
				});

				break;

			case "NOREF":
				return jsonObj.filter( function( elem )
				{
					return elem.HAS_NO_REF === "X";
				});

				break;

			case "NOREF2":
				return jsonObj.filter( function( elem )
				{
					return elem.HAS_NO_REF === "X" && elem.OBJ_TYPE !== "PROG" && elem.OBJ_TYPE !== "TRAN";
				});

				break;

			case "ALLDOM":
				return jsonObj.filter( function( elem )
				{
					return elem.OBJ_TYPE === "DOMA";
				});

				break;

			case "DUPDOM":
				return jsonObj.filter( function( elem )
				{
					return elem.OBJ_TYPE === "DOMA" && elem.HAS_EQUAL_DOM !== "0";
				});

				break;

			case "ALLTAB":
				return jsonObj.filter( function( elem )
				{
					return elem.OBJ_TYPE === "TABL";
				});

				break;

			case "ZEROTAB":
				return jsonObj.filter( function( elem )
				{
					return elem.OBJ_TYPE === "TABL" && elem.TABLE_COUNT <= 0;
				});

				break;

			case "SYNTAXERR":
				return jsonObj.filter( function( elem )
				{
					return elem.HAS_SYNTAX_ERROR === "X";
				});

				break;

			case "SHORTDUMP":
				return jsonObj.filter( function( elem )
				{
					return elem.CAUSED_DUMP === "X";
				});

				break;

			default:
				break;
		}
	};


	objTypePivot = function ( jsonObj, area, subFlag ) 
	{
		var derivers = $.pivotUtilities.derivers;
		
		if ( subFlag )
		{
			$(area).pivotUI( jsonObj, 
			{
				rows: ["OBJ_TYPE", "SUB_TYPE"],
				vals: ["OBJ_NAME"],
				aggregator: 'Count',
				rendererName: "Heatmap"
			});
		}
		else
		{
			$(area).pivotUI( jsonObj, 
			{
				rows: ["OBJ_TYPE"],
				vals: ["OBJ_NAME"],
				aggregator: 'Count',
				rendererName: "Heatmap"
			});			
		}

	};


	objTypePivotGraph = function ( jsonObj, area, subFlag )
	{
		var derivers = $.pivotUtilities.derivers;

		if ( subFlag )
		{
			$(area).pivotUI( jsonObj, 
			{
				rows: ["OBJ_TYPE", "SUB_TYPE"],
				vals: ["OBJ_NAME"],
				aggregator: 'Count',
				rendererName: "Bar Chart",
				renderers: $.extend(
					$.pivotUtilities.renderers,
					$.pivotUtilities.c3_renderers
					)
				
			});		
		}
		else
		{
			$(area).pivotUI( jsonObj, 
			{
				rows: ["OBJ_TYPE"],
				vals: ["OBJ_NAME"],
				aggregator: 'Count',
				rendererName: "Bar Chart",
				renderers: $.extend(
					$.pivotUtilities.renderers,
					$.pivotUtilities.c3_renderers
					)
				
			});			
		}


	};

	setUsageAnalysis = function ( scope )
	{
		scope.usedObjCnt = getCustObjMainFilter( jsonCustObjMain, "USAGE", "X" ).length;
		scope.unUsedObjCnt = getCustObjMainFilter( jsonCustObjMain, "USAGE", "" ).length;
		scope.notSupObjCnt = getCustObjMainFilter( jsonCustObjMain, "USAGE", "N" ).length;
		scope.usageLabels = ["Used", "Not Used", "Not Supported"];
 		scope.usageColors = ["#3cb371", "#cd5c5c", "#d3d3d3"]
 		scope.usageData = [ scope.usedObjCnt, scope.unUsedObjCnt, scope.notSupObjCnt ];
	};

	setOtherAnalyses = function ( scope )
	{
		scope.inactiveObjCnt = getCustObjMainFilter( jsonCustObjMain, "INACTIVE" ).length;
		scope.notRefObjCnt = getCustObjMainFilter( jsonCustObjMain, "NOREF" ).length;
		scope.notRefObjCnt2 = getCustObjMainFilter( jsonCustObjMain, "NOREF2" ).length;
		scope.domCnt = getCustObjMainFilter( jsonCustObjMain, "ALLDOM" ).length;
		scope.dupDomCnt = getCustObjMainFilter( jsonCustObjMain, "DUPDOM" ).length;
		scope.tabCnt = getCustObjMainFilter( jsonCustObjMain, "ALLTAB" ).length;
		scope.noEntryTab = getCustObjMainFilter( jsonCustObjMain, "ZEROTAB" ).length;
		scope.sntaxErrObjCnt = getCustObjMainFilter( jsonCustObjMain, "SYNTAXERR" ).length;
		scope.shortDumpObjCnt = getCustObjMainFilter( jsonCustObjMain, "SHORTDUMP" ).length;
	};


})();