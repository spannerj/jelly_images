#target indesign
//target indesign-10.064

$.evalFile(new File("c:/Adobe/scripts/readXML.jsx"));
$.evalFile(new File("c:/Adobe/scripts/utils.jsx"));
$.evalFile(new File("c:/Adobe/scripts/initParms.jsx"));
$.evalFile(new File("c:/Adobe/scripts/checkSchool.jsx"));

var count = 1;
var pdfName = '';
var newjpgfolder ='';

process();

function process(){
    
    $.writeln("Inside Indesign")
    //initialize processor (including parms)
    var gP = new Processor();
    var strTitle = "Process School";

    $.writeln("Read XML file")
    //read in parameters from xml file
    g_script_XMLFunctions.ReadXMLFile(gP.params, strTitle);
    
    //populate folders and folder parms
    gP.setUpFolders();

    //check image counts and finish if incorrect
    if ( g_FolderCheck.folderCheck( gP.params["source"], gP.params["imagecount"] ) )  {  return;  }

    $.writeln("Calling process school")
    //process classes in school
    gP.processSchool();
    
     $.writeln("Move files to Dropbox")
//~     All processing done so now move Edit, Internet and Order folders to Dropbox
    gP.moveToDropbox();
    
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
        var printFolder = new Folder( this.params["source"] + '//Orders'  );
        if (!printFolder.exists) printFolder.create();    
        this.params['printfolder'] = printFolder.fsName;     
        
        //sims folder
        var printFolder = new Folder( this.params["source"] + '//Sims'  );
        if (!printFolder.exists) printFolder.create();    
        this.params['simsfolder'] = printFolder.fsName;
    }

    this.processSchool = function(){
        //pick a class at a time
        // Create new folder object based on path string  
        var editedFolder = new Folder( this.params['source'] + '//Edited' );  

        // Get everything in the top folder  
        var classArray = editedFolder.getFiles(onlyFolders);     
        
         // Loop over the folders and files 
         for (var i = 0; i < classArray.length; i++)  
         { 
              //  ignore files and loop through folders
              if (classArray[i] instanceof Folder)  
              {  
                  //save class name
                 this.params['classname'] = classArray[i].name;
                  
                  //look for pupil folders inside class
                  var classFolder = new Folder(classArray[i]);
                  
                  //create class folder inside the sims folder                  
                  var simsClassFolder = new Folder( this.params["simsfolder"] + '//' + classFolder.name );
                  if (!simsClassFolder.exists) simsClassFolder.create();
                  
                  //get all pupils in the class
                  var pupilArray = classFolder.getFiles(onlyFolders);    
                  
                  //loop over class folder getting pupil folders
                  for (var j = 0; j < pupilArray.length; j++)
                  {
                      //  ignore files and loop through folders
                      if (pupilArray[j] instanceof Folder)  
                      {  
                          //save pupil name
                          this.params['pupilname'] = pupilArray[j].name;     
                          
                          //look for pupil folders inside class
                          var pupilFolder = new Folder(pupilArray[j]);
                          this.params['jpgfolder']  = pupilFolder.getFiles("JPEG");         
                          
                          var templatePath = "C:\\Adobe\\templates\\" + this.params["template"];
                          templatePath =  templatePath.replace(/%20/g, ' ') 
                          app.open( templatePath);  
                          
                          //loop over pictures placing them in the template
                          this.processFiles ();
                      }
                  }
             }
         }
    }

    this.processFiles = function(){
          
          //create random password for internet folders
          this.params['rand'] = randomString(3);        
        
          // Create new folder object based on path string  
         var jpgFolder = new Folder( this.params['jpgfolder'] );  
         var filesArray = new Array();
      
         // Get all files in the current folder  
         var files = jpgFolder.getFiles();  
         this.params['ref'] = this.params['pupilname'].replace('%20',' ');
        
         // Loop over the files in the files object  
         for (var i = 0; i < files.length; i++)  
         {  
              // Check if the file is an instance of a file   
              if (files[i] instanceof File)  
              {   
                   // Convert the file object to a string for matching purposes (match only works on String objects)  
                   var fileString = String(files[i]);  
      
                   // Check if the file contains the right extension  
                   if ( fileString.match(/.(jpg)$/i) || fileString.match(/.(CR2)$/i) )  
                   {  
                        // Place the images to be used in the template in an array  
                        filesArray.push(fileString);
                   }  
              }  
         }      
        
        $.writeln("placing files")
        //pass files array and place files
        this.placeFiles ( filesArray )
        
        $.writeln("writing password file")
        //write details of file and password to a text file
        pw = this.params['ref']+ this.params['rand'];
        writeToFile (this.params['ref'] + ' - ' + pw, this.params['source'] + '\\' + this.params['class'] + '\\' + this.params['pupilname']);
        
        //remove the JPEG folder and contents (it's been copied to internet)        
        this.deleteFiles(filesArray); 
        jpgFolder.remove();            
    }

    this.placeFiles = function( filesArray ){
        var doc = app.activeDocument;      

         for (j=0; j<this.params['imagecount']; j+=1)
         {            
            var f = new File(filesArray[j]);  
            
            // Convert the file object to a string for matching purposes (match only works on String objects)  
            var fileString = String(f); 
            
            //copy the first image to the class folder inside the sims folder. nb. first image ends with -1 or -01 followed by the file extension
            if ( fileString.match(/-(0?)1.(jpg)$/i) || fileString.match(/-(0?)1.(CR2)$/i) ) 
            {
                f.copy(new Folder(this.params['simsfolder'] + "\\" + this.params['classname'] + "\\" +f.displayName));
            }       
            
            doc.pages[0].rectangles[j].place(f, false);  
            doc.pages[0].rectangles[j].images[0].select();
            sel = doc.selection[0];
            var h = sel.geometricBounds[2] - sel.geometricBounds[0];
            var w = sel.geometricBounds[3] - sel.geometricBounds[1] ;
            doc.pages[0].rectangles[j].images[0].fit(FitOptions.PROPORTIONALLY); 
            if (w > h)
            {
                    sel.rotationAngle = 90;
            }
             doc.pages[0].rectangles[j].images[0].fit(FitOptions.PROPORTIONALLY); 

            //move files into a  class folder in internet  with a _TIF_PEFN suffix
            var newFolderName = this.params['ref'] + this.params['rand'];
            var destinationFolder = new Folder(this.params['internetfolder'] + "\\" + this.params['classname'] + "_TIF_PEFN" + "\\" + newFolderName);

            var jpgFolder = new Folder( this.params['internetfolder'] + this.params['internetfolder'].substring(this.params['internetfolder'].lastIndexOf('\\') ) +  this.params['classname'] + '_TIF_PEFN'  + "\\" + newFolderName);

            if (!destinationFolder.exists) destinationFolder.create();

            //copy file to internet folder
            f.copy(destinationFolder + "\\" +f.displayName);
         }

         var allTextFrames = doc.textFrames;
         for (j=0; j<this.params['imagecount'];j+=1)
        {        
            var tf = allTextFrames[j];          
            tf.contents = this.params['watermark']
        }
        pw = newFolderName.replace('%20',' ');
        var tf = allTextFrames[ parseInt(this.params['imagecount']) ];
        tf.contents = this.params['ref'].replace('%20',' ');
        
        var refFrame = allTextFrames[ parseInt(this.params['imagecount'])+1 ] ;
        refFrame.contents = pw;
        
        var onlineFrame = allTextFrames[ parseInt(this.params['imagecount'])+2 ] ;
        onlineFrame.contents = this.params['watermark'];
        
        var deliveredFrame = allTextFrames[ parseInt(this.params['imagecount'])+3 ] ;
        deliveredFrame.contents = this.params['info'];
        
        //store ref for filename
        pdfName = this.params['ref'];
        
        $.writeln("export pdf")
        this.exportPDF();        
    };

    this.exportPDF = function(){
        //export finished doc
        var outputFolder = new Folder( this.params["source"] + '//Output'   + '//' + this.params['classname'] );
        if (!outputFolder.exists) outputFolder.create();
        $.writeln("ready to export")
        app.activeDocument.exportFile (ExportFormat.PDF_TYPE, File(outputFolder + "\\"+this.params['ref']+".pdf"), false, "Adobe PDF Preset 1");
        $.writeln("close doc")
        app.activeDocument.close(SaveOptions.no); 
    }

    //remove all files in the jpg folder
    this.deleteFiles = function(filesArray){
         for (j=0; j<parseInt(this.params['imagecount']);j+=1)
        {            
            var f = new File(filesArray[j]);    
            f.remove();
        }
    }

    this.moveToDropbox = function(){
 
        $.writeln("Move Internet folder to Dropbox")
        copyFolder(new Folder(this.params["source"] + '//Internet'),   new Folder( this.params["dest"] + '\\Internet'));
        
        $.writeln("Remove Internet folder")
        removeFolder(new Folder(this.params["source"] + '//Internet')) ;
        
        $.writeln("Move Edited folder to Dropbox")
        copyFolder( new Folder( this.params["source"] + '//Edited'),  new Folder( this.params["dest"] + '//Edited'));
        
        $.writeln("Remove Edited folder")
        removeFolder( new Folder( this.params["source"] + '//Edited')) ;
        
        $.writeln("Move Order folder to Dropbox")
        copyFolder( new Folder( this.params["source"] + '//Orders'),  new Folder( this.params["dest"] + '//Orders'));
        
        $.writeln("Remove Order folder")
        removeFolder( new Folder( this.params["source"] + '//Orders'));
    }    
}  
  
  
function removeFolder(deleteFolder){
    var deleteChildrenArr = deleteFolder.getFiles();
    for (var i = 0; i < deleteChildrenArr.length; i++) {
        var deleteChild = deleteChildrenArr[i]; 
        if (deleteChild instanceof File) {  
            deleteChild.remove();  
        }  
        else {  
            removeFolder(deleteChild);  
            deleteChild.remove();
        } 
    }
    deleteFolder.remove();
}

  
function copyFolder(sourceFolder, destinationFolder) {  
    var sourceChildrenArr = sourceFolder.getFiles();  
    if (sourceChildrenArr.length > 0)
    {
        for (var i = 0; i < sourceChildrenArr.length; i++) {  
            var sourceChild = sourceChildrenArr[i];  
            var destinationChildStr = destinationFolder.fsName + "/" + sourceChild.name;  
            if (sourceChild instanceof File) {  
                copyFile(sourceChild, new File(destinationChildStr));  
            }  
            else {  
                copyFolder(sourceChild, new Folder(destinationChildStr));  
            }  
        } 
    }
    else
    {
        var destFolder = new Folder( destinationFolder );
        if (!destFolder.exists) destFolder.create();   
    }
}  
  
  
function copyFile(sourceFile, destinationFile) {  
    createFolder(destinationFile.parent);  
    sourceFile.copy(destinationFile);  
}  
  
  
function createFolder(folder) {  
    if (folder.parent !== null && !folder.parent.exists) {  
        createFolder(folder.parent);  
    }  
    folder.create();  
} 

 function writeToFile(text, logPath) {
    path = logPath + "_TIF_PEFN" + "\\" + "paswords.txt" 
	file = new File(path);
	file.encoding = "UTF-8";
	if (file.exists) {
		file.open("e");
		file.seek(0, 2);
	}
	else {
		file.open("w");
	}
	file.write(text + "\r\n"); 
	file.close();
}

