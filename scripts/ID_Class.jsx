#target indesign
//target indesign-10.064

$.evalFile(new File("c:/Adobe/scripts/readClassXML.jsx"));
$.evalFile(new File("c:/Adobe/scripts/utils.jsx"));
$.evalFile(new File("c:/Adobe/scripts/initClassParms.jsx"));
$.evalFile(new File("c:/Adobe/scripts/checkSchool.jsx"));

var count = 1;
var pdfName = '';
var newjpgfolder ='';

process();

function process(){
    
    $.writeln("Inside Indesign")
    //initialize processor (including parms)
    var gP = new Processor();
    var strTitle = "Process Class";

    $.writeln("Inside Indesign")
    //read in parameters from xml file
    g_script_XMLFunctions.ReadXMLFile(gP.params, strTitle);
    
    //populate folders and folder parms
    gP.setUpFolders();

    //check image counts and finish if incorrect
//~     if ( g_FolderCheck.folderCheck( gP.params["source"], gP.params["imagecount"] ) )  {  return;  }

    $.writeln("Calling process class")
    //process classes in school
    gP.processSchool();
    
    alert('Finished!');
}

function Processor() {
    this.params = g_initParams.initParams();
    
    this.setUpFolders= function() { 
        //set up all required folders
        //output folder
        var outputFolder = new Folder( this.params["source"] + '//Output'  );
        if (!outputFolder.exists) outputFolder.create();    
        this.params['outputfolder'] = outputFolder.fsName;
        
        //internet folder
        var internetFolder = new Folder( this.params["source"] + '//Internet'  );
        if (!internetFolder.exists) internetFolder.create();
        this.params['internetfolder'] = internetFolder.fsName;
        
        //print folder
        var printFolder = new Folder( this.params["source"] + '//Print'  );
        if (!printFolder.exists) printFolder.create();    
        this.params['printfolder'] = printFolder.fsName;
    }

    this.processSchool = function(){
        //pick a class at a time
        // Create new folder object based on path string  
        var editedFolder = new Folder( this.params['source'] + '//Edited' );  
        
        //look for pupil folders inside class
//~         var pupilFolder = new Folder(pupilArray[j]);
        this.params['jpgfolder']  = editedFolder.getFiles("JPEG");  
        $.writeln( 'Got jpg folder' )
        
//~         var templatePath = "C:\\Adobe\\templates\\" + this.params["template"];
//~         templatePath =  templatePath.replace(/%20/g, ' ') 
//~         app.open( templatePath); 

        //loop over pictures placing them in the template
        this.processFiles ();          
    }

    this.processFiles = function(){
          
         // Create new folder object based on path string  
         var jpgFolder = new Folder( this.params['jpgfolder'] );  
         var filesArray = new Array();
      
         // Get all files in the current folder  
         var files = jpgFolder.getFiles();  

         // Loop over the files in the files object  
         for (var i = 0; i < files.length; i++)  
         {  
              // Check if the file is an instance of a file   
              if (files[i] instanceof File)  
              {   
                   // Convert the file object to a string for matching purposes (match only works on String objects)  
                   var fileString = String(files[i]);  
                   $.writeln( fileString )
                   this.params['ref'] = files[i].name.substring(0,5) 
      
                   // Check if the file contains the right extension  
                   if ( fileString.match(/.(jpg)$/i) || fileString.match(/.(CR2)$/i) )  
                   {  
                        // Place the images to be used in the template in an array  
//~                         filesArray.push(fileString);
                        $.writeln("placing files")
                        
                        //create random password for internet folders
                        this.params['rand'] = randomString(3);
                        //pass files array and place files
                        this.placeFiles ( files[i] )
                        
                        $.writeln("writing password file")
                        //write details of file and password to a text file
                        pw = this.params['ref']+ this.params['rand'];
                        writeToFile (this.params['ref'] + ' - ' + pw, this.params['internetfolder'] );
//~                         writeToFile (this.params['ref'] + ' - ' + pw, this.params['source'] + '\\' + this.params['ref'] + '\\' + this.params['pupilname']);
                   }  
              }  
         }      
        
        //remove the JPEG folder and contents (it's been copied to internet)        
        this.deleteFiles(jpgFolder); 
        jpgFolder.remove();            
    }

    this.placeFiles = function( file ){
        
        var templatePath = "C:\\Adobe\\templates\\" + this.params["template"];
        templatePath =  templatePath.replace(/%20/g, ' ') 
        app.open( templatePath); 
        
        var doc = app.activeDocument;            
        var f = new File(file);  
        doc.pages[0].rectangles[0].place(f, false);  
        doc.pages[0].rectangles[0].images[0].select();
        sel = doc.selection[0];
        var h = sel.geometricBounds[2] - sel.geometricBounds[0];
        var w = sel.geometricBounds[3] - sel.geometricBounds[1] ;
        doc.pages[0].rectangles[0].images[0].fit(FitOptions.PROPORTIONALLY); 

         doc.pages[0].rectangles[0].images[0].fit(FitOptions.PROPORTIONALLY); 

        //move files into a  class folder in internet  with a _TIF_PEFN suffix
        var newFolderName = this.params['ref'] + this.params['rand'];
        var destinationFolder = new Folder(this.params['internetfolder'] + "\\" + this.params['ref'] + "_TIF_PEFN" + "\\" + newFolderName);

        var jpgFolder = new Folder( this.params['internetfolder'] + this.params['internetfolder'].substring(this.params['internetfolder'].lastIndexOf('\\') ) +  this.params['ref'] + '_TIF_PEFN'  + "\\" + newFolderName);

        if (!destinationFolder.exists) destinationFolder.create();

        //copy file to internet folder
        f.copy(destinationFolder + "\\" +f.displayName);
        
        var allTextFrames = doc.textFrames;        
        
        var tf = allTextFrames[0];          
        tf.contents = this.params['info']
        
        var tf = allTextFrames[1];          
        tf.contents = this.params['watermark']
        
        var tf = allTextFrames[3];          
        tf.contents = this.params['ref']
        
        var tf = allTextFrames[2];          
        tf.contents =this.params['ref']+ this.params['rand']
        
        //store ref for filename
        pdfName = this.params['ref'];
        
        $.writeln("export pdf")
        this.exportPDF();        
    };

    this.exportPDF = function(){
        //export finished doc
        var outputFolder = new Folder( this.params["source"] + '//Output' );
        if (!outputFolder.exists) outputFolder.create();
        $.writeln("ready to export")
        app.activeDocument.exportFile (ExportFormat.PDF_TYPE, File(outputFolder + "\\"+this.params['ref']+".pdf"), false, "Adobe PDF Preset 1");
        $.writeln("close doc")
        app.activeDocument.close(SaveOptions.no); 
    }

    //remove all files in the jpg folder
    this.deleteFiles = function(filesArray){
    
         var jpgFolder = new Folder( this.params['jpgfolder'] );  
      
         // Get all files in the current folder  
         var files = jpgFolder.getFiles();  

         // Loop over the files in the files object  
         for (var i = 0; i < files.length; i++) 
         {
             var f = new File(files[i]);    
             f.remove();            
         }
    }
}

 function writeToFile(text, logPath) {
    path = logPath +  "\\" + "paswords.txt" 
	file = new File(path);
	file.encoding = "UTF-8";
	if (file.exists) {
		file.open("e");
		file.seek(0, 2);
	}
	else {
		file.open("w");
	}
	file.write(text); 
    file.writeln();
	file.close();
}

