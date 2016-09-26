#target photoshop

g_ProcessSchool = {
    processSchool: function(){         
        return main ();
    }
};

//~ //Uncomment if you want to run file outside of photoshop
//~ main();

function main(){
    $.evalFile(new File("c:/Adobe/scripts/readXML.jsx"));
    $.evalFile(new File("c:/Adobe/scripts/initParms.jsx"));
    $.evalFile(new File("c:/Adobe/scripts/checkSchoolWithoutJPEG.jsx"));

    // on localized builds we pull the $$$/Strings from a .dat file, see documentation for more details
    $.localize = true;

    // the main routine
    // the ImageProcessor object does most of the work
    try { 
        GlobalVariables();

        CheckVersion();      
            
        if ( IsWindowsOS() ) {
            gShortFileNameLength = gShortFileNameLengthWin;
        }

        //initialise the object
        var gIP = new ImageProcessor();
        
        //read in settings from the xml file
        gIP.params = g_script_XMLFunctions.ReadXMLFile(gIP.params, strTitle);

        //build the dialog box
        gIP.CreateDialog();
        
        if ( gRunButtonID == gIP.RunDialog() ) {

            //save the dialog settings to file
            gIP.SaveParamsToDisk( GetDefaultParamsFile() );

            //check right number of images are in each folder
            if ( g_FolderCheckWithoutJPEG.folderCheck( gIP.params["source"], gIP.params["imagecount"] ) )  {  return;  }

            //runt the jpeg process
            gIP.Execute();

            //call indesign and create the proof sheet 
            CallIndesign (gIP);
            $.writeln("Called Indesign")
            
        } else {
            gScriptResult = 'cancel'; // quit, returning 'cancel' (dont localize) makes the actions palette not record our script
        }
        
        gIP.ReportErrors();
        
        $.gc(); // fix crash on quit
    }

    // Lot's of things can go wrong
    // Give a generic alert and see if they want the details
    catch( e ) {
        if ( e.number != 8007 ) { // don't report error on user cancel
            if ( confirm( strSorry ) ) {
                alert( e + " : " + e.line );
            }
        }
        gScriptResult = 'cancel'; // quit, returning 'cancel' (dont localize) makes the actions palette not record our script
    }

    // restore the dialog modes
    app.displayDialogs = gSaveDialogMode;

    // must be the last thing
    gScriptResult; 
}

///////////////////////////////////////////////////////////////////////////////
// Function: CallIndesign
// Usage: Call Indesign processing script
// Input: <none>
// Return: <none>
///////////////////////////////////////////////////////////////////////////////
function CallIndesign(){

    var scriptToLoad = new File( "C:/Adobe/scripts/ID_School.jsx" );

    try {
        if (!scriptToLoad.exists) { throw new Error("script not found!"); }
        scriptToLoad.open("r");
        var message = scriptToLoad.read();
        scriptToLoad.close();
    } catch (error) {
        alert("Error parsing the file: " + error.description);
    }
    var bt = new BridgeTalk();
//~     bt.target = "indesign-10.064";
    bt.target = "indesign";
    bt.body = message;
    bt.onError = function (btObj) {
        var errorCode = parseInt (btObj.headers ["Error-Code"]);
        throw new Error (errorCode, btObj.body);
    }
    bt.send();      
}

