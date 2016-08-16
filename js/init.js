
'use strict';

moment.locale( myUtil.getBrowserLang() );

(function ()
{
	var app = angular.module('myApp', [ 'ui.bootstrap','chart.js' ]),
	    createCAsummary,
	    createUCIAsummary,
	    jsonCont,
	    checkContents,
	    jsonCustObjMain,
	    jsonModObj,
	    getCustObjMain,
	    getModObj,
	    objTypePivot,
	    refObjTypePivot,
	    matrixCustSAPPivot,
	    changeCategorySAPPivot,
	    objTypePivotGraph,
	    refObjTypePivotGraph,
	    subFlag = false,
	    setUsageAnalysis,
	    setOtherAnalyses,
	    getCustObjMainFilter,
	    getUniqueComp2Keys,
	    getImpactObjFilter,
	    setImpactAnalysis,
	    pbModalInstance,
	    pbError = false,
	    pbAbend;

	app.controller('fileDropCtrl', ['$scope', '$uibModal', function( $scope, $uibModal ){
	  $scope.fileNames = [];
	  $scope.dragAreaShow = true;
	  $scope.summaryShow = false;
	  $scope.summaryCA_Show = false;
	  $scope.summaryUCIA_Show = false;
	 
	  $scope.dragOver = function($event){
	    $event.stopPropagation();
	    $event.preventDefault();
	 
	    $event.dataTransfer.dropEffect = "copy";
	  };
	 
	  $scope.drop = function($event){

	    var files = $event.dataTransfer.files,
	    	f,
	 	    reader = new FileReader();

	    $event.stopPropagation();
	    $event.preventDefault();

	    $scope.dragAreaShow = false;

	 	if ( files.length === 1 )
	 	{
	 		f = files[0];
	 	}
	 	else
	 	{
	 		$scope.alerts = [{ type: "danger", msg: "Drop only 1 file!" }];
	 		return;
	 	}

	 	if (("" + f.type).indexOf("text/") == 0)
	 	{
			$scope.pbType = "success";
			$scope.remotingProgress = 1; $scope.remotingStatus = "File type is checked";
			pbModalInstance = $uibModal.open({
				templateUrl: "progressBar",
				backdrop: "static",
				scope: $scope
			});

	 		reader.readAsText(f);
	 	}
	 	else
	 	{
	 		$scope.alerts = [{ type: "danger", msg: "This file type cannnot be processed! Only TXT file is valid." }];
	 		return;
	 	}

	 	$scope.fileName = f.name;

	 	reader.onloadstart = function ( e )
	 	{
			$scope.$apply( function () { $scope.remotingProgress = 2; $scope.remotingStatus = "Start file reading"; } );
	 	};

	 	reader.onprogress = function ( evt )
	 	{
		    // evt is an ProgressEvent.
		    $scope.$apply ( function ()
		    {
			    if (evt.lengthComputable) {
			      $scope.remotingProgress = ( Math.round((evt.loaded / evt.total) * 100) * 0.9 );  $scope.remotingStatus = "Reading File..."; 
			      console.log( Math.round((evt.loaded / evt.total) * 100) );
			    }	    	
		    });

	 	};

	 	reader.onload = function(e)
	 	{
	 		$scope.$apply( function ()
	 		{
	 			$scope.remotingStatus = "JSON parsing";

	 			try
	 			{
	 				jsonCont = JSON.parse(e.target.result);
	 			}
	 			catch (e)
	 			{
	 				pbAbend( $scope, "Error during JSON Parse!" );

	 				$scope.alerts = [{ type: "danger", msg: "This file does not seem JSON format! \nError Messeage: " + e  }];
	 				return;
	 			}

	 			$scope.summaryShow = true;
		 		
	 			$scope.remotingProgress = 90; $scope.remotingStatus = "Creating Summary";

		 		switch ( checkContents() )
		 		{
		 			case "CA":
		 				// Clearing Analysis Contents
		 				$scope.summaryCA_Show = true;
		 				$scope.cdmcAnalysis = "CA";
		 				createCAsummary( $scope );
		 				break;
		 			case "UCIA":
		 				// UCIA Contents
		 				$scope.summaryUCIA_Show = true;
		 				$scope.cdmcAnalysis = "UCIA";
	    				$scope.radioModel = "Include";
	    				$scope.toggleChange();
		 				break;
		 			default: 
		 				// Unknown Contents = "NA"
			 			$scope.summaryShow = false;
		 				pbAbend( $scope, "This file is not a CDMC result!" );
		 				$scope.alerts = [ { type: "danger", msg: "This file is not a CDMC result!" } ];
		 				return;
		 				break;
		 		}

		 		$scope.remotingProgress = 100; $scope.remotingStatus = "All processes were finished.";
		 		pbModalInstance.close();

	 		});
	 	};

	  }; // End of "$scope.drop" function
	  
	  $scope.toggleChange = function ()
	  {
	  	//
	    switch ( $scope.radioModel )
	    {
	    	case "Include":
	    		$scope.summaryMode = "Summary with including indirectly SAP referred objects.";
	    		$scope.objLength = jsonCont.length;
	    		createUCIAsummary( $scope, jsonCont );
	    		break;
	    	case "Exclude":
	    		$scope.summaryMode = "Summary with excluding indirectly SAP referred objects.";
	    		$scope.objLength = getImpactObjFilter( jsonCont, "EXCLUDE-INDIRECT" ).length;
	    		createUCIAsummary( $scope, getImpactObjFilter( jsonCont, "EXCLUDE-INDIRECT" ));
	    		break;
	    	default:
	    		break;
	    }
	  };

	  $scope.closeAlert = function( index ) { $scope.alerts.splice(index, 1); location.reload(); };

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

	createUCIAsummary = function ( scope, jsonObj )
	{
		var 
			compObjImpact,
			tmpObj,
			changedUniqueSAP;

		jsonObj.sort( function ( a, b ) {
			if ( a.OBJ_TYPE > b.OBJ_TYPE ) return 1;
			if ( a.OBJ_TYPE < b.OBJ_TYPE ) return -1;
			if ( a.OBJ_NAME > b.OBJ_NAME ) return 1;
			if ( a.OBJ_NAME < b.OBJ_NAME ) return -1;
			return 0;
		});

		compObjImpact =  getUniqueComp2Keys( jsonObj, "OBJ_TYPE", "OBJ_NAME" );
		setImpactAnalysis( scope, compObjImpact );

 		// Impacted Customer Object
 		subFlag = false;
 		tmpObj = getImpactObjFilter( compObjImpact, "CUST-SEV-IMPACT" );
 		objTypePivot( tmpObj,  "#compImpactTab", subFlag );
 		objTypePivotGraph( tmpObj, "#compImpactGraph", subFlag );

 		// Changed SAP objects
 		tmpObj = [];
 		tmpObj = getImpactObjFilter( jsonObj, "SAP-SEV-IMPACT" );
 		tmpObj.sort( function ( a, b ) {
			if ( a.REF_OBJ_TYPE > b.REF_OBJ_TYPE ) return 1;
			if ( a.REF_OBJ_TYPE < b.REF_OBJ_TYPE ) return -1;
			if ( a.REF_OBJ_NAME > b.REF_OBJ_NAME ) return 1;
			if ( a.REF_OBJ_NAME < b.REF_OBJ_NAME ) return -1;
			return 0;
		});
		changedUniqueSAP = getUniqueComp2Keys( tmpObj, "REF_OBJ_TYPE", "REF_OBJ_NAME" );
  		refObjTypePivot( changedUniqueSAP,  "#changedSAPTab", subFlag );
 		refObjTypePivotGraph( changedUniqueSAP, "#changedSAPGraph", subFlag );

 		// Change Categories of SAP Objects
 		changeCategorySAPPivot( changedUniqueSAP, "#changeCategoryTab" );

 		// Matrix Customer Objects VS SAP Objects
 		matrixCustSAPPivot( tmpObj, "#marixCvSTab" );


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


	getUniqueComp2Keys = function ( jsonObj, key1, key2 )
	{
		var compObj = [],
			compObjIdx = -1;

		for (var i = 0; i < jsonObj.length; i++ )
		{
			if ( i === 0 ) 
			{ 
				compObj.push( jsonObj[i] ); 
				compObjIdx++; 
				continue; 
			}
			else if ( compObj[compObjIdx][key1] === jsonObj[i][key1] && compObj[compObjIdx][key2] === jsonObj[i][key2] )
			{
				continue; 
			}
			else 
			{ 
				compObj.push( jsonObj[i] ); 
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
					return elem.CUST_SEV_TEXT === "Yellow" || elem.CUST_SEV_TEXT === "Red";
				});
				break;

			case "SAP-SEV-IMPACT": 
				return chkObj.filter( function( elem )
				{
					return elem.SAP_SEV_TEXT === "Yellow" || elem.SAP_SEV_TEXT === "Red";
				});
				break;

			case "EXCLUDE-INDIRECT": 
				return chkObj.filter( function( elem )
				{
					return elem.REASON1 !== "Obj impacted due to an indirectly referenced SAP obj";
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

	refObjTypePivot = function ( jsonObj, area )
	{
		var derivers = $.pivotUtilities.derivers;

		$(area).pivotUI( jsonObj, 
		{
			rows: ["REF_OBJ_TYPE"],
			vals: ["REF_OBJ_NAME"],
			aggregator: 'Count',
			rendererName: "Heatmap"
		});		

	};

	matrixCustSAPPivot = function ( jsonObj, area )
	{
		var derivers = $.pivotUtilities.derivers;

		$(area).pivotUI( jsonObj, 
		{
			rows: ["OBJ_TYPE"],
			cols: ["REF_OBJ_TYPE"],
			vals: ["REF_OBJ_NAME"],
			aggregator: 'Count',
			rendererName: "Heatmap"
		});			
	};

	changeCategorySAPPivot = function ( jsonObj, area )
	{
		var derivers = $.pivotUtilities.derivers;

		$(area).pivotUI( jsonObj, 
		{
			rows: ["REASON1"],
			vals: ["OBJ_NAME"],
			aggregator: 'Count',
			rendererName: "Heatmap"
		});			
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

	refObjTypePivotGraph = function ( jsonObj, area )
	{
		var derivers = $.pivotUtilities.derivers;

		$(area).pivotUI( jsonObj, 
		{
			rows: ["REF_OBJ_TYPE"],
			vals: ["REF_OBJ_NAME"],
			aggregator: 'Count',
			rendererName: "Bar Chart",
			renderers: $.extend(
				$.pivotUtilities.renderers,
				$.pivotUtilities.c3_renderers
				)
			
		});			
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

	pbAbend = function ( scope, msg )
	{
		scope.pbError = true;
		scope.pbType = "danger";
		scope.remotingProgress = 100; 
		scope.remotingStatus = msg;
	};


})();