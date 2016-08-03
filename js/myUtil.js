/*
spa.util.js
 */

/*jslint
	browser : true, continue : true, 
	devel   : true, indent   : 2,      maxerr : 50,
	newcap  : true, nomen    : true, plusplus : true,
	regexp  : true, sloppy   : true,     vars : true,
	white   : true
*/
/*global $, spa */

myUtil = (function ()
{
	//===================================
	// Module Scope Variant >>> Start 

	var
		getDateArray,
		getBrowserLang;

	// Module Scope Variant <<< End
	//===================================


	//===================================
	// Utility Methods >>> Start

	// Utility Methods <<< End
	//===================================


	//===================================
	// DOM Methods >>> Start

	// DOM Methods <<< End
	//===================================


	//===================================
	// Event Handlers >>> Start

	// Event Handlers <<< End
	//===================================



	//===================================
	// Public Methods >>> Start

	getBrowserLang = function()
	{
		try
		{
			return ( navigator.language || navigator.browserLanguage || navigator.userLanguage ).substr( 0, 2 );
		}
		catch( e )
		{
			return undefined;
		}
	};

	// <Public Constructor> "getDateArray".
	// [Objective]: Return dates in array by getting date range (start date and end date).
	// [Arguments]:
	// 	- startDate   > Start date of date range.
	// 	- endDate     > End date of date range.
	// 	- dateFormat  > Date format used in moment.js (e.g. "YYYY/MM/DD ddd").
	// [Return value]: Newly created array which holds dates.
	// [Exeptions]: none.
	//

	getDateArray = function ( startDate, endDate, dateFormat )
	{
		var
			dates = [],
			start = moment( startDate ).subtract( 1, 'd' ),
			end = moment( endDate ),
			diff = end.diff( start, 'days' );

		if( !start.isValid() || !end.isValid() || diff <= 0 )
		{
            return;
        }

        for( var i = 0; i < diff; i++ )
        {
            dates.push( start.add( 1, 'd' ).format( dateFormat ));
        }

        return dates;
	};



	// Public Methods <<< End
	//===================================


	// ### Return Public Methods ###
	return {
		getDateArray : getDateArray,
		getBrowserLang : getBrowserLang
	};

}());