///////////////////////////////////////////////////////////////////////////////
// Function: GlobalVariables
// Usage: all of my globals
// Input: <none>
// Return: <none>
///////////////////////////////////////////////////////////////////////////////
function GlobalVariables() {

	// a version for possible expansion issues
	gVersion = 1;
	
	gScriptResult = undefined;

	// ok and cancel button
	gRunButtonID = 1;
	gCancelButtonID = 2;
	gMaxResize = 30000;

	// A list of file extensions and types PS can read
	gFileExtensionsToRead = app.windowsFileTypes;
	gFileTypesToRead = app.macintoshFileTypes;

	// A list of camera raw extensions, keep them upper case
	gFilesForCameraRaw = Array( "TIF", "CRW", "NEF", "RAF", "ORF", "MRW", "DCR", "MOS", "SRF", "PEF", "DCR", "CR2", "DNG", "ERF", "X3F", "RAW" );

	// limit the length of text in edit boxes by this length
	// this needs to be calculated on the fly!
	// the problem is we have non mono space fonts! 
	// 10 iiiiiiiiii != 10 MMMMMMMMMM 
	gShortFileNameLengthWin = 35;
	gShortFileNameLengthMac = 27;
	gShortFileNameLength = gShortFileNameLengthMac;

	// remember the dialog modes
	gSaveDialogMode = app.displayDialogs;
	app.displayDialogs = DialogModes.NO;

	gClassActionSet = charIDToTypeID( 'ASet' );
	gClassAction = charIDToTypeID( 'Actn' );
	gKeyName = charIDToTypeID( 'Nm  ' );
	gKeyNumberOfChildren = charIDToTypeID( 'NmbC' );
	
	gOpenedFirstCR = false;
	gFoundFileToProcess = false;

	// all the strings that need localized
	//strTitle = localize( "$$$/JavaScript/ImageProcessor/Title=Image Processor" );
    strTitle = "Process School";
	strLabelSource = localize( "$$$/JavaScripts/ImageProcessor/Source=Select the images to process" );
	strNoImagesSelected = localize( "$$$/JavaScripts/ImageProcessor/NoImagesSelected=No images have been selected" );
	strNoFolderSelected = localize( "$$$/JavaScripts/ImageProcessor/NoFolderSelected=No folder has been selected" );
	strLabelSourceHelp = localize( "$$$/JavaScripts/ImageProcessor/SourceHelp=Location of files to process" );
	strLabelDestination = localize( "$$$/JavaScripts/ImageProcessor/Destination=Select location to save processed images" );
     strUseOpen = localize( "$$$/JavaScripts/ImageProcessor/UseOpen=Use Open &Images" );
	strUseOpenHelp = localize( "$$$/JavaScripts/ImageProcessor/UseOpenHelp=Use the images that are currently open" );
	strButtonBrowse1 = localize( "$$$/JavaScripts/ImageProcessor/Browse1=Select &Folder..." );
	strButtonBrowse2 = localize( "$$$/JavaScripts/ImageProcessor/Browse2=Sele&ct Folder..." );
	strButtonRun = localize( "$$$/JavaScripts/ImageProcessor/Run=Run" );
	strOpenFirst = localize( "$$$/JavaScripts/ImageProcessor/OpenFirst=&Open first image to apply settings" );
	strOpenFirstHelp = localize( "$$$/JavaScripts/ImageProcessor/OpenFirstHelp=Show the Camera RAW dialog on the first image to apply settings" );
	strBridge = localize( "$$$/JavaScripts/ImageProcessor/Bridge=Process files from Bridge only" );
	strBridgeHelp = localize( "$$$/JavaScripts/ImageProcessor/BridgeHelp=Selected files from Bridge will be processed" );
	strButtonCancel = localize("$$$/JavaScripts/ImageProcessor/Cancel=Cancel");
     strFileType = localize( "$$$/JavaScripts/ImageProcessor/FileType=File Type" );
	strPreferences = localize( "$$$/JavaScripts/ImageProcessor/Preferences=Preferences" );
	strRunAction = localize( "$$$/JavaScripts/ImageProcessor/RunAction=R&un Action:" );
	strActionHelp = localize( "$$$/JavaScript/ImageProcessor/ActionHelp=Select an action set and an action" );
	strSaveAsJPEG = localize( "$$$/JavaScripts/ImageProcessor/SaveAsJPEG=Save as &JPEG" );
	strSaveAsJPEGHelp = localize( "$$$/JavaScripts/ImageProcessor/SaveAsJPEGHelp=Save a file to the JPEG format" );
	strQuality = localize( "$$$/JavaScripts/ImageProcessor/Quality=Quality:" );
    strImageCount = localize( "$$$/JavaScripts/ImageProcessor/ImageCount=ImageCount:" );
    strResizeToFit1 = localize( "$$$/JavaScripts/ImageProcessor/ResizeToFit1=&Resize to Fit" );
	strResizeToFit2 = localize( "$$$/JavaScripts/ImageProcessor/ResizeToFit2=R&esize to Fit" );
	strResizeToFit3 = localize( "$$$/JavaScripts/ImageProcessor/ResizeToFit3=Resi&ze to Fit" );
	strResizeToFitHelp = localize( "$$$/JavaScripts/ImageProcessor/ResizeToFitHelp=Select to resize for this format" );
     strMaximize = localize( "$$$/JavaScripts/ImageProcessor/Maximize=&Maximize Compatibility" );
	strMaximizeHelp = localize( "$$$/JavaScripts/ImageProcessor/MaximizeHelp=Maximize compatibility when saving to PSD format" );
     strLZW = localize( "$$$/JavaScripts/ImageProcessor/LZW=LZ&W Compression" );
	strLZWHelp = localize( "$$$/JavaScripts/ImageProcessor/LZWHelp=Use LZW compression when saving in TIFF format" );
	strCopyright = localize( "$$$/JavaScripts/ImageProcessor/Copyright=Delivered By:" );
	strCopyrightHelp = localize( "$$$/JavaScripts/ImageProcessor/CopyrightHelp=Add copyright metadata to your images" );
	strWatermark = localize( "$$$/JavaScripts/ImageProcessor/Watermark=Watermark/Order By:" );
	strWatermarkHelp = localize( "$$$/JavaScripts/ImageProcessor/WatermarkHelp=Add watermark metadata to your images" );
    strW = localize( "$$$/JavaScripts/ImageProcessor/W=W:" );
	strWHelp = localize( "$$$/JavaScripts/ImageProcessor/WHelp=Type in a width to resize image" );
	strH = localize( "$$$/JavaScripts/ImageProcessor/H=H:" );
	strHHelp = localize( "$$$/JavaScripts/ImageProcessor/HHelp=Type in a height to resize image" );
	strPX = localize( "$$$/JavaScripts/ImageProcessor/PX=px" );
	strPickXML = localize( "$$$/JavaScripts/ImageProcessor/PickXML=Pick an XML file to load" );
	strPickXMLWin = localize( "$$$/JavaScripts/ImageProcessor/PickXMLWin=XML Files: *.xml" );
	strPickXMLSave = localize( "$$$/JavaScripts/ImageProcessor/PickXMLSave=Pick an XML file to save" );
	strPickSource = localize( "$$$/JavaScripts/ImageProcessor/PickSource=Pick a source folder" );
	strPickDest = localize( "$$$/JavaScripts/ImageProcessor/PickDest=Pick a destination folder" );
	strSpecifySource = localize( "$$$/JavaScripts/ImageProcessor/SpecifySource=Please specify a source folder." );
	strSpecifyDest = localize( "$$$/JavaScripts/ImageProcessor/SpecifyDest=Please specify a destination folder." );
	strJPEGQuality = localize( "$$$/JavaScripts/ImageProcessor/JPEGQuality=JPEG Quality must be between 0 and 12." );
     strJPEGImageCount = localize( "$$$/JavaScripts/ImageProcessor/JPEGImageCount=JPEG Image Count must be a number and not blank." );
	strJPEGWandH = localize( "$$$/JavaScripts/ImageProcessor/JPEGWandH=You must specify width and height when using resize image options for JPEG." );
	strTIFFWandH = localize( "$$$/JavaScripts/ImageProcessor/TIFFWandH=You must specify width and height when using resize image options for TIFF." );
	strPSDWandH = localize( "$$$/JavaScripts/ImageProcessor/PSDWandH=You must specify width and height when using resize image options for PSD." );
	strOneType = localize( "$$$/JavaScripts/ImageProcessor/OneType=You must save to at least one file type." );
	strWidthAndHeight = localize( "$$$/JavaScripts/ImageProcessor/WidthAndHeight=Width and Height must be defined to use FitImage function!" );
	strMustUse = localize( "$$$/JavaScripts/ImageProcessor/MustUse=You must use Photoshop CS 2 or later to run this script!" );
	strSorry = localize( "$$$/JavaScripts/ImageProcessor/Sorry=Sorry, something major happened and I can't continue! Would you like to see more info?" );
	strCouldNotProcess = localize( "$$$/JavaScripts/ImageProcessor/CouldNotProcess=Sorry, I could not process the following files:^r" );
	strMustSaveOpen = localize( "$$$/JavaScripts/ImageProcessor/MustSaveOpen=Open files must be saved before they can be used by the Image Processor." );
	strFollowing = localize( "$$$/JavaScripts/ImageProcessor/Following=The following files will not be saved." );
	strNoOpenableFiles = localize( "$$$/JavaScripts/ImageProcessor/NoOpenableFiles=There were no source files that could be opened by Photoshop." );
	strCannotWriteToFolder = localize( "$$$/JavaScripts/ImageProcessor/CannotWriteToFolder=I am unable to create a file in this folder. Please check your access rights to this location " );
     strFileAlreadyExists =  localize( "$$$/JavaScripts/ImageProcessor/FileAlreadyExists=The file already exists. Do you want to replace?" );
     strsourceAndDestLength = localize( "$$$/locale_specific/JavaScripts/ImageProcessor/SourceAndDestLength=210" );
	stractionDropDownLength = localize( "$$$/locale_specific/JavaScripts/ImageProcessor/ActionDropDownLength=140" );
}

// given a file name and a list of extensions
// determine if this file is in the list of extensions
function IsFileOneOfThese( inFileName, inArrayOfFileExtensions ) {
	var lastDot = inFileName.toString().lastIndexOf( "." );
	if ( lastDot == -1 ) {
		return false;
	}
	var strLength = inFileName.toString().length;
	var extension = inFileName.toString().substr( lastDot + 1, strLength - lastDot );
	extension = extension.toUpperCase();
	for (var i = 0; i < inArrayOfFileExtensions.length; i++ ) {
		if ( extension == inArrayOfFileExtensions[i] ) {
			return true;
		}
	}
	return false;
}

// given a file name and a list of types
// determine if this file is one of the provided types. Always returns false on platforms other than Mac.
function IsFileOneOfTheseTypes( inFileName, inArrayOfFileTypes ) {
	if ( ! IsMacintoshOS() ) {
		return false;
		}
	var file = new File (inFileName);
	for (var i = 0; i < inArrayOfFileTypes.length; i++ ) {
		if ( file.type == inArrayOfFileTypes[i] ) {
			return true;
		}
	}
	return false;
}

// see if i can write to this folder by making a temp file then deleting it
// what I really need is a "readonly" on the Folder object but that only exists
// on the File object
function IsFolderWritable( inFolder ) {
	var isWritable = false;
	var f = File( inFolder + "deleteme.txt" );
	if ( f.open( "w", "TEXT", "????" ) ) {
		if ( f.write( "delete me" ) ) {
			if ( f.close() ) {
				if ( f.remove() ) {
					isWritable = true;
				}
			}
		}
	}
	return isWritable;
}

// the main class
function ImageProcessor() {

	// load my params from the xml file on disk if it exists
	// this.params["myoptionname"] = myoptionvalue
	// I wrote a very simple xml parser, I'm sure it needs work
	this.LoadParamsFromDisk = function( loadFile ) {
		if ( loadFile.exists ) {
			loadFile.open( "r" );
			var projectSpace = ReadHeader( loadFile );
			if ( projectSpace == GetScriptNameForXML() ) {
				while ( ! loadFile.eof ) {
					var starter = ReadHeader( loadFile );
					var data = ReadData( loadFile );
					var ender = ReadHeader( loadFile );
					if ( ( "/" + starter ) == ender ) {
						this.params[starter] = data;
					}
					// force boolean values to boolean types
					if ( data == "true" || data == "false" ) {
						this.params[starter] = data == "true";
					}
				}
			}
			loadFile.close();
			if ( this.params["version"] != gVersion ) {
				// do something here to fix version conflicts
				// this should do it
				this.params["version"] = gVersion;
			}
		} 
	}

	// save out my params, this is much easier
	this.SaveParamsToDisk = function( saveFile ) {
		saveFile.encoding = "UTF8";
		saveFile.open( "w", "TEXT", "????" );
		// unicode signature, this is UTF16 but will convert to UTF8 "EF BB BF"
		saveFile.write("\uFEFF"); 
		var scriptNameForXML = GetScriptNameForXML();
		saveFile.writeln( "<" + scriptNameForXML + ">" );
		for ( var p in this.params ) {
			saveFile.writeln( "\t<" + p + ">" + this.params[p] + "</" + p + ">" );
		}
		saveFile.writeln( "</" + scriptNameForXML + ">" );
		saveFile.close();
	}

	this.CreateDialog = function() {
	
		// create the main dialog window, this holds all our data
		this.dlgMain = new Window( 'dialog', strTitle );
		
		// create a shortcut for easier typing
		var d = this.dlgMain;
		
        // match our dialog background(s) and foreground(s) with color of the host application
		var brush = d.graphics.newBrush(d.graphics.BrushType.THEME_COLOR, "appDialogBackground");
        d.graphics.backgroundColor = brush;
        d.graphics.disabledBackgroundColor = brush;
		d.graphics.foregroundColor = d.graphics.newPen(d.graphics.PenType.SOLID_COLOR, [1-brush.color[0], 1-brush.color[1], 1-brush.color[2]], brush.color[3]);
		d.graphics.disabledForegroundColor = d.graphics.newPen(d.graphics.PenType.SOLID_COLOR, [brush.color[0]/1.5, brush.color[1]/1.5, brush.color[2]/1.5], brush.color[3]);
		
		d.orientation = 'row';
		d.alignChildren = 'fill';
		
		// to keep everything as compatible as possible with Dr. Brown's Image Processor
		// I will keep most of the important dialog items at the same level
		// and use auto layout

		// some interesting numbers to help the auto layout, real numbers are in the zstrings
		var sourceAndDestLength = StrToIntWithDefault( strsourceAndDestLength, 210 );
		var actionDropDownLength = StrToIntWithDefault( stractionDropDownLength, 140 );		
		var squeezePlay = 5;
		
		d.marginLeft = 15;

		// I use some hidden items to help auto layout
		// change this to see them
		var showHidden = false;
		
		d.grpLeft = d.add( 'group' );
		
		// create a shortcut for easier typing
		var l = d.grpLeft;
		
		l.orientation = 'column';
		l.alignChildren = 'fill';
		l.spacing = 3;
		
		// section 1

		l.grp1 = l.add( 'group' );
		l.grp1.orientation = 'row';
		l.grp1.alignChildren = 'center';

		d.icnOne = l.grp1.add( 'image', undefined, 'Step1Icon' );
		d.icnOne.helpTip = strLabelSource;

		d.stSourceLabel = l.grp1.add( 'statictext', undefined, strLabelSource );
		d.stSourceLabel.helpTip = strLabelSource;

		l.grp1Info = l.add( 'group' );
		l.grp1Info.orientation = 'row';
		l.grp1Info.alignChildren = 'fill';
		l.grp1Info.margins = [d.marginLeft, 0, 0, 0];

		l.grp1Info.grpLeft = l.grp1Info.add( 'group' );
		l.grp1Info.grpLeft.orientation = 'row';
		l.grp1Info.grpLeft.alignChildren = 'fill';

		d.icnSource = l.grp1Info.grpLeft.add( 'image', undefined, 'SourceFolderIcon' );
		d.icnSource.helpTip = strLabelSource;

		l.grp1Info.grpRight = l.grp1Info.add( 'group' );
		l.grp1Info.grpRight.orientation = 'column';
		l.grp1Info.grpRight.alignChildren = 'left';
		l.grp1Info.grpRight.spacing = squeezePlay;

		if ( this.runningFromBridge ) {
			d.stBridge = l.grp1Info.grpRight.add( 'statictext', undefined, strBridge + " (" + this.filesFromBridge.length + ")" );
			d.stBridge.helpTip = strBridgeHelp;
		} else {
			
			l.grpOpenOptions = l.grp1Info.grpRight.add( 'group' );
			l.grpOpenOptions.orientation = 'row';
			l.grpOpenOptions.alignChildren = 'center';

			l.grpSelect = l.grp1Info.grpRight.add( 'group' );
			l.grpSelect.orientation = 'row';
			l.grpSelect.alignChildren = 'center';
			
			d.btnSource = l.grpSelect.add( 'button', undefined, strButtonBrowse1 );
			d.btnSource.helpTip = strLabelSource;
			
			d.stSource = l.grpSelect.add( 'statictext', undefined, strNoImagesSelected, { truncate:'middle' } );
			d.stSource.helpTip = strLabelSourceHelp;
			d.stSource.preferredSize.width = sourceAndDestLength;
		}

		d.line1 = l.add( 'panel', undefined, undefined, {borderStyle: 'sunken'} );
		
		// section 2

		l.grp2 = l.add( 'group' );
		l.grp2.orientation = 'row';
		l.grp2.alignChildren = 'center';

		d.icnTwo = l.grp2.add( 'image', undefined, 'Step2Icon' );
		d.icnTwo.helpTip = strLabelDestination;

		d.stDestination = l.grp2.add( 'statictext', undefined, strLabelDestination );
		d.stDestination.helpTip = strLabelDestination;

		l.grp2Info = l.add( 'group' );
		l.grp2Info.orientation = 'row';
		l.grp2Info.alignChildren = 'fill';
		l.grp2Info.margins = [d.marginLeft, 0, 0, 0];

		l.grp2Info.grpLeft = l.grp2Info.add( 'group' );
		l.grp2Info.grpLeft.orientation = 'row';
		l.grp2Info.grpLeft.alignChildren = 'left';

		d.icnDest = l.grp2Info.grpLeft.add( 'image', undefined, 'DestinationFolderIcon' );
		d.icnDest.helpTip = strLabelDestination;

		l.grp2Info.grpRight = l.grp2Info.add( 'group' );
		l.grp2Info.grpRight.orientation = 'column';
		l.grp2Info.grpRight.alignChildren = 'left';
		l.grp2Info.grpRight.spacing = squeezePlay;

		l.grpSaveOptions = l.grp2Info.grpRight.add( 'group' );
		l.grpSaveOptions.orientation = 'row';
		l.grpSaveOptions.alignChildren = 'center';

		l.grpDestBrowse = l.grp2Info.grpRight.add( 'group' );
		l.grpDestBrowse.orientation = 'row';
		l.grpDestBrowse.alignChildren = 'center';

		d.btnDest = l.grpDestBrowse.add( 'button', undefined, strButtonBrowse2 );
		d.btnDest.helpTip = strLabelDestination;
		
		d.stDest = l.grpDestBrowse.add( 'statictext', undefined, strNoFolderSelected, { truncate:'middle' } );
		d.stDest.helpTip = strLabelDestination;
		d.stDest.preferredSize.width = sourceAndDestLength;

		d.line2 = l.add( 'panel', undefined, undefined, {borderStyle: 'sunken'} );
		
		// section 3
		
		l.grp3 = l.add( 'group' );
		l.grp3.orientation = 'row';
		l.grp3.alignChildren = 'center';

		d.icnThree = l.grp3.add( 'image', undefined, 'Step3Icon' );
		d.icnThree.helpTip = strFileType;

		d.stFileType = l.grp3.add( 'statictext', undefined, strFileType );
		d.stFileType.helpTip = strFileType;

		l.grp3Info = l.add( 'group' );
		l.grp3Info.orientation = 'row';
		l.grp3Info.alignChildren = 'fill';
		l.grp3Info.margins = [d.marginLeft, 0, 0, 0];

		l.grp3Info.grpLeft = l.grp3Info.add( 'group' );
		l.grp3Info.grpLeft.orientation = 'column';
		l.grp3Info.grpLeft.alignChildren = 'left';
		l.grp3Info.grpLeft.spacing = squeezePlay;

		d.icnSpace = l.grp3Info.grpLeft.add( 'image', undefined, 'DestinationFolderIcon' );
		d.icnSpace.helpTip = strLabelDestination;
		d.icnSpace.visible = showHidden;

		l.grp3Info.grpRight = l.grp3Info.add( 'group' );
		l.grp3Info.grpRight.orientation = 'column';
		l.grp3Info.grpRight.alignChildren = 'left';
		l.grp3Info.grpRight.spacing = squeezePlay;

		d.grpFileType = l.grp3Info.grpRight.add( 'group', undefined, strFileType );
		
		// more shortcuts
		var p = d.grpFileType;
		
		p.orientation = 'column';
		p.alignChildren = 'fill';
		p.spacing = squeezePlay;
		
		p.grpJPEG = p.add( 'group' );
		p.grpJPEG.orientation = 'row';
		p.grpJPEG.alignChildren = 'fill';

		p.grpJPEG.grpLeft = p.grpJPEG.add( 'group' );
		p.grpJPEG.grpLeft.orientation = 'column';
		p.grpJPEG.grpLeft.alignChildren = 'fill';

		d.cbJPEG = p.grpJPEG.grpLeft.add( 'checkbox', undefined, strSaveAsJPEG );
		d.cbJPEG.helpTip = strSaveAsJPEGHelp;

		p.grpJPEG.grpLeft.grpJPEG = p.grpJPEG.grpLeft.add( 'group' );
		p.grpJPEG.grpLeft.grpJPEG.orientation = 'column';
		p.grpJPEG.grpLeft.grpJPEG.alignChildren = 'left';
		p.grpJPEG.grpLeft.grpJPEG.margins = [d.marginLeft, 0, 0, 0];

		p.grpJPEG.grpLeft.grpQ = p.grpJPEG.grpLeft.grpJPEG.add( 'group' );
		p.grpJPEG.grpLeft.grpQ.orientation = 'row';
		p.grpJPEG.grpLeft.grpQ.alignChildren = 'center';

		d.stQuality = p.grpJPEG.grpLeft.grpQ.add( 'statictext', undefined, strQuality );
		d.etQuality = p.grpJPEG.grpLeft.grpQ.add( 'edittext' );
		d.etQuality.characters = 3;
		d.etQuality.graphics.disabledBackgroundColor = brush;

		p.grpJPEG.grpLeft.grpJPEG.grpImageCount = p.grpJPEG.grpLeft.grpJPEG.add( 'group' );
		p.grpJPEG.grpLeft.grpJPEG.grpImageCount.orientation = 'row';
		p.grpJPEG.grpLeft.grpJPEG.grpImageCount.alignChildren = 'center';        
        
 	    d.stImageCount = p.grpJPEG.grpLeft.grpJPEG.grpImageCount.add( 'statictext', undefined, strImageCount );
		d.etImageCount = p.grpJPEG.grpLeft.grpJPEG.grpImageCount.add( 'edittext' );
		d.etImageCount.characters = 3;
		d.etImageCount.graphics.disabledBackgroundColor = brush;

		d.line3 = l.add( 'panel', undefined, undefined, {borderStyle: 'sunken'} );
		d.line3.alignment = 'fill';

		// section 4 

		l.grp4 = l.add( 'group' );
		l.grp4.orientation = 'row';
		l.grp4.alignChildren = 'top';
		
		l.grp4.grpLeft = l.grp4.add( 'group' );
		l.grp4.grpLeft.orientation = 'column';
		l.grp4.grpLeft.alignChildren = 'left';

		d.icnFour = l.grp4.grpLeft.add( 'image', undefined, 'Step4Icon' );
		d.icnFour.helpTip = strPreferences;

		l.grp4.grpRight = l.grp4.add( 'group' );
		l.grp4.grpRight.orientation = 'column';
		l.grp4.grpRight.alignChildren = 'left';

		d.stPreferences = l.grp4.grpRight.add( 'statictext', undefined, strPreferences );
		d.stPreferences.helpTip = strPreferences;

		l.grp4Info = l.grp4.grpRight.add( 'group' );
		l.grp4Info.orientation = 'row';
		l.grp4Info.alignChildren = 'top';
		
		l.grp4Info.grpLeft = l.grp4Info.add( 'group' );
		l.grp4Info.grpLeft.orientation = 'column';
		l.grp4Info.grpLeft.alignChildren = 'left';
		l.grp4Info.grpLeft.spacing = 5;

		l.grpAction = l.grp4Info.grpLeft.add( 'group' );
		l.grpAction.orientation = 'row';
		l.grpAction.alignChildren = 'center';

		l.grp4Info.grpRight = l.grp4Info.add( 'group' );
		l.grp4Info.grpRight.orientation = 'column';
		l.grp4Info.grpRight.alignChildren = 'left';
		l.grp4Info.grpRight.spacing = 5;

		l.grpCopyright = l.grp4Info.grpLeft.add( 'group' );
		l.grpCopyright.orientation = 'row';
		l.grpCopyright.alignChildren = 'center';
        
		d.stCopyrightInfo = l.grpCopyright.add( 'statictext', undefined, 'Delivered by:' );
		d.stCopyrightInfo.helpTip = 'Date of delivery to school';
		
		d.hidden5 = l.grpCopyright.add( 'edittext' );
		d.hidden5.preferredSize.width = 1;
		d.hidden5.visible = showHidden;

		d.etCopyrightInfo = l.grp4Info.grpRight.add( 'edittext' );
		d.etCopyrightInfo.helpTip =  'Date of delivery to school';;
		d.etCopyrightInfo.alignment = 'fill';
		d.etCopyrightInfo.preferredSize.width = 250 //actionDropDownLength * 2;

		l.grpWatermark = l.grp4Info.grpLeft.add( 'group' );
		l.grpWatermark.orientation = 'row';
		l.grpWatermark.alignChildren = 'center';

		d.stWatermark = l.grpWatermark.add( 'statictext', undefined, strWatermark );
		d.stWatermark.helpTip = strWatermarkHelp; 
        
         d.hidden6 = l.grpCopyright.add( 'edittext' );
		d.hidden6.preferredSize.width = 1;
		d.hidden6.visible = showHidden;
        
		d.etWatermark = l.grp4Info.grpRight.add( 'edittext' );
		d.etWatermark.helpTip = strWatermarkHelp;
		d.etWatermark.alignment = 'fill';
		d.etWatermark.preferredSize.width = 250 //actionDropDownLength * 2;
               
         ///////////////////////////////////////////////////////////////////////////
         l.grpTemplate = l.grp4Info.grpLeft.add( 'group' );
		l.grpTemplate.orientation = 'row';
		l.grpTemplate.alignChildren = 'center';
        
		d.stTemplate = l.grpTemplate.add( 'statictext', undefined, 'Template' );
		d.stTemplate.helpTip = 'Select template to use'; 
        
         d.hidden6 = l.grpTemplate.add( 'edittext' );
		d.hidden6.preferredSize.width = 1;
		d.hidden6.visible = showHidden;
     
		d.ddTemplate = l.grp4Info.grpRight.add( 'dropdownlist' );
		d.ddTemplate.helpTip = 'Select template to use';
		d.ddTemplate.preferredSize.width = 250 //actionDropDownLength * 2;
        ////////////////////////////////////////////////////////////////////////////   

		// buttons on the right side of the dialog
		
		d.grpRight = d.add( 'group' );
		d.grpRight.orientation = 'column';
		d.grpRight.alignChildren = 'fill';
		d.grpRight.alignment = 'fill';

		d.btnRun = d.grpRight.add( 'button', undefined, strButtonRun );
		d.btnCancel = d.grpRight.add( 'button', undefined, strButtonCancel );
		d.stFake = d.grpRight.add( 'statictext', undefined, '' );

		d.defaultElement = d.btnRun;
		d.cancelElement = d.btnCancel;
	}

	// transfer from the default settings or settings I read off disk to the dialog widgets
	this.InitDialog = function() {

		var d = this.dlgMain;
		var p = this.params;
		
		this.dlgMain.ip = this;
		d.loadFromDisk = true;
		
		if ( ! this.runningFromBridge ) {
			d.stSource.text = p["source"];
			if ( d.stSource.text == "" ) {
				d.stSource.text = strNoImagesSelected;
			}
		}
		d.sourceLongText = p["source"];
		d.stDest.text = p["dest"];
		if ( d.stDest.text == "" ) {
			d.stDest.text = strNoFolderSelected;
		}
		d.destLongText = p["dest"];
		d.cbJPEG.value = p["jpeg"];
		d.etQuality.text = p["q"];
         d.etImageCount.text = p["imagecount"];
		d.etCopyrightInfo.text = p["info"];
         d.etWatermark.text = p["watermark"];
         d.ddTemplate.selection.text = p["template"];
	}

	// pretend like i clicked it to get the other items to respond to the current settings
	this.ForceDialogUpdate = function() {	
		this.dlgMain.cbJPEG.onClick();
	}

	// transfer from the dialog widgets to my internal params
	this.GetParamsFromDialog = function() {
		
		var p = this.params;
		var d = this.dlgMain;
		
		if ( ! this.runningFromBridge ) {
             p["source"] = d.sourceLongText;
		}
		p["dest"] = d.destLongText;
		p["jpeg"] = d.cbJPEG.value;
		p["q"] = d.etQuality.text;
         p["info"] = d.etCopyrightInfo.text;
         p["watermark"] = d.etWatermark.text;
         p["template"] = d.ddTemplate.selection.text;
         p["imagecount"] = d.etImageCount.text;
	}
	
	// routine for running the dialog and it's interactions
	this.RunDialog = function () {

		this.dlgMain.btnCancel.onClick = function() { 
			var d = FindDialog( this );
			d.close( gCancelButtonID );
		}

		// help auto layout
		this.dlgMain.onShow = function() {

			this.grpLeft.grp1Info.grpRight.bounds.right += this.marginLeft;
			
			var p = this.grpFileType;

			// align the ":" and edit text boxes for the resize numbers
			if ( p.grpJPEG.grpRight.grpH.bounds.width < p.grpJPEG.grpRight.grpW.bounds.width ) {
				var mover = p.grpJPEG.grpRight.grpW.bounds.width - p.grpJPEG.grpRight.grpH.bounds.width;

				p.grpJPEG.grpRight.grpH.bounds.right += mover;
				this.stResizeJPEGH.location.x += mover;
				this.etResizeJPEGH.location.x += mover;
				this.stResizeJPEGPXH.location.x += mover;
			} else {
				var mover = p.grpJPEG.grpRight.grpH.bounds.width - p.grpJPEG.grpRight.grpW.bounds.width;

				p.grpJPEG.grpRight.grpW.bounds.right += mover;
				this.stResizeJPEGW.location.x += mover;
				this.etResizeJPEGW.location.x += mover;
				this.stResizeJPEGPXW.location.x += mover;
			}
			
			// align the resize groups
			var farRight = p.grpJPEG.grpRight.location.x;

			p.grpJPEG.grpRight.location.x = farRight;

			// make the copyright and action drop downs as large as possible
			// and align them with the third line
			var leftAdjuster = this.etCopyrightInfo.parent.bounds.left;
			leftAdjuster += this.etCopyrightInfo.parent.parent.bounds.left;
			leftAdjuster += this.etCopyrightInfo.parent.parent.parent.bounds.left;

			var mover = this.line3.bounds.right - this.etCopyrightInfo.bounds.right;
			mover -= leftAdjuster;

			this.etCopyrightInfo.bounds.right += mover;

			// make all the parents bigger to fit the new size of the copyright
			this.etCopyrightInfo.parent.bounds.right += mover;
			this.etCopyrightInfo.parent.parent.bounds.right += mover;
			this.etCopyrightInfo.parent.parent.parent.bounds.right += mover;

			// split the adjustment above into the two dropdowns
			// make sure the right edges line up by looking at the oddness
			var halfMover = mover / 2;
			var isOdd = halfMover % 2 ? true : false;
		}
		
		if ( ! this.runningFromBridge ) {
			this.dlgMain.btnSource.onClick = function() { 
				var d = FindDialog( this );
				var selFolder = Folder.selectDialog( strPickSource, d.sourceLongText );
				if ( selFolder != null ) {
					d.sourceLongText = selFolder.fsName.toString()
					d.stSource.text = d.sourceLongText;
				}
				d.defaultElement.active = true;
			}

		}

		this.dlgMain.SetDropDown = function ( dd, strSet ) {
			var index = 0;
			for ( var i = 0; i < dd.items.length; i++ ) {
				if ( dd.items[ i ].toString() == strSet ) {
					index = i;
					break;
				}
			}
			if ( dd.items.length > 0 ) {
				dd.items[ index ].selected = true;
			}
			return index;
		}

		this.dlgMain.btnDest.onClick = function() { 
			var d = FindDialog( this );
			var selFolder = Folder.selectDialog( strPickDest, d.destLongText );
			if ( selFolder != null ) {
				d.destLongText = selFolder.fsName.toString()
				d.stDest.text = d.destLongText;
			}
			d.defaultElement.active = true;
		}
		
		this.dlgMain.cbJPEG.onClick = function() {
			var d = FindDialog( this );
			d.stQuality.enabled = this.value;
			d.etQuality.enabled = this.value;
             d.stImageCount.enabled = this.value;
             d.etImageCount.enabled = this.value;
		}
    
         //populate template drop down using file names in tempates folder
          var templateFolder = new Folder('C:\\Adobe\\templates');
          
          //get all templates
          var templateArray = templateFolder.getFiles();    
          
          //populate template drop down
          for ( var i = 0; i < templateArray.length; i++ ) {
              this.dlgMain.ddTemplate.add( "item", templateArray[i].name.replace(/%20/g, ' ') );
          }   
      
          //set the display values for the drop down
          this.dlgMain.SetDropDown( this.dlgMain.ddTemplate, this.params["template"] );

		this.dlgMain.btnRun.onClick = function () {
			var testFolder = null;
			var d = FindDialog( this );
			if ( ! this.runningFromBridge ) {
					if ( d.sourceLongText.length > 0 && d.sourceLongText[0] != '.' ) {
						testFolder = new Folder( d.sourceLongText );
						if ( !testFolder.exists ) {
							alert( strSpecifySource );
							return;
						}
					} else {
						alert( strSpecifySource );
						return;
					}
			}

				if ( d.destLongText.length > 0 && d.destLongText[0] != '.' ) {
					testFolder = new Folder( d.destLongText );
					if ( !testFolder.exists ) {
						alert( strSpecifyDest );
						return;
					}
				} else {
					alert( strSpecifyDest );
					return;
				}
						
			if ( d.cbJPEG.value ) {
				var q = Number( d.etQuality.text );
				if ( q < 0 || q > 12 || isNaN( q ) || d.etQuality.text.length == 0 ) {
					alert( strJPEGQuality );
					return;
				}

                  var q = Number( d.etImageCount.text );
				if ( isNaN( q ) || d.etImageCount.text.length == 0 ) {
					alert( strJPEGImageCount );
					return;
				}
			}

			// make sure they have at least one file format specified for output
			var outputCount = 0;
			if ( d.cbJPEG.value ) {
				outputCount++;
			}

			if ( outputCount == 0 ) {
				alert( strOneType );
				return;
			}

			d.ip.GetParamsFromDialog()
			
			d.close( gRunButtonID );
		}

		this.InitDialog();

		this.ForceDialogUpdate();
		
		// in case we double clicked the file
		app.bringToFront();

		this.dlgMain.center();
		
		return this.dlgMain.show();

	}

	// if I get here then the dialog params are ok and it is time
	// to do what they want
	// the heart of the script is this routine
	// loop through all the files and save accordingly
	this.Execute = function()  {
		var cameraRawParams = new Object();
		cameraRawParams.desc = undefined;
		cameraRawParams.useDescriptor = false;
		
		var inputFiles;
		if ( this.runningFromBridge ) {
			inputFiles = this.filesFromBridge;
		} else if ( this.params["useopen"] ) {
			inputFiles = OpenDocs();
		} else  {
			inputFiles = new Array();
			inputFiles = FindAllFiles( this.params["source"], inputFiles );
		} 
            
		for (var i = 0; i < inputFiles.length; i++) {

			try {
				if ( ( inputFiles[i] instanceof File && 
					! inputFiles[i].hidden ) || 
					this.params["useopen"] ) {

					if ( this.runningFromBridge ) {
						cameraRawParams.fileName = inputFiles[i].absoluteURI.toString();
						this.params["source"] = inputFiles[i].path.toString();
						// Change the source path to an URI.
						this.params["source"] = Folder(this.params["source"]).absoluteURI.toString();
					} else if ( this.params["useopen"]  ) {
						cameraRawParams.fileName = inputFiles[i].fullName.absoluteURI.toString(); 
						this.params["source"] = inputFiles[i].path.toString();
						// Change the source path to an URI.
						this.params["source"] = Folder(this.params["source"]).absoluteURI.toString();					
					} else {
						cameraRawParams.fileName = inputFiles[i].absoluteURI.toString();
						// Change the source path to an URI.
						this.params["source"] = Folder(this.params["source"]).absoluteURI.toString();
					}

					if (IsFileOneOfThese( cameraRawParams.fileName, gFileExtensionsToRead ) ||
				 		IsFileOneOfTheseTypes( cameraRawParams.fileName, gFileTypesToRead ) ) {
						gFoundFileToProcess = true;
						if ( ! this.runningFromBridge && this.params["useopen"] ) {
							app.activeDocument = inputFiles[ i ];
							app.activeDocument.duplicate();
						} else {
							if ( ! gOpenedFirstCR && this.params["open"] && IsFileOneOfThese( cameraRawParams.fileName, gFilesForCameraRaw ) ){
								// this is the first CR file and the user elected to open it and choose settings to apply to the
								// rest of the CR files
								gOpenedFirstCR = true;
								cameraRawParams.useDescriptor = true;
								this.OpenCameraRaw( cameraRawParams, true )
							} else {
								this.OpenCameraRaw( cameraRawParams, false, DialogModes.NO );
							}
						}

						this.AdjustFile( cameraRawParams );

                            var destFolder = inputFiles[i].parent.toString();
                            if ( ! this.runningFromBridge && this.params["useopen"] ) {
                                var destFolder = inputFiles[i].fullName.parent.toString();
                            }

						this.SaveFile( cameraRawParams.fileName, destFolder  );
						app.activeDocument.close( SaveOptions.DONOTSAVECHANGES );
					}
				}
			}
			// don't let one file spoil the party!
			// trying to stop on user cancel is a problem
			// during the open of a large file the error we get is no such element
			// and not the actual cancel 8007
			// it's all about timing, hit the cancel right after a document opens
			// and all is well and you get the cancel and everything stops
			catch( e ) {
				if ( e.number == 8007 ) { // stop only on cancel
					break;
				}
				this.fileErrors.push( inputFiles[i] );
			}
		}

        if ( ! gFoundFileToProcess )
			alert( strNoOpenableFiles );

		// crash on quit when running from bridge
		cameraRawParams.desc = null;
		$.gc();

	}
	
	// using the dialog adjust the active document
	this.AdjustFile = function ( inOutCameraRawParams ) {
        if (app.documents.length > 0) {
            var docRef = app.activeDocument;

            if ( this.params["info"] != "" ) {
                docRef.info.copyrightNotice = this.params["info"];
                docRef.info.copyrighted = CopyrightedType.COPYRIGHTEDWORK;
            }
        }
	}
	
	// I can save in three formats, JPEG, PSD, TIFF
	this.SaveFile = function ( inFileName, inFolderLocation ) {
		var lastDot = inFileName.lastIndexOf( "." );
		if ( lastDot == -1 ) {
			lastDot = inFileName.length;
		}
		var fileNameNoPath = inFileName.substr( 0, lastDot );
		var lastSlash = fileNameNoPath.lastIndexOf( "/" );
		fileNameNoPath = fileNameNoPath.substr( lastSlash + 1, fileNameNoPath.length );
		var filePathNoName = inFileName.substr( 0 , lastSlash );
		if ( this.params["jpeg"] ) {
			var subFolderText = inFolderLocation + "/JPEG/";
			Folder( subFolderText ).create();
			var historyState = app.activeDocument.activeHistoryState;
			app.activeDocument.flatten();
			app.activeDocument.bitsPerChannel = BitsPerChannelType.EIGHT;
			RemoveAlphaChannels();
			if ( this.params["jpegresize"] ) {
				FitImage( this.params["jpegw"], this.params["jpegh"] ); 
			}
			if ( this.params["runaction"] ) {
				doAction( this.params["action"], this.params["actionset"] );
                app.activeDocument.flatten();
                app.activeDocument.bitsPerChannel = BitsPerChannelType.EIGHT;
                RemoveAlphaChannels();
			}
			var uniqueFileName = CreateUniqueFileName( subFolderText, fileNameNoPath, ".jpg" );
			if ( ! IsFolderWritable( subFolderText ) ) {
				alert( strCannotWriteToFolder + File( subFolderText ).fsName );
			} else {
				SaveAsJPEG( uniqueFileName, this.params["q"] );
			}
			app.activeDocument.activeHistoryState = historyState;
		}
	}
		
	// open a camera raw file returning the camera raw action desc
	this.OpenCameraRaw = function( inOutCameraRawParams, updateCRDesc, inDialogMode ) {
		var keyNull = charIDToTypeID( 'null' );
		var keyAs = charIDToTypeID( 'As  ' );
		var adobeCameraRawID = stringIDToTypeID( "Adobe Camera Raw" );
		var desc = new ActionDescriptor();
		desc.putPath( keyNull, File( inOutCameraRawParams.fileName ) );
		if ( inOutCameraRawParams.desc != undefined && inOutCameraRawParams.useDescriptor &&
		     IsFileOneOfThese( inOutCameraRawParams.fileName, gFilesForCameraRaw ) ) {
			desc.putObject( keyAs, adobeCameraRawID, inOutCameraRawParams.desc );
		}
		if ( inDialogMode == undefined ) {
			inDialogMode = DialogModes.ALL;
			
			// Suppress choose file dialog.
			var overrideOpenID = stringIDToTypeID( 'overrideOpen' );
			desc.putBoolean( overrideOpenID, true );
		}
		var returnDesc = executeAction( charIDToTypeID( 'Opn ' ), desc, inDialogMode );
		if ( returnDesc.hasKey( keyAs ) ) {
			if (updateCRDesc)
				inOutCameraRawParams.desc = returnDesc.getObjectValue( keyAs, adobeCameraRawID );
			if ( returnDesc.hasKey( keyNull ) ) {
				inOutCameraRawParams.fileName = returnDesc.getPath( keyNull ).toString();
				return true;
			}
		}
		return false;
	}
	
	// given a folder return the first valid file in that folder
	this.GetFirstFile = function ( inFolder ) {
		if ( inFolder.length > 0 && inFolder[0] != '.' ) {
			var fileList = Folder( inFolder ).getFiles();
			for ( var i = 0; i < fileList.length; i++) {
				if ( fileList[i] instanceof File && ! fileList[i].hidden &&
					(IsFileOneOfThese( fileList[i], gFileExtensionsToRead ) ||
					 IsFileOneOfTheseTypes( fileList[i], gFileTypesToRead ) ) ) {
					return fileList[i].toString();
				}
			}
		}
		return "";
	}
	
	///////////////////////////////////////////////////////////////////////////
	// Function: ConfigForBridge
	// Usage: see if the Bridge app is running this script
	// Input: gFilesFromBridge is a variable that is defined in photoshop.jsx
	// Return: runningFromBridge and filesFromBridge are initialized
	///////////////////////////////////////////////////////////////////////////
	this.ConfigForBridge = function() {
		if ( typeof( gFilesFromBridge ) != "undefined" ) {
			this.filesFromBridge = gFilesFromBridge;
			if ( this.filesFromBridge.length > 0 ) {
				this.runningFromBridge = true;
			} else {
				this.runningFromBridge = false;
			}
		} else { 
			this.runningFromBridge = false;
			this.filesFromBridge = undefined;
		}
	}

	///////////////////////////////////////////////////////////////////////////
	// Function: ReportErrors
	// Usage: pop the name of the files we had trouble with
	// Input:
	// Return:
	///////////////////////////////////////////////////////////////////////////
	this.ReportErrors = function() {
		if ( this.fileErrors.length ) {
			var message = strCouldNotProcess;
			for ( var i = 0; i < this.fileErrors.length; i++ ) {
				message += File( this.fileErrors[i] ).fsName + "\r";
			}
			alert( message );
		}
	}

	// initialize properties
	this.fileErrors = new Array();
	this.params = g_initParams.initParams();
	this.actionInfo = GetActionSetInfo();
	this.ConfigForBridge();	
}


//~ function SaveAsJPEG( inFileName, inQuality, inEmbedICC ) {
function SaveAsJPEG( inFileName, inQuality ) {
	var jpegOptions = new JPEGSaveOptions();
	jpegOptions.quality = inQuality;
	jpegOptions.embedColorProfile = false;
	app.activeDocument.saveAs( File( inFileName ), jpegOptions );
}

// use the fit image automation plug-in to do this work for me
function FitImage( inWidth, inHeight ) {
	if ( inWidth == undefined || inHeight == undefined ) {
		alert( strWidthAndHeight );
		return;
	}
	var desc = new ActionDescriptor();
	var unitPixels = charIDToTypeID( '#Pxl' );
	desc.putUnitDouble( charIDToTypeID( 'Wdth' ), unitPixels, inWidth );
	desc.putUnitDouble( charIDToTypeID( 'Hght' ), unitPixels, inHeight );
	var runtimeEventID = stringIDToTypeID( "3caa3434-cb67-11d1-bc43-0060b0a13dc4" );	
	executeAction( runtimeEventID, desc, DialogModes.NO );
}

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
}

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
}

///////////////////////////////////////////////////////////////////////////////
// Function: CheckVersion
// Usage: Check our minimum requirement for a host version
// Input: <none> Photoshop should be our target environment but i just look at the version
// Return: throws an error if we do not pass
///////////////////////////////////////////////////////////////////////////////
function CheckVersion() {
	var numberArray = version.split(".");
	if ( numberArray[0] < 9 ) {
		alert( strMustUse );
		throw( strMustUse );
	}
}

///////////////////////////////////////////////////////////////////////////
// Function: StrToIntWithDefault
// Usage: convert a string to a number, first stripping all characters
// Input: string and a default number
// Return: a number
///////////////////////////////////////////////////////////////////////////
function StrToIntWithDefault( s, n ) {
    var onlyNumbers = /[^0-9]/g;
    var t = s.replace( onlyNumbers, "" );
	t = parseInt( t );
	if ( ! isNaN( t ) ) {
        n = t;
    }
    return n;
}

///////////////////////////////////////////////////////////////////////////////
// Function: CreateUniqueFileName
// Usage: Given a folder, filename, and extension, come up with a unique file name
// using a numbering system
// Input: string for folder, fileName, and extension, extension contains the "."
// Return: string for the full path to the unique file
///////////////////////////////////////////////////////////////////////////////
function CreateUniqueFileName( inFolder, inFileName, inExtension ) {
	inFileName = inFileName.replace(/[:\/\\*\?\"\<\>\|]/g, "_");  // '/\:*?"<>|' -> '_'
	var uniqueFileName = inFolder + inFileName + inExtension;
	var fileNumber = 1;
	while ( File( uniqueFileName ).exists ) {
		uniqueFileName = inFolder + inFileName + "_" + fileNumber + inExtension;
		fileNumber++;
	}
	return uniqueFileName;
}

///////////////////////////////////////////////////////////////////////////////
// Function: IsWindowsOS
// Usage: Are we running on the Windows OS?
// Input: <none>
// Return: true if on a Windows
///////////////////////////////////////////////////////////////////////////////
function IsWindowsOS() {
	if ( $.os.search(/windows/i) != -1 ) {
		return true;
	} else {
		return false;
	}
}

///////////////////////////////////////////////////////////////////////////////
// Function: IsMacintoshOS
// Usage: Are we running on the Macintosh OS?
// Input: <none>
// Return: true if on a macintosh
///////////////////////////////////////////////////////////////////////////////
function IsMacintoshOS() {
	if ( $.os.search(/macintosh/i) != -1 ) {
		return true;
	} else {
		return false;
	}
}

///////////////////////////////////////////////////////////////////////////////
// Function: RemoveAlphaChannels
// Usage: Remove all of the extra channels from the current document
// Input: <none> (must be an active document)
// Return: <none> activeDocument now has only component channels
///////////////////////////////////////////////////////////////////////////////
function RemoveAlphaChannels() {
	var channels = app.activeDocument.channels;
	var channelCount = channels.length - 1;
	while ( channels[channelCount].kind != ChannelType.COMPONENT ) {
		channels[channelCount].remove();
		channelCount--;
	}
}

///////////////////////////////////////////////////////////////////////////////
// Function: GetScriptNameForXML
// Usage: From my file name, get the XML version
// Input: <none>
// Return: String for XML version of my script, taken from strTitle which is a global
// NOTE: you can't save certain characters in xml, strip them here
// this list is not complete
///////////////////////////////////////////////////////////////////////////////
function GetScriptNameForXML () {
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
}


/////////////////////////////////////////////////////////////////////
// Function: MacXMLFilter
// Input: f, file or folder to check
// Return: true or false, true if file or folder is to be displayed
/////////////////////////////////////////////////////////////////////
function MacXMLFilter( f )
{
	var xmlExtension = ".xml";
	var lCaseName = f.name;
	lCaseName.toLowerCase();
	if ( lCaseName.indexOf( xmlExtension ) == f.name.length - xmlExtension.length )
		return true;
	else if ( f.type == 'TEXT' )
		return true;
	else if ( f instanceof Folder )
		return true;
	else
		return false;
}

///////////////////////////////////////////////////////////////////////////////
// Function: GetDefaultParamsFile
// Usage: Find my default settings, this is last ran values
// Input: <none>
// Return: File to my default settings
///////////////////////////////////////////////////////////////////////////////
function GetDefaultParamsFile() {    
    return ( new File( "C:/Adobe/settings/ProcessSchool.xml" ) );
//~     var currentPath = (new File($.fileName)).path;
//~     return ( new File( currentPath + "/scripts/" + strTitle + ".xml" ) );
}

///////////////////////////////////////////////////////////////////////////////
// Function: FindDialog
// Usage: From a deeply grouped dialog item go up til you find the parent dialog
// Input: Current dialog item, an actual item or a group
// Return: top parent dialog
///////////////////////////////////////////////////////////////////////////////
function FindDialog( inItem ) {
	var w = inItem;
	while ( 'dialog' != w.type ) {
		if ( undefined == w.parent ) {
			w = null;
			break;
		}
		w = w.parent;
	}
	return w;
}

///////////////////////////////////////////////////////////////////////////////
// Function: GetFilesFromBridge
// Usage: Use this to retrieve the current files from the Bridge application
// Input: <none>
// Return: arary of the current documents that have file paths
// NOTE: I don't use this routine as I run differently only when called from 
// the Bridge, see photoshop.jsx
///////////////////////////////////////////////////////////////////////////////
function GetFilesFromBridge() {
	var fileList;
	if ( BridgeTalk.isRunning( "bridge" ) ) {
		var bt = new BridgeTalk();
		bt.target = "bridge";
		bt.body = "var theFiles = photoshop.getBridgeFileListForAutomateCommand();theFiles.toSource();";
		bt.onResult = function( inBT ) { fileList = eval( inBT.body ); }
		bt.onError = function( inBT ) { fileList = new Array(); }
		bt.send();
		bt.pump();
		$.sleep( 100 );
		var timeOutAt = ( new Date() ).getTime() + 5000;
		var currentTime = ( new Date() ).getTime();
		while ( ( currentTime < timeOutAt ) && ( undefined == fileList ) ) {
			bt.pump();
			$.sleep( 100 );
			currentTime = ( new Date() ).getTime();
		}
	}
	if ( undefined == fileList ) {
		fileList = new Array();
	}
	return fileList; 
}


///////////////////////////////////////////////////////////////////////////////
// Function: GetActionSetInfo
// Usage: walk all the items in the action palette and record the action set
//        names and all the action children
// Input: <none>
// Return: the array of all the ActionData
// Note: This will throw an error during a normal execution. There is a bug
// in Photoshop that makes it impossible to get an acurate count of the number
// of action sets.
///////////////////////////////////////////////////////////////////////////////
function GetActionSetInfo() {
	var actionSetInfo = new Array();
	var setCounter = 1;
  	while ( true ) {
		var ref = new ActionReference();
		ref.putIndex( gClassActionSet, setCounter );
		var desc = undefined;
		try { desc = executeActionGet( ref ); }
		catch( e ) { break; }
		var actionData = new ActionData();
		if ( desc.hasKey( gKeyName ) ) {
			actionData.name = desc.getString( gKeyName );
		}
		var numberChildren = 0;
		if ( desc.hasKey( gKeyNumberOfChildren ) ) {
			numberChildren = desc.getInteger( gKeyNumberOfChildren );
		}
		if ( numberChildren ) {
			actionData.children = GetActionInfo( setCounter, numberChildren );
			actionSetInfo.push( actionData );
		}
		setCounter++;
	}
	return actionSetInfo;
}


///////////////////////////////////////////////////////////////////////////////
// Function: GetActionInfo
// Usage: used when walking through all the actions in the action set
// Input: action set index, number of actions in this action set
// Return: true or false, true if file or folder is to be displayed
///////////////////////////////////////////////////////////////////////////////
function GetActionInfo( setIndex, numChildren ) {
	var actionInfo = new Array();
	for ( var i = 1; i <= numChildren; i++ ) {
		var ref = new ActionReference();
		ref.putIndex( gClassAction, i );
		ref.putIndex( gClassActionSet, setIndex );
		var desc = undefined;
		desc = executeActionGet( ref );
		var actionData = new ActionData();
		if ( desc.hasKey( gKeyName ) ) {
			actionData.name = desc.getString( gKeyName );
		}
		var numberChildren = 0;
		if ( desc.hasKey( gKeyNumberOfChildren ) ) {
			numberChildren = desc.getInteger( gKeyNumberOfChildren );
		}
		actionInfo.push( actionData );
	}
	return actionInfo;
}


///////////////////////////////////////////////////////////////////////////////
// Function: ActionData
// Usage: this could be an action set or an action
// Input: <none>
// Return: a new Object of ActionData
///////////////////////////////////////////////////////////////////////////////
function ActionData() {
	this.name = "";
	this.children = undefined;
	this.toString = function () {
		var strTemp = this.name;
		if ( undefined != this.children ) {
			for ( var i = 0; i < this.children.length; i++ ) {
				strTemp += " " + this.children[i].toString();
			}
		}
		return strTemp;
	}
}

///////////////////////////////////////////////////////////////////////////////
// Function: OpenDocs
// Usage: we want the current open documents that have a path
// Input: <none>
// Return: arary of the current documents that have file paths
// NOTE: We want the current open documents that have a path
// if I do inputFiles = documents then I have a reference
// and if I add documents it also adds them to my inputFiles
// I want to copy the current state
///////////////////////////////////////////////////////////////////////////////
function OpenDocs() {
	var docs = new Array();
	var i = 0;
	var docIndex = 0;
	var alertNonSavedDocs = false;
	var nonSavedDocs = new Array();
	for ( var i = 0; i < app.documents.length; i++ ) {
		try {
			var temp = app.documents[ i ].name;
			docs[ docIndex ] = app.documents[ i ];
			docIndex++;
		}
		catch( e ) {
			if ( e.number == 8103 ) { // this document has not been saved
				alertNonSavedDocs = true;
				nonSavedDocs.push( app.documents[ i ].name );
			} else {
				throw e;
			}
		}
	}
	if ( alertNonSavedDocs ) {
		alert( strMustSaveOpen + "\r" + strFollowing + "\r( " + nonSavedDocs + " )" );
	}
	return docs;
}

///////////////////////////////////////////////////////////////////////////////
// Function: FindAllFiles
// Usage: Find all the files in the given folder recursively
// Input: srcFolder is a string to a folder
//		  destArray is an Array of File objects
// Return: Array of File objects, same as destArray
///////////////////////////////////////////////////////////////////////////////
function FindAllFiles( srcFolderStr, destArray ) {
	var fileFolderArray = Folder( srcFolderStr ).getFiles();

	for ( var i = 0; i < fileFolderArray.length; i++ ) {
		var fileFoldObj = fileFolderArray[i];
		if ( fileFoldObj instanceof File ) {
			destArray.push( fileFoldObj );
		} else { // folder
			FindAllFiles( fileFoldObj.toString(), destArray );
		}
	}

	return destArray;
}

///////////////////////////////////////////////////////////////////////////////
// Function: NumericEditKeyboardHandler
// Usage: Do not allow anything except for numbers 0-9
// Input: ScriptUI keydown event
// Return: <nothing> key is rejected and beep is sounded if invalid
///////////////////////////////////////////////////////////////////////////////
function NumericEditKeyboardHandler (event) {
    try {
        var keyIsOK = KeyIsNumeric (event) || 
		              KeyIsDelete (event) || 
					  KeyIsLRArrow (event) ||
					  KeyIsTabEnterEscape (event);
					  
        if (! keyIsOK) {
            //    Bad input: tell ScriptUI not to accept the keydown event
            event.preventDefault();
            /*    Notify user of invalid input: make sure NOT
                to put up an alert dialog or do anything which
                requires user interaction, because that
                interferes with preventing the 'default'
                action for the keydown event */
            app.beep();
        }
    }
    catch (e) {
        ; // alert ("Ack! bug in NumericEditKeyboardHandler: " + e);
    }
}


//    key identifier functions
function KeyHasModifier (event) {
    return event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
}

function KeyIsNumeric (event) {
    return  (event.keyName >= '0') && (event.keyName <= '9') && ! KeyHasModifier (event);
}

function KeyIsDelete (event) {
    //    Shift-delete is ok
    return ((event.keyName == 'Backspace') || (event.keyName == 'Delete')) && ! (event.ctrlKey);
}

function KeyIsLRArrow (event) {
    return ((event.keyName == 'Left') || (event.keyName == 'Right')) && ! (event.altKey || event.metaKey);
}

function KeyIsTabEnterEscape (event) {
	return event.keyName == 'Tab' || event.keyName == 'Enter' || event.keyName == 'Escape';
}

// End Image Processor.jsx
