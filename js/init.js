
'use strict';

moment.locale( myUtil.getBrowserLang() );

(function ()
{
	var app = angular.module('myApp', ['chart.js']),
	    createCAsummary,
	    createUCIAsummary,
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
	    getCustObjMainFilter,
	    getCompImpactObj,
	    getImpactObjFilter,
	    setImpactAnalysis;

	app.controller('fileDropCtrl', ['$scope', function($scope){
	  $scope.fileNames = [];
	  $scope.dragAreaShow = true;
	  $scope.summaryShow = false;
	  $scope.summaryCA_Show = false;
	  $scope.summaryUCIA_Show = false;
	 
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
		 				$scope.summaryCA_Show = true;
		 				createCAsummary( $scope );
		 				break;
		 			case "UCIA":
		 				// UCIA Contents
		 				$scope.summaryUCIA_Show = true;
		 				createUCIAsummary( $scope );
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

// ==========================================================================
// Functions
// ==========================================================================
	checkContents = function ()
	{
		if ( jsonCont[0].HAS_INACTIVE     !== undefined && 
			 jsonCont[0].HAS_NO_REF       !== undefined && 
			 jsonCont[0].HAS_EQUAL_DOM    !== undefined && 
			 jsonCont[0].HAS_SYNTAX_ERROR !== undefined )
		{
			return "CA";
		}
		else if ( jsonCont[0].CUST_SEV_TEXT !== undefined &&
				  jsonCont[0].SAP_SEV_TEXT  !== undefined && 
				  jsonCont[0].REF_OBJ_TYPE  !== undefined && 
				  jsonCont[0].REF_OBJ_NAME  !== undefined && 
				  jsonCont[0].REASON1       !== undefined )
		{
			return "UCIA";
		}
		else
		{
			return "NA";
		}
	};

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

	createUCIAsummary = function ( scope )
	{
		var 
			compObjImpact,
			tmpObj;

		jsonCont.sort( function ( a, b ) {
			if ( a.OBJ_TYPE > b.OBJ_TYPE ) return 1;
			if ( a.OBJ_TYPE < b.OBJ_TYPE ) return -1;
			if ( a.OBJ_NAME > b.OBJ_NAME ) return 1;
			if ( a.OBJ_NAME < b.OBJ_NAME ) return -1;
			return 0;
		});

		compObjImpact =  getCompImpactObj();
		setImpactAnalysis( scope, compObjImpact );

 		// Impacted Customer Object
 		subFlag = false;
 		tmpObj = getImpactObjFilter(compObjImpact, "CUST-SEV-IMPACT");
 		objTypePivot( tmpObj,  "#compImpactTab", subFlag );
 		objTypePivotGraph( tmpObj, "#compImpactGraph", subFlag );
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
			case "USAGE":
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


	getCompImpactObj = function ()
	{
		var compObj = [],
			compObjIdx = -1;

		for (var i = 0; i < jsonCont.length; i++ )
		{
			if ( i === 0 ) 
			{ 
				compObj.push( jsonCont[i] ); 
				compObjIdx++; 
				continue; 
			}
			else if ( compObj[compObjIdx].OBJ_TYPE === jsonCont[i].OBJ_TYPE && compObj[compObjIdx].OBJ_NAME === jsonCont[i].OBJ_NAME )
			{
				continue; 
			}
			else 
			{ 
				compObj.push( jsonCont[i] ); 
				compObjIdx++; 
			}

		}

		return	compObj;
	};

	getImpactObjFilter = function ( chkObj, objFilter, sValue )
	{
		switch ( objFilter )
		{
			case "CUST-SEV-TEXT": 
				return chkObj.filter( function( elem )
				{
					return elem.CUST_SEV_TEXT === sValue;
				});
				break;

			case "CUST-SEV-IMPACT": 
				return chkObj.filter( function( elem )
				{
					return elem.CUST_SEV_TEXT !== "Green";
				});
				break;

			default:
				break;
		}
	}


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

	setImpactAnalysis = function ( scope, chkObj )
	{
		scope.uciaObjMain = chkObj.length;
		scope.greenObjCnt = getImpactObjFilter( chkObj, "CUST-SEV-TEXT", "Green" ).length;
		scope.yellowObjCnt = getImpactObjFilter( chkObj, "CUST-SEV-TEXT", "Yellow" ).length;
		scope.redObjCnt = getImpactObjFilter( chkObj, "CUST-SEV-TEXT", "Red" ).length;
		scope.impactLabels = ["Green", "Yellow", "Red"];
		scope.impactColors = ["#3cb371", "#ffd700", "#ff4500"];
		scope.impactData = [ scope.greenObjCnt, scope.yellowObjCnt, scope.redObjCnt ];
	}



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