g_script_XMLFunctions = {
    
    ReadXMLFile: function( params, strTitle ){
            LoadParamsFromDisk ( GetDefaultParamsFile(), params, strTitle );
            return params
    }

};

    ///////////////////////////////////////////////////////////////////////////////
    // Function: GetDefaultParamsFile
    // Usage: Find my default settings, this is last ran values
    // Input: <none>
    // Return: File to my default settings
    ///////////////////////////////////////////////////////////////////////////////
    function GetDefaultParamsFile() {    
        return ( new File( "C:/Adobe/settings/ProcessSchool.xml" ) );
    }

	// load my params from the xml file on disk if it exists
	// this.params["myoptionname"] = myoptionvalue
	// I wrote a very simple xml parser, I'm sure it needs work
    function LoadParamsFromDisk(loadFile, params, strTitle){
		if ( loadFile.exists ) {
			loadFile.open( "r" );
			var projectSpace = ReadHeader( loadFile );
			if ( projectSpace == GetScriptNameForXML(strTitle) ) {
				while ( ! loadFile.eof ) {
					var starter = ReadHeader( loadFile );
					var data = ReadData( loadFile );
					var ender = ReadHeader( loadFile );
					if ( ( "/" + starter ) == ender ) {
						params[starter] = data;
					}
					// force boolean values to boolean types
					if ( data == "true" || data == "false" ) {
						params[starter] = data == "true";
					}
				} //while
			} //if get script
			loadFile.close();
		}  //exists
	}   

    ///////////////////////////////////////////////////////////////////////////////
    // Function: GetScriptNameForXML
    // Usage: From my file name, get the XML version
    // Input: <none>
    // Return: String for XML version of my script, taken from strTitle which is a global
    // NOTE: you can't save certain characters in xml, strip them here
    // this list is not complete
    ///////////////////////////////////////////////////////////////////////////////
    function GetScriptNameForXML(strTitle) {
        var scriptNameForXML = new String( strTitle );
        var charsToStrip = Array( " ", "'", "." );
        for (var a = 0; a < charsToStrip.length; a++ )  {
            var nameArray = scriptNameForXML.split( charsToStrip[a] );
            scriptNameForXML = "";
            for ( var b = 0; b < nameArray.length; b++ ) {
                scriptNameForXML += nameArray[b];
            }
        }
        return scriptNameForXML;
    };

    // a very crude xml parser, this reads the "Tag" of the <Tag>Data</Tag>
    function ReadHeader( inFile ) {
        var returnValue = "";
        if ( ! inFile.eof ) {
            var c = "";
            while ( c != "<" && ! inFile.eof ) {
                c = inFile.read( 1 );
            }
            while ( c != ">" && ! inFile.eof ) {
                c = inFile.read( 1 );
                if ( c != ">" ) {
                    returnValue += c;
                }
            }
        } else {
            returnValue = "end of file";
        }
        return returnValue;
    };

    // very crude xml parser, this reads the "Data" of the <Tag>Data</Tag>
    function ReadData( inFile ) {
        var returnValue = "";
        if ( ! inFile.eof ) {
            var c = "";
            while ( c != "<" && ! inFile.eof ) {
                c = inFile.read( 1 );
                if ( c != "<" ) {
                    returnValue += c;
                }
            }
            inFile.seek( -1, 1 );
        }
        return returnValue;
    